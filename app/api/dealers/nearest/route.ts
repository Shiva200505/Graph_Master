import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        // PostGIS query: find nearest active dealer within 50 km
        const result = await pool.query(
            `SELECT
         id,
         name,
         phone,
         email,
         address,
         coverage_radius_km,
         ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
       FROM dealers
       WHERE is_active = true
         AND location IS NOT NULL
       ORDER BY distance_km ASC
       LIMIT 5`,
            [lng, lat]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ dealer: null, message: 'No dealers found nearby' });
        }

        const nearest = result.rows[0];
        return NextResponse.json({
            dealer: {
                id: nearest.id,
                name: nearest.name,
                phone: nearest.phone,
                email: nearest.email,
                address: nearest.address,
                coverageRadiusKm: Number(nearest.coverage_radius_km),
                distanceKm: Math.round(nearest.distance_km * 10) / 10,
            },
            nearby: result.rows.slice(0, 3).map((r) => ({
                id: r.id,
                name: r.name,
                distanceKm: Math.round(r.distance_km * 10) / 10,
            })),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[API/dealers/nearest] error:', message, err);
        return NextResponse.json(
            { error: 'Failed to find nearest dealer', code: 'DB_QUERY_FAILED' },
            { status: 500 }
        );
    } finally {
        await pool.end();
    }
}
