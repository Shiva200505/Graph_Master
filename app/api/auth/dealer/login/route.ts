import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, buildSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const dealer = await prisma.dealer.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!dealer || !dealer.isActive) {
            return NextResponse.json({ error: 'Invalid credentials or account inactive' }, { status: 401 });
        }

        if (!dealer.passwordHash) {
            return NextResponse.json({ error: 'Password not set. Contact admin.' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, dealer.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await signToken({
            id: dealer.id,
            email: dealer.email ?? undefined,
            name: dealer.name,
            role: 'dealer',
        });

        return NextResponse.json(
            { ok: true, dealer: { id: dealer.id, name: dealer.name, email: dealer.email } },
            {
                status: 200,
                headers: { 'Set-Cookie': buildSessionCookie(token) },
            }
        );
    } catch (err) {
        console.error('[dealer/login]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
