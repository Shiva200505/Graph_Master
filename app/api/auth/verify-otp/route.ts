import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, buildSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/\s+/g, '');
        const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

        if (!user || !user.otp || !user.otpExpiry) {
            return NextResponse.json({ error: 'OTP not found. Please request a new one.' }, { status: 400 });
        }

        if (user.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
        }

        if (new Date() > user.otpExpiry) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // Clear OTP and mark verified
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpiry: null, isVerified: true },
        });

        const token = await signToken(
            { id: user.id, phone: user.phone, name: user.name ?? 'Customer', role: 'customer' },
            '7d'
        );

        return NextResponse.json(
            { ok: true, user: { id: user.id, phone: user.phone, name: user.name } },
            {
                status: 200,
                headers: { 'Set-Cookie': buildSessionCookie(token) },
            }
        );
    } catch (err) {
        console.error('[verify-otp]', err);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
