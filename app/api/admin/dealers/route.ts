import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dealers = await prisma.dealer.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { orders: true } },
                orders: { where: { status: { not: 'cancelled' } }, select: { total: true } },
            },
        });

        return NextResponse.json({
            dealers: dealers.map(d => ({
                id: d.id,
                name: d.name,
                phone: d.phone,
                email: d.email,
                address: d.address,
                isActive: d.isActive,
                coverageRadiusKm: Number(d.coverageRadiusKm),
                orderCount: d._count.orders,
                totalRevenue: d.orders.reduce((s, o) => s + Number(o.total), 0),
                createdAt: d.createdAt,
            })),
        });
    } catch (err) {
        console.error('[admin/dealers GET]', err);
        return NextResponse.json({ error: 'Failed to fetch dealers' }, { status: 500 });
    }
}
