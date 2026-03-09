import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';
import { haversineKm, calcDeliveryCharge } from '@/lib/haversine';
import { notifyOrderPlaced } from '@/lib/notify';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        dealerId, customerName, customerPhone, deliveryAddress,
        fulfillmentType, items, userId,
        userLat, userLng,   // ← new: user's coordinates for distance-based delivery
    } = body;

    if (!dealerId || !customerName || !customerPhone || !deliveryAddress || !items?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { prisma, pool } = getClient();
    try {
        // Generate order number
        const orderNumber = `GM${Date.now().toString().slice(-8)}`;

        // Calculate subtotal
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.unitPrice * item.quantity;
        }

        // ── Distance-based delivery charge ────────────────────────────────────
        let deliveryCharge = 0;
        let distanceKm: number | null = null;
        let dealerLat: number | null = null;
        let dealerLng: number | null = null;

        if (fulfillmentType === 'delivery') {
            // Fetch dealer coordinates from PostGIS
            const locResult = await prisma.$queryRaw<{ dlat: number; dlng: number }[]>`
                SELECT ST_Y(location::geometry) AS dlat, ST_X(location::geometry) AS dlng
                FROM dealers WHERE id = ${dealerId}::uuid LIMIT 1
            `;
            if (locResult.length && locResult[0].dlat != null) {
                dealerLat = locResult[0].dlat;
                dealerLng = locResult[0].dlng;
            }

            if (userLat && userLng && dealerLat && dealerLng) {
                distanceKm = Math.round(haversineKm(userLat, userLng, dealerLat, dealerLng) * 10) / 10;
                deliveryCharge = calcDeliveryCharge(distanceKm, subtotal, 'delivery');
            } else {
                // Fallback: flat rate if coordinates not available
                deliveryCharge = subtotal >= 2000 ? 0 : 50;
            }
        }

        const total = subtotal + deliveryCharge;

        // Create order + items in transaction + deduct inventory
        const order = await prisma.$transaction(async (tx) => {
            // Verify & deduct inventory for each item
            for (const item of items) {
                const inv = await tx.dealerInventory.findFirst({
                    where: { id: item.inventoryId, dealerId },
                });
                if (!inv || inv.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for: ${item.productName}`);
                }
                await tx.dealerInventory.update({
                    where: { id: item.inventoryId },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            // Create order
            const newOrder = await tx.order.create({
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
                    status: 'pending',
                    paymentStatus: 'pending',
                    items: {
                        create: items.map((item: {
                            productId?: string; productName: string; unit: string;
                            unitPrice: number; quantity: number; subtotal: number
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
                include: {
                    items: true,
                    dealer: { select: { name: true } },
                },
            });

            return newOrder;
        });

        // ── Notifications (non-blocking) ──────────────────────────────────────
        notifyOrderPlaced({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            dealerName: order.dealer.name,
            items: order.items.map((i) => ({
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
            })),
            total: Number(order.total),
            fulfillmentType: order.fulfillmentType as 'pickup' | 'delivery',
            deliveryAddress: order.deliveryAddress,
            orderId: order.id,
        }).catch((e) => console.error('[notify] Error:', e));

        return NextResponse.json({
            order: { ...order, distanceKm },
            success: true,
        }, { status: 201 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create order';
        console.error('[API/orders POST]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
