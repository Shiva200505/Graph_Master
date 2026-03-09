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

        const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

        if (!admin || !admin.isActive) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await signToken({
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'admin',
        });

        return NextResponse.json(
            { ok: true, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } },
            {
                status: 200,
                headers: { 'Set-Cookie': buildSessionCookie(token) },
            }
        );
    } catch (err) {
        console.error('[admin/login]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
