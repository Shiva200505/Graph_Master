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
 *
 * Environments:
 *  - development / test → logs to console (free, instant, no external calls)
 *  - production         → MSG91 REST API (set MSG91_AUTHKEY + MSG91_TEMPLATE_ID)
 *
 * To switch provider: replace the MSG91 block below with Twilio / 2Factor / etc.
 */
export async function sendOtp(phone: string, otp: string): Promise<void> {
    // ── Development: pretty-print to console ─────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
        console.log('\n════════════════════════════════════');
        console.log(`📱 OTP for ${phone}: ${otp}`);
        console.log(`   Expires in ${OTP_TTL_MINUTES} minutes`);
        console.log('════════════════════════════════════\n');
        return;
    }

    // ── Production: MSG91 ─────────────────────────────────────────────────────
    const authKey = process.env.MSG91_AUTHKEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
        // Fail fast in production with a clear actionable message
        throw new Error(
            'SMS provider not configured. ' +
            'Set MSG91_AUTHKEY and MSG91_TEMPLATE_ID environment variables.'
        );
    }

    // Normalise phone: strip non-digits, ensure +91 prefix for India
    const mobile = `91${phone.replace(/\D/g, '')}`;

    const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
            authkey: authKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            template_id: templateId,
            mobile,
            otp,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => '(no body)');
        throw new Error(`MSG91 OTP send failed [${response.status}]: ${errorBody}`);
    }

    const result = await response.json().catch(() => null);
    if (result?.type === 'error') {
        throw new Error(`MSG91 error: ${result.message ?? JSON.stringify(result)}`);
    }
}
