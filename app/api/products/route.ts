import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const prisma = getClient();
    try {
        const where: Record<string, unknown> = { isActive: true };
        if (category && category !== 'all') where.category = category;
        if (search) where.name = { contains: search, mode: 'insensitive' };

        if (dealerId) {
            // Return products with dealer's inventory prices and stock
            const inventory = await prisma.dealerInventory.findMany({
                where: { dealerId, product: where },
                include: {
                    product: {
                        select: { id: true, name: true, description: true, category: true, unit: true, imageUrl: true },
                    },
                },
                orderBy: { product: { name: 'asc' } },
            });

            const products = inventory.map((inv) => ({
                id: inv.id,
                productId: inv.product.id,
                inventoryId: inv.id,
                name: inv.product.name,
                description: inv.product.description,
                category: inv.product.category,
                unit: inv.product.unit,
                imageUrl: inv.product.imageUrl,
                price: Number(inv.price),
                quantity: inv.quantity,
            }));

            // Get categories for filter
            const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
            return NextResponse.json({ products, categories });
        }

        // No dealerId — return all active products
        const raw = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            select: { id: true, name: true, description: true, category: true, unit: true, basePrice: true, imageUrl: true },
        });
        const products = raw.map((p) => ({ ...p, price: Number(p.basePrice), quantity: 0 }));
        const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
        return NextResponse.json({ products, categories });
    } catch (err) {
        console.error('[API/products] error:', err);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
