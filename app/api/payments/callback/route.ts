import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@/app/generated/prisma';
import { verifyPhonePeCallback, checkPhonePeStatus } from '@/lib/phonepe';

export const dynamic = 'force-dynamic';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

/**
 * POST /api/payments/callback
 * Called by PhonePe server after payment attempt.
 * 1. Verifies checksum
 * 2. Checks status with PhonePe
 * 3. On success: deducts inventory, marks order confirmed
 * 4. On failure: marks order failed
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { response: base64Response } = body;
    const xVerify = req.headers.get('x-verify') ?? '';

    // Verify checksum
    if (!verifyPhonePeCallback(base64Response, xVerify)) {
        console.warn('[payments/callback] Checksum mismatch — possible tampering');
        return NextResponse.json({ error: 'Invalid checksum' }, { status: 403 });
    }

    // Decode PhonePe response
    let decoded: Record<string, unknown>;
    try {
        decoded = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
    } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const merchantTxnId = decoded.data
        ? (decoded.data as Record<string, unknown>).merchantTransactionId as string
        : undefined;

    if (!merchantTxnId) {
        return NextResponse.json({ error: 'Missing merchantTransactionId' }, { status: 400 });
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

        // Confirm with PhonePe (don't just trust callback — always re-verify)
        const statusResult = await checkPhonePeStatus(merchantTxnId);

        if (statusResult.success) {
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
                        transactionId: statusResult.transactionId,
                        responseData: decoded as Prisma.InputJsonValue,
                    },
                });

                // Confirm order
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: 'confirmed', paymentStatus: 'paid' },
                });
            });

            console.log(`[callback] Order ${payment.orderId} confirmed via PhonePe`);
        } else {
            // ── Payment FAILED ──────────────────────────────────────────────────────
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'failed', responseData: decoded as Prisma.InputJsonValue },
            });
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'cancelled', paymentStatus: 'failed' },
            });

            console.log(`[callback] Order ${payment.orderId} payment failed`);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[payments/callback]', err);
        return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
