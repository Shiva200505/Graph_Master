import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations?lat=X&lng=Y&productId=Z&limit=N
 *
 * Proxies to ML microservice when available.
 * Falls back to top-selling products from DB when ML service is down.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const productId = searchParams.get('productId');
    const limit = searchParams.get('limit') ?? '4';
    const mlUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8001';

    // Try ML service first
    try {
        const params = new URLSearchParams({ limit });
        if (lat) params.set('lat', lat);
        if (lng) params.set('lng', lng);
        if (productId) params.set('product_id', productId);

        const mlRes = await fetch(`${mlUrl}/recommend?${params}`, {
            signal: AbortSignal.timeout(2000), // 2s timeout — don't block page load
        });

        if (mlRes.ok) {
            const data = await mlRes.json();
            return NextResponse.json({ source: 'ml', recommendations: data.recommendations ?? [] });
        }
    } catch {
        // ML service unavailable — use fallback
    }

    // ── Fallback: top-selling products ──────────────────────────────────────────
    try {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const limitNum = Math.min(parseInt(limit, 10) || 4, 8);

        const rows = await pool.query<{
            id: string; name: string; category: string; base_price: string; image_url: string | null;
        }>(
            `SELECT p.id, p.name, p.category, p.base_price, p.image_url
       FROM products p
       JOIN order_items oi ON oi.product_id = p.id  
       WHERE p.is_active = true
       GROUP BY p.id, p.name, p.category, p.base_price, p.image_url
       ORDER BY COUNT(oi.id) DESC
       LIMIT $1`,
            [limitNum]
        );

        await pool.end();

        const recommendations = rows.rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            price: parseFloat(r.base_price),
            imageUrl: r.image_url,
        }));

        return NextResponse.json({ source: 'fallback', recommendations });
    } catch (err) {
        console.error('[recommendations fallback]', err);
        return NextResponse.json({ source: 'fallback', recommendations: [] });
    }
}
