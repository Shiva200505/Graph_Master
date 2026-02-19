import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

function getClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { prisma, pool } = getClient();
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { orderBy: { createdAt: 'asc' } },
                dealer: { select: { id: true, name: true, phone: true, address: true } },
                payment: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (err) {
        console.error('[API/orders/:id]', err);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
