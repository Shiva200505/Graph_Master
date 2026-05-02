import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: { ids?: unknown; status?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids must be a non-empty array', code: 'INVALID_IDS' }, { status: 400 });
    }
    if (!ids.every(id => typeof id === 'string')) {
        return NextResponse.json({ error: 'All ids must be strings', code: 'INVALID_IDS' }, { status: 400 });
    }
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
        return NextResponse.json(
            { error: `status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
            { status: 400 }
        );
    }

    // Cap bulk operations at 200 orders
    const safeIds = (ids as string[]).slice(0, 200);

    try {
        const result = await prisma.order.updateMany({
            where: { id: { in: safeIds } },
            data: { status },
        });

        return NextResponse.json({
            ok: true,
            count: result.count,
            status,
        });
    } catch (err) {
        console.error('[admin/orders/bulk-update POST]', err);
        return NextResponse.json({ error: 'Bulk update failed', code: 'DB_ERROR' }, { status: 500 });
    }
}
