import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalOrders,
            pendingOrders,
            activeDealers,
            totalProducts,
            newCustomers,
            revenueResult,
            todayOrdersResult,
            statusBreakdown,
            recentOrders,
        ] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'pending' } }),
            prisma.dealer.count({ where: { isActive: true } }),
            prisma.product.count({ where: { isActive: true } }),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
            prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: todayStart }, status: { not: 'cancelled' } } }),
            prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
            prisma.order.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                include: { dealer: { select: { name: true } }, items: { select: { quantity: true } } },
            }),
        ]);

        return NextResponse.json({
            totalOrders,
            pendingOrders,
            activeDealers,
            totalProducts,
            newCustomers,
            totalRevenue: Number(revenueResult._sum.total ?? 0),
            todayRevenue: Number(todayOrdersResult._sum.total ?? 0),
            statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count.id })),
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                dealerName: o.dealer.name,
                itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
                total: Number(o.total),
                status: o.status,
                createdAt: o.createdAt,
            })),
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
