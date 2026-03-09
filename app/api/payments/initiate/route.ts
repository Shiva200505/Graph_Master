import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';
import { initiatePhonePePayment } from '@/lib/phonepe';
import { haversineKm, calcDeliveryCharge } from '@/lib/haversine';
import { notifyOrderPlaced } from '@/lib/notify';

export const dynamic = 'force-dynamic';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

/**
 * POST /api/payments/initiate
 * 1. Creates order with status = 'pending_payment'
 * 2. Creates Payment record
 * 3. Calls PhonePe to get redirect URL
 * 4. Returns { redirectUrl } to frontend
 *
 * Inventory is NOT deducted yet — deduction happens in callback after payment confirmation.
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        dealerId, customerName, customerPhone, deliveryAddress,
        fulfillmentType, items, userId, userLat, userLng,
    } = body;

    if (!dealerId || !customerName || !customerPhone || !deliveryAddress || !items?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { prisma, pool } = getClient();
    try {
        const orderNumber = `GM${Date.now().toString().slice(-8)}`;
        const merchantTxnId = `TXN-${orderNumber}-${Date.now().toString().slice(-4)}`;

        // Calculate subtotal
        let subtotal = 0;
        for (const item of items) subtotal += item.unitPrice * item.quantity;

        // Distance-based delivery charge
        let deliveryCharge = 0;
        if (fulfillmentType === 'delivery') {
            if (userLat && userLng) {
                const locResult = await prisma.$queryRaw<{ dlat: number; dlng: number }[]>`
          SELECT ST_Y(location::geometry) AS dlat, ST_X(location::geometry) AS dlng
          FROM dealers WHERE id = ${dealerId}::uuid LIMIT 1
        `;
                if (locResult.length && locResult[0].dlat != null) {
                    const dist = haversineKm(userLat, userLng, locResult[0].dlat, locResult[0].dlng);
                    deliveryCharge = calcDeliveryCharge(dist, subtotal, 'delivery');
                } else {
                    deliveryCharge = subtotal >= 2000 ? 0 : 50;
                }
            } else {
                deliveryCharge = subtotal >= 2000 ? 0 : 50;
            }
        }
        const total = subtotal + deliveryCharge;

        // Check stock availability (but don't deduct yet)
        for (const item of items) {
            const inv = await prisma.dealerInventory.findFirst({
                where: { id: item.inventoryId, dealerId },
            });
            if (!inv || inv.quantity < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for: ${item.productName}` },
                    { status: 409 }
                );
            }
        }

        // Create order with pending_payment status
        const order = await prisma.order.create({
            data: {
                orderNumber,
                dealerId,
                userId: userId ?? null,
                customerName,
                customerPhone,
                deliveryAddress,
                fulfillmentType,
                subtotal,
                deliveryCharge,
                total,
                status: 'pending_payment',
                paymentStatus: 'pending',
                items: {
                    create: items.map((item: {
                        productId?: string; productName: string; unit: string;
                        unitPrice: number; quantity: number;
                    }) => ({
                        productId: item.productId ?? null,
                        productName: item.productName,
                        unit: item.unit,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        subtotal: item.unitPrice * item.quantity,
                    })),
                },
            },
            include: { items: true, dealer: { select: { name: true } } },
        });

        // Create Payment record
        await prisma.payment.create({
            data: {
                orderId: order.id,
                merchantTransactionId: merchantTxnId,
                amount: total,
                status: 'pending',
            },
        });

        // Initiate PhonePe
        const ppResult = await initiatePhonePePayment({
            merchantTransactionId: merchantTxnId,
            amount: total,
            mobileNumber: customerPhone,
            orderId: order.id,
        });

        if (!ppResult.success || !ppResult.redirectUrl) {
            // Clean up order if PhonePe fails
            await prisma.order.delete({ where: { id: order.id } });
            return NextResponse.json({ error: ppResult.error ?? 'Payment initiation failed' }, { status: 502 });
        }

        // Send WhatsApp notification (non-blocking) — payment pending state
        notifyOrderPlaced({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            dealerName: order.dealer.name,
            items: order.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
            total: Number(order.total),
            fulfillmentType: order.fulfillmentType as 'pickup' | 'delivery',
            deliveryAddress: order.deliveryAddress,
            orderId: order.id,
        }).catch((e) => console.error('[notify] Error:', e));

        return NextResponse.json({ redirectUrl: ppResult.redirectUrl, orderId: order.id });
    } catch (err) {
        console.error('[payments/initiate]', err);
        return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
