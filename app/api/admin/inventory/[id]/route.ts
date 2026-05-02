import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH /api/admin/inventory/[id] — update quantity and/or price
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();
        const updateData: Record<string, unknown> = {};

        if (body.quantity !== undefined) {
            const qty = parseInt(body.quantity, 10);
            if (isNaN(qty) || qty < 0) return NextResponse.json({ error: 'quantity must be >= 0' }, { status: 400 });
            updateData.quantity = qty;
        }
        if (body.price !== undefined && body.price !== null && body.price !== '') {
            const price = parseFloat(body.price);
            if (isNaN(price) || price <= 0) return NextResponse.json({ error: 'price must be > 0' }, { status: 400 });
            updateData.price = price;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        const item = await prisma.dealerInventory.update({
            where: { id },
            data: updateData,
            include: { product: { select: { name: true, category: true, unit: true, basePrice: true } } },
        });

        return NextResponse.json({
            ok: true,
            item: {
                id: item.id,
                dealerId: item.dealerId,
                productId: item.productId,
                productName: item.product.name,
                category: item.product.category ?? '',
                unit: item.product.unit ?? '',
                basePrice: Number(item.product.basePrice),
                price: item.price ? Number(item.price) : null,
                quantity: item.quantity,
                updatedAt: item.updatedAt,
            },
        });
    } catch (err) {
        console.error('[admin/inventory/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
    }
}

// DELETE /api/admin/inventory/[id] — remove product from dealer inventory
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        await prisma.dealerInventory.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[admin/inventory/:id DELETE]', err);
        return NextResponse.json({ error: 'Failed to remove inventory item' }, { status: 500 });
    }
}
