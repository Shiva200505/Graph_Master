import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@/app/generated/prisma';
import { verifySignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

/**
 * POST /api/payments/callback
 * Called by the frontend after Razorpay checkout returns success.
 * 1. Verifies Razorpay signature
 * 2. On success: deducts inventory, marks order confirmed
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, merchantTxnId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !merchantTxnId) {
        return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        console.warn('[payments/callback] Razorpay signature mismatch — possible tampering');
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 403 });
    }

    const { prisma, pool } = getClient();
    try {
        // Find payment record
        const payment = await prisma.payment.findUnique({
            where: { merchantTransactionId: merchantTxnId },
            include: {
                order: {
                    include: {
                        items: true,
                        dealer: { select: { id: true } },
                    },
                },
            },
        });

        if (!payment) {
            console.error('[callback] Payment not found for txnId:', merchantTxnId);
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Check if already processed
        if (payment.status === 'success') {
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // ── Payment SUCCESS ─────────────────────────────────────────────────────
        await prisma.$transaction(async (tx) => {
            // Deduct inventory now
            for (const item of payment.order.items) {
                const inv = await tx.dealerInventory.findFirst({
                    where: { productId: item.productId ?? undefined, dealerId: payment.order.dealer.id },
                });
                if (inv) {
                    await tx.dealerInventory.update({
                        where: { id: inv.id },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
            }

            // Update payment record
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'success',
                    transactionId: razorpay_payment_id,
                    responseData: { razorpay_order_id, razorpay_payment_id, razorpay_signature } as Prisma.InputJsonValue,
                },
            });

            // Confirm order
            await tx.order.update({
                where: { id: payment.orderId },
                data: { status: 'confirmed', paymentStatus: 'paid' },
            });
        });

        console.log(`[callback] Order ${payment.orderId} confirmed via Razorpay`);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[payments/callback]', err);
        return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
