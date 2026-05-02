import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/inventory?dealerId=uuid
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dealerId = new URL(req.url).searchParams.get('dealerId');
    if (!dealerId) return NextResponse.json({ error: 'dealerId is required' }, { status: 400 });

    try {
        const inventory = await prisma.dealerInventory.findMany({
            where: { dealerId },
            include: { product: { select: { name: true, category: true, unit: true, basePrice: true } } },
            orderBy: [{ quantity: 'asc' }, { updatedAt: 'desc' }],
        });

        return NextResponse.json({
            inventory: inventory.map(i => ({
                id: i.id,
                dealerId: i.dealerId,
                productId: i.productId,
                productName: i.product.name,
                category: i.product.category ?? '',
                unit: i.product.unit ?? '',
                basePrice: Number(i.product.basePrice),
                price: i.price ? Number(i.price) : null,
                quantity: i.quantity,
                updatedAt: i.updatedAt,
            })),
        });
    } catch (err) {
        console.error('[admin/inventory GET]', err);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

// POST /api/admin/inventory — add product to dealer inventory (upsert)
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { dealerId, productId, quantity, price } = await req.json();
        if (!dealerId || !productId) return NextResponse.json({ error: 'dealerId and productId are required' }, { status: 400 });
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 0) return NextResponse.json({ error: 'quantity must be a non-negative integer' }, { status: 400 });
        const priceNum = price != null ? parseFloat(price) : null;
        if (priceNum != null && priceNum <= 0) return NextResponse.json({ error: 'price must be greater than 0' }, { status: 400 });

        const item = await prisma.dealerInventory.upsert({
            where: { dealerId_productId: { dealerId, productId } },
            update: {
                quantity: qty,
                ...(priceNum != null ? { price: priceNum } : {}),
            },
            create: {
                dealerId,
                productId,
                quantity: qty,
                ...(priceNum != null ? { price: priceNum } : {}),
            },
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
        }, { status: 201 });
    } catch (err) {
        console.error('[admin/inventory POST]', err);
        return NextResponse.json({ error: 'Failed to add product to inventory' }, { status: 500 });
    }
}
