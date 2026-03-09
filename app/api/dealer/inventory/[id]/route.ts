import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'dealer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        // Verify this item belongs to the dealer
        const item = await prisma.dealerInventory.findFirst({ where: { id, dealerId: session.id } });
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        const { quantity, price } = await req.json();
        const data: Record<string, unknown> = {};
        if (quantity !== undefined && quantity >= 0) data.quantity = parseInt(quantity);
        if (price !== undefined && price >= 0) data.price = parseFloat(price);

        const updated = await prisma.dealerInventory.update({ where: { id }, data });
        return NextResponse.json({ ok: true, item: { ...updated, price: updated.price ? Number(updated.price) : null } });
    } catch (err) {
        console.error('[dealer/inventory/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
