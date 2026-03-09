import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'dealer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const inventory = await prisma.dealerInventory.findMany({
            where: { dealerId: session.id },
            include: { product: { select: { name: true, category: true, unit: true, basePrice: true } } },
            orderBy: [{ quantity: 'asc' }, { updatedAt: 'desc' }],
        });

        return NextResponse.json({
            inventory: inventory.map(i => ({
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
        });
    } catch (err) {
        console.error('[dealer/inventory GET]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
