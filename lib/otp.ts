/** Generate a random 6-digit OTP */
export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** OTP TTL in minutes */
export const OTP_TTL_MINUTES = 10;

/** Get expiry date for OTP */
export function getOtpExpiry(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + OTP_TTL_MINUTES);
    return d;
}

/**
 * Send OTP to user's phone.
 * - DEV: prints to console (free, instant)
 * - PROD: swap this with MSG91 / Twilio / 2Factor API call
 */
export async function sendOtp(phone: string, otp: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        console.log('\n════════════════════════════════════');
        console.log(`📱 OTP for ${phone}: ${otp}`);
        console.log(`   Expires in ${OTP_TTL_MINUTES} minutes`);
        console.log('════════════════════════════════════\n');
        return;
    }

    // ─── PRODUCTION: plug in your SMS provider here ────────────────
    // Example: MSG91
    // await fetch(`https://api.msg91.com/api/v5/otp?...`, {
    //   method: 'POST',
    //   body: JSON.stringify({ mobile: phone, otp, template_id: process.env.MSG91_TEMPLATE_ID }),
    //   headers: { authkey: process.env.MSG91_AUTHKEY!, 'content-type': 'application/json' },
    // });
    // ──────────────────────────────────────────────────────────────
    throw new Error('SMS provider not configured for production');
}
