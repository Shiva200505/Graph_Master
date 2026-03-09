import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.description !== undefined ? { description: body.description } : {}),
                ...(body.category !== undefined ? { category: body.category } : {}),
                ...(body.unit !== undefined ? { unit: body.unit } : {}),
                ...(body.basePrice !== undefined ? { basePrice: parseFloat(body.basePrice) } : {}),
                ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
            },
        });
        return NextResponse.json({ ok: true, product: { ...product, basePrice: Number(product.basePrice) } });
    } catch (err) {
        console.error('[admin/products/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        // Soft delete — just deactivate
        await prisma.product.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[admin/products/:id DELETE]', err);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
