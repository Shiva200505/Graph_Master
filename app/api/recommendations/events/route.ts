import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/recommendations/events
 * Track farmer behavior signals.
 * Body: { eventType, productId, dealerId?, userLat?, userLng?, sessionId? }
 * eventType: 'view' | 'cart_add' | 'cart_remove' | 'purchase'
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventType, productId, dealerId, userLat, userLng, sessionId } = body;

        if (!eventType || !productId) {
            return NextResponse.json({ error: 'eventType and productId required' }, { status: 400 });
        }

        const VALID_EVENTS = ['view', 'cart_add', 'cart_remove', 'purchase'];
        if (!VALID_EVENTS.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
        }

        // Get user session if available (anonymous tracking also supported)
        const session = await getSession().catch(() => null);

        await prisma.recommendationEvent.create({
            data: {
                eventType,
                productId,
                dealerId: dealerId || null,
                userId: session?.role === 'customer' ? session.id : null,
                sessionId: sessionId || null,
                userLat: userLat ? parseFloat(userLat) : null,
                userLng: userLng ? parseFloat(userLng) : null,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        // Silently fail — don't block user experience for tracking
        console.error('[rec/events]', err);
        return NextResponse.json({ ok: false });
    }
}
