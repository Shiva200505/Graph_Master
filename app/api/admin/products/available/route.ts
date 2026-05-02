import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/products/available?dealerId=uuid
// Returns all active products NOT yet in the specified dealer's inventory
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dealerId = new URL(req.url).searchParams.get('dealerId');
    if (!dealerId) return NextResponse.json({ error: 'dealerId is required' }, { status: 400 });

    try {
        // Get product IDs already in this dealer's inventory
        const existing = await prisma.dealerInventory.findMany({
            where: { dealerId },
            select: { productId: true },
        });
        const existingIds = existing.map(e => e.productId);

        // Return active products NOT in that set
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
            },
            select: { id: true, name: true, category: true, unit: true, basePrice: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        return NextResponse.json({
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category ?? '',
                unit: p.unit ?? '',
                basePrice: Number(p.basePrice),
            })),
        });
    } catch (err) {
        console.error('[admin/products/available GET]', err);
        return NextResponse.json({ error: 'Failed to fetch available products' }, { status: 500 });
    }
}
