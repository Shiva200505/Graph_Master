import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOtp, getOtpExpiry, sendOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
            return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/\s+/g, '');
        const otp = generateOtp();
        const otpExpiry = getOtpExpiry();

        // Upsert user record
        await prisma.user.upsert({
            where: { phone: cleanPhone },
            update: { otp, otpExpiry },
            create: { phone: cleanPhone, otp, otpExpiry },
        });

        await sendOtp(cleanPhone, otp);

        return NextResponse.json({ ok: true, message: 'OTP sent successfully' });
    } catch (err) {
        console.error('[send-otp]', err);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
