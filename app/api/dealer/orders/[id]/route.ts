import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const DEALER_ALLOWED = ['confirmed', 'dispatched', 'delivered', 'cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'dealer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        // Verify this order belongs to the dealer
        const order = await prisma.order.findFirst({ where: { id, dealerId: session.id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const { status } = await req.json();
        if (!DEALER_ALLOWED.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

        const updated = await prisma.order.update({
            where: { id },
            data: { status },
            select: { id: true, orderNumber: true, status: true },
        });
        return NextResponse.json({ ok: true, order: updated });
    } catch (err) {
        console.error('[dealer/orders/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
