import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { haversineKm, calcDeliveryCharge } from '@/lib/haversine';

/**
 * GET /api/delivery-charge?dealerId=X&lat=Y&lng=Z&subtotal=N&fulfillmentType=delivery
 * Returns a live delivery charge preview before checkout submission.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const subtotal = parseFloat(searchParams.get('subtotal') ?? '0');
    const fulfillmentType = (searchParams.get('fulfillmentType') ?? 'delivery') as 'pickup' | 'delivery';

    if (!dealerId || isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ charge: 0, distanceKm: 0 });
    }

    try {
        // Fetch dealer location from DB using raw ST_X / ST_Y (PostGIS)
        const result = await prisma.$queryRaw<{ dlat: number; dlng: number }[]>`
      SELECT ST_Y(location::geometry) AS dlat, ST_X(location::geometry) AS dlng
      FROM dealers WHERE id = ${dealerId}::uuid LIMIT 1
    `;

        if (!result.length || result[0].dlat == null) {
            // Dealer has no location — fall back to flat rate
            const charge = fulfillmentType === 'pickup' ? 0 : subtotal >= 2000 ? 0 : 50;
            return NextResponse.json({ charge, distanceKm: null });
        }

        const { dlat, dlng } = result[0];
        const distanceKm = Math.round(haversineKm(lat, lng, dlat, dlng) * 10) / 10;
        const charge = calcDeliveryCharge(distanceKm, subtotal, fulfillmentType);

        return NextResponse.json({ charge, distanceKm });
    } catch (err) {
        console.error('[delivery-charge]', err);
        return NextResponse.json({ charge: 50, distanceKm: null });
    }
}
