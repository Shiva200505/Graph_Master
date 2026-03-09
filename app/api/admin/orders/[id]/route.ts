import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                dealer: { select: { id: true, name: true, phone: true, email: true, address: true } },
                items: true,
            },
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        return NextResponse.json({
            order: {
                ...order,
                subtotal: Number(order.subtotal),
                total: Number(order.total),
                deliveryCharge: Number(order.deliveryCharge),
                items: order.items.map(i => ({
                    ...i,
                    unitPrice: Number(i.unitPrice),
                    subtotal: Number(i.subtotal),
                })),
            },
        });
    } catch (err) {
        console.error('[admin/orders/:id GET]', err);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const { status } = await req.json();
        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            select: { id: true, orderNumber: true, status: true },
        });
        return NextResponse.json({ ok: true, order });
    } catch (err) {
        console.error('[admin/orders/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
