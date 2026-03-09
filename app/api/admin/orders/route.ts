import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerPhone: { contains: search } },
        ];
    }

    try {
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    dealer: { select: { name: true } },
                    items: { select: { quantity: true, subtotal: true } },
                },
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                customerPhone: o.customerPhone,
                dealerName: o.dealer.name,
                itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
                subtotal: Number(o.subtotal),
                total: Number(o.total),
                fulfillmentType: o.fulfillmentType,
                status: o.status,
                createdAt: o.createdAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('[admin/orders GET]', err);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
