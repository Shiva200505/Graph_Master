import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search') ?? '';
    const limitParam = searchParams.get('limit') ?? '10';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.min(parseInt(limitParam) || 10, 200);
    const page = isAll ? 1 : Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const skip = isAll ? 0 : (page - 1) * limit;

    // Date range filter
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerPhone: { contains: search } },
        ];
    }
    if (fromStr || toStr) {
        const createdAt: Record<string, Date> = {};
        if (fromStr) createdAt.gte = new Date(`${fromStr}T00:00:00.000Z`);
        if (toStr) createdAt.lte = new Date(`${toStr}T23:59:59.999Z`);
        where.createdAt = createdAt;
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
            totalPages: isAll ? 1 : Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('[admin/orders GET]', err);
        return NextResponse.json({ error: 'Failed to fetch orders', code: 'DB_ERROR' }, { status: 500 });
    }
}
