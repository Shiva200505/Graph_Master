import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const dealer = await prisma.dealer.findUnique({
            where: { id },
            include: {
                inventory: { include: { product: { select: { name: true, category: true, unit: true, basePrice: true } } }, orderBy: { updatedAt: 'desc' } },
                orders: { take: 10, orderBy: { createdAt: 'desc' }, include: { items: { select: { quantity: true } } } },
            },
        });
        if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

        return NextResponse.json({
            dealer: {
                ...dealer,
                passwordHash: undefined,
                coverageRadiusKm: Number(dealer.coverageRadiusKm),
                inventory: dealer.inventory.map(i => ({
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
                orders: dealer.orders.map(o => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customerName,
                    total: Number(o.total),
                    status: o.status,
                    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
                    createdAt: o.createdAt,
                })),
            },
        });
    } catch (err) {
        console.error('[admin/dealers/:id GET]', err);
        return NextResponse.json({ error: 'Failed to fetch dealer' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json();
        const { name, phone, email, address, coverageRadiusKm, isActive, password, lat, lng } = body;

        // ── Build Prisma update payload (scalar fields) ─────────────────────────
        const prismaData: Record<string, unknown> = {};
        if (typeof isActive === 'boolean') prismaData.isActive = isActive;
        if (name) prismaData.name = name;
        if (phone) prismaData.phone = phone;
        if (email) prismaData.email = email.trim().toLowerCase();
        if (address) prismaData.address = address;
        if (coverageRadiusKm !== undefined) prismaData.coverageRadiusKm = Number(coverageRadiusKm);
        if (password && password.length >= 8) {
            prismaData.passwordHash = await bcrypt.hash(password, 10);
        }

        const dealer = await prisma.dealer.update({
            where: { id },
            data: prismaData,
            select: { id: true, name: true, isActive: true, email: true },
        });

        // ── Update PostGIS location if lat/lng supplied ──────────────────────────
        if (lat != null && lng != null) {
            await prisma.$executeRaw`
                UPDATE dealers
                SET location = ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography,
                    updated_at = NOW()
                WHERE id = ${id}
            `;
        }

        return NextResponse.json({ ok: true, dealer });
    } catch (err) {
        console.error('[admin/dealers/:id PATCH]', err);
        return NextResponse.json({ error: 'Failed to update dealer' }, { status: 500 });
    }
}
