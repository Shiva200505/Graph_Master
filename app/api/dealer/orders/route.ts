import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'dealer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = { dealerId: session.id };
    if (status !== 'all') where.status = status;
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where, skip, take: limit,
                orderBy: { createdAt: 'desc' },
                include: { items: { select: { quantity: true, productName: true } } },
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id, orderNumber: o.orderNumber, customerName: o.customerName,
                customerPhone: o.customerPhone, deliveryAddress: o.deliveryAddress,
                fulfillmentType: o.fulfillmentType, status: o.status,
                total: Number(o.total), deliveryCharge: Number(o.deliveryCharge),
                itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
                itemNames: o.items.slice(0, 2).map(i => i.productName).join(', '),
                createdAt: o.createdAt,
            })),
            total,
            totalPages: Math.ceil(total / limit),
            page,
        });
    } catch (err) {
        console.error('[dealer/orders GET]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
