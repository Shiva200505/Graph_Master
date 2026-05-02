import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const bcrypt = require('bcryptjs');

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: { newPassword?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
            { error: 'New password must be at least 8 characters', code: 'VALIDATION_ERROR' },
            { status: 400 }
        );
    }

    try {
        const { id } = await params;
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.$executeRaw`
            UPDATE dealers SET password_hash = ${passwordHash}, updated_at = NOW()
            WHERE id = ${id}::uuid
        `;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[admin/dealers/reset-password]', err);
        return NextResponse.json({ error: 'Failed to reset password', code: 'DB_ERROR' }, { status: 500 });
    }
}
