import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'dealer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [totalOrders, pendingOrders, todayRevenue, lowStockCount, recentOrders] = await Promise.all([
            prisma.order.count({ where: { dealerId: session.id } }),
            prisma.order.count({ where: { dealerId: session.id, status: 'pending' } }),
            prisma.order.aggregate({ _sum: { total: true }, where: { dealerId: session.id, createdAt: { gte: todayStart }, status: { not: 'cancelled' } } }),
            prisma.dealerInventory.count({ where: { dealerId: session.id, quantity: { lt: 10 } } }),
            prisma.order.findMany({
                where: { dealerId: session.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { items: { select: { quantity: true } } },
            }),
        ]);

        return NextResponse.json({
            totalOrders,
            pendingOrders,
            todayRevenue: Number(todayRevenue._sum.total ?? 0),
            lowStockCount,
            recentOrders: recentOrders.map(o => ({
                id: o.id, orderNumber: o.orderNumber, customerName: o.customerName,
                total: Number(o.total), status: o.status, createdAt: o.createdAt,
                itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
            })),
        });
    } catch (err) {
        console.error('[dealer/stats]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
