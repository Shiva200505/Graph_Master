import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const dealer = await prisma.dealer.findUnique({
            where: { id },
            include: {
                inventory: { include: { product: { select: { name: true, category: true, unit: true, basePrice: true } } }, orderBy: { updatedAt: 'desc' } },
                orders: { take: 10, orderBy: { createdAt: 'desc' }, include: { items: { select: { quantity: true } } } },
            },
        });
        if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

        return NextResponse.json({
            dealer: {
                ...dealer,
                passwordHash: undefined,
                coverageRadiusKm: Number(dealer.coverageRadiusKm),
                inventory: dealer.inventory.map(i => ({
                    id: i.id,
                    productId: i.productId,
                    productName: i.product.name,
                    category: i.product.category,
                    unit: i.product.unit,
                    basePrice: Number(i.product.basePrice),
                    price: i.price ? Number(i.price) : null,
                    quantity: i.quantity,
                    updatedAt: i.updatedAt,
                })),
                orders: dealer.orders.map(o => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customerName,
                    total: Number(o.total),
                    status: o.status,
                    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
                    createdAt: o.createdAt,
                })),
            },
        });
    } catch (err) {
        console.error('[admin/dealers/:id GET]', err);
        return NextResponse.json({ error: 'Failed to fetch dealer' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();
        const dealer = await prisma.dealer.update({
            where: { id },
            data: {
                ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
                ...(body.name ? { name: body.name } : {}),
                ...(body.phone ? { phone: body.phone } : {}),
                ...(body.coverageRadiusKm !== undefined ? { coverageRadiusKm: body.coverageRadiusKm } : {}),
            },
            select: { id: true, name: true, isActive: true },
        });
        return NextResponse.json({ ok: true, dealer });
    } catch (err) {
        console.error('[admin/dealers/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update dealer' }, { status: 500 });
    }
}
