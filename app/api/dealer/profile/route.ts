import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET — dealer own profile
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'dealer') {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    try {
        const dealers = await prisma.$queryRaw<{
            id: string; name: string; phone: string; email: string;
            address: string; coverage_radius_km: number; is_active: boolean;
            lat: number | null; lng: number | null;
        }[]>`
            SELECT d.id, d.name, d.phone, d.email, d.address,
                   d.coverage_radius_km,
                   d.is_active,
                   ST_Y(d.location::geometry) AS lat,
                   ST_X(d.location::geometry) AS lng
            FROM dealers d WHERE d.id = ${session.id}::uuid LIMIT 1
        `;

        if (!dealers.length) {
            return NextResponse.json({ error: 'Dealer not found', code: 'NOT_FOUND' }, { status: 404 });
        }

        const d = dealers[0];
        return NextResponse.json({
            dealer: {
                id: d.id,
                name: d.name,
                phone: d.phone,
                email: d.email,
                address: d.address,
                coverageRadiusKm: Number(d.coverage_radius_km),
                isActive: d.is_active,
                lat: d.lat,
                lng: d.lng,
            },
        });
    } catch (err) {
        console.error('[dealer/profile GET]', err);
        return NextResponse.json({ error: 'Failed to fetch profile', code: 'DB_ERROR' }, { status: 500 });
    }
}

// PATCH — dealer updates own profile (limited fields only)
export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'dealer') {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: { phone?: string; address?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.phone !== undefined) {
        const cleaned = body.phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleaned)) {
            return NextResponse.json(
                { error: 'Phone must be a valid 10-digit Indian mobile number', code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }
        updates.push(`phone = $${idx++}`);
        values.push(cleaned);
    }

    if (body.address !== undefined) {
        if (!body.address.trim()) {
            return NextResponse.json({ error: 'Address cannot be empty', code: 'VALIDATION_ERROR' }, { status: 400 });
        }
        updates.push(`address = $${idx++}`);
        values.push(body.address.trim());
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'No updatable fields provided', code: 'NO_CHANGES' }, { status: 400 });
    }

    try {
        // Build raw SQL safely (only phone + address allowed; email/location/radius = admin-only)
        await prisma.$executeRawUnsafe(
            `UPDATE dealers SET ${updates.join(', ')}, updated_at = NOW() WHERE id = '${session.id}'::uuid`,
            ...values
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[dealer/profile PATCH]', err);
        return NextResponse.json({ error: 'Failed to update profile', code: 'DB_ERROR' }, { status: 500 });
    }
}
