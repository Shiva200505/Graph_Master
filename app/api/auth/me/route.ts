import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // For non-customer sessions (admin/dealer), return session info directly
    if (session.role !== 'customer') {
        return NextResponse.json({
            id: session.id,
            name: session.name,
            email: session.email ?? null,
            phone: session.phone ?? null,
            role: session.role,
            isVerified: true,
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { id: true, phone: true, name: true, isVerified: true },
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            id: user.id,
            phone: user.phone,
            name: user.name ?? null,
            isVerified: user.isVerified,
            role: 'customer',
        });
    } catch (err) {
        console.error('[auth/me]', err);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}
