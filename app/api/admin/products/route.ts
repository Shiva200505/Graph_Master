import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { inventory: true, orderItems: true } } },
    });

    return NextResponse.json({
        products: products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            unit: p.unit,
            basePrice: Number(p.basePrice),
            isActive: p.isActive,
            dealerCount: p._count.inventory,
            orderCount: p._count.orderItems,
            createdAt: p.createdAt,
        })),
    });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, description, category, unit, basePrice } = await req.json();
        if (!name || !category || !unit || !basePrice) {
            return NextResponse.json({ error: 'name, category, unit, basePrice are required' }, { status: 400 });
        }
        const product = await prisma.product.create({
            data: { name, description, category, unit, basePrice: parseFloat(basePrice), isActive: true },
        });
        return NextResponse.json({ ok: true, product: { ...product, basePrice: Number(product.basePrice) } }, { status: 201 });
    } catch (err) {
        console.error('[admin/products POST]', err);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
