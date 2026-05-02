import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dealers = await prisma.dealer.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { orders: true } },
                orders: { where: { status: { not: 'cancelled' } }, select: { total: true } },
                inventory: { where: { quantity: { lt: 10 } }, select: { id: true } },
            },
        });

        return NextResponse.json({
            dealers: dealers.map(d => ({
                id: d.id,
                name: d.name,
                phone: d.phone,
                email: d.email,
                address: d.address,
                isActive: d.isActive,
                coverageRadiusKm: Number(d.coverageRadiusKm),
                orderCount: d._count.orders,
                totalRevenue: d.orders.reduce((s, o) => s + Number(o.total), 0),
                lowStockCount: d.inventory.length,
                createdAt: d.createdAt,
            })),
        });
    } catch (err) {
        console.error('[admin/dealers GET]', err);
        return NextResponse.json({ error: 'Failed to fetch dealers' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, phone, email, password, address, lat, lng, coverageRadiusKm } = body;

        // ── Validation ──────────────────────────────────────────────────────────
        if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        if (!phone?.trim()) return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
        if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        if (!address?.trim()) return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        if (lat == null || lng == null) return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });

        // Check duplicate email
        const existing = await prisma.dealer.findUnique({ where: { email } });
        if (existing) return NextResponse.json({ error: 'A dealer with this email already exists' }, { status: 400 });

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const radiusKm = Number(coverageRadiusKm) || 15;

        // Insert using raw SQL with PostGIS geography column
        await prisma.$executeRaw`
            INSERT INTO dealers (id, name, phone, email, password_hash, address, location, coverage_radius_km, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                ${name.trim()},
                ${phone.trim()},
                ${email.trim().toLowerCase()},
                ${passwordHash},
                ${address.trim()},
                ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography,
                ${radiusKm},
                true,
                NOW(),
                NOW()
            )
        `;

        // Fetch back the newly created dealer to return its id
        const newDealer = await prisma.dealer.findUnique({
            where: { email: email.trim().toLowerCase() },
            select: { id: true, name: true, email: true },
        });

        return NextResponse.json({ ok: true, dealer: newDealer }, { status: 201 });
    } catch (err) {
        console.error('[admin/dealers POST]', err);
        return NextResponse.json({ error: 'Failed to create dealer' }, { status: 500 });
    }
}
