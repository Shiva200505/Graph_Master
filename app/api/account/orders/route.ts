import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'customer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const userPhone = session.phone?.replace(/\s+/g, '');
        const whereClause = {
            OR: [
                { userId: session.id },
                ...(userPhone ? [{ customerPhone: userPhone }] : [])
            ]
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                skip,
                take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { select: { productName: true, quantity: true, unitPrice: true, subtotal: true } },
                dealer: { select: { name: true, phone: true } },
            },
        }),
        prisma.order.count({ where: whereClause })
    ]);

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                dealerId: o.dealerId,
                dealerName: o.dealer.name,
                fulfillmentType: o.fulfillmentType,
                status: o.status,
                total: Number(o.total),
                deliveryCharge: Number(o.deliveryCharge),
                createdAt: o.createdAt,
                items: o.items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal) })),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('[account/orders]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
