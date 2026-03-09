/**
 * PhonePe Payment Gateway — UAT + Production helper
 *
 * Env vars required:
 *   PHONEPE_MERCHANT_ID   — from PhonePe business dashboard
 *   PHONEPE_SALT_KEY      — from PhonePe business dashboard
 *   PHONEPE_SALT_INDEX    — usually "1"
 *   PHONEPE_API_URL       — UAT: https://api-preprod.phonepe.com/apis/pg-sandbox
 *                           Prod: https://api.phonepe.com/apis/hermes
 *   NEXT_PUBLIC_APP_URL   — e.g. https://grapemaster.com
 */

import crypto from 'crypto';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID ?? 'PGTESTPAYUAT';
const SALT_KEY = process.env.PHONEPE_SALT_KEY ?? '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX ?? '1';
const API_BASE = process.env.PHONEPE_API_URL ?? 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const PAY_ENDPOINT = '/pg/v1/pay';
const STATUS_ENDPOINT = '/pg/v1/status';

// ── SHA256 Checksum helpers ─────────────────────────────────────────────────

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function makeChecksum(base64Payload: string, endpoint: string): string {
    return `${sha256(base64Payload + endpoint + SALT_KEY)}###${SALT_INDEX}`;
}

// ── Initiate Payment ────────────────────────────────────────────────────────

export interface PhonePeInitiateParams {
    merchantTransactionId: string; // unique per transaction, e.g. GM-<orderId>
    amount: number;                // total in RUPEES (will be converted to paise)
    mobileNumber: string;
    orderId: string;
}

export interface PhonePeInitiateResult {
    success: boolean;
    redirectUrl?: string;         // PhonePe payment page URL
    error?: string;
}

export async function initiatePhonePePayment(
    params: PhonePeInitiateParams
): Promise<PhonePeInitiateResult> {
    const callbackUrl = `${APP_URL}/api/payments/callback`;
    const redirectUrl = `${APP_URL}/payment/success?txnId=${params.merchantTransactionId}`;

    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: params.merchantTransactionId,
        merchantUserId: `USER-${params.orderId}`,
        amount: Math.round(params.amount * 100), // paise
        redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl,
        mobileNumber: params.mobileNumber.replace(/\D/g, '').slice(-10),
        paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = makeChecksum(base64Payload, PAY_ENDPOINT);

    try {
        const res = await fetch(`${API_BASE}${PAY_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                accept: 'application/json',
            },
            body: JSON.stringify({ request: base64Payload }),
        });

        const data = await res.json();

        if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
            return { success: true, redirectUrl: data.data.instrumentResponse.redirectInfo.url };
        }

        console.error('[PhonePe] Initiate failed:', JSON.stringify(data));
        return { success: false, error: data.message ?? 'Payment initiation failed' };
    } catch (err) {
        console.error('[PhonePe] Network error:', err);
        return { success: false, error: 'Payment gateway unreachable' };
    }
}

// ── Check Payment Status ────────────────────────────────────────────────────

export interface PhonePeStatusResult {
    success: boolean;
    code?: string;       // PAYMENT_SUCCESS | PAYMENT_ERROR | PAYMENT_PENDING
    state?: string;      // COMPLETED | FAILED | PENDING
    transactionId?: string;
    amount?: number;     // paise
    error?: string;
}

export async function checkPhonePeStatus(
    merchantTransactionId: string
): Promise<PhonePeStatusResult> {
    const endpoint = `${STATUS_ENDPOINT}/${MERCHANT_ID}/${merchantTransactionId}`;
    const checksum = makeChecksum('', endpoint);

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID,
                accept: 'application/json',
            },
        });

        const data = await res.json();

        return {
            success: data.code === 'PAYMENT_SUCCESS',
            code: data.code,
            state: data.data?.state,
            transactionId: data.data?.transactionId,
            amount: data.data?.amount,
        };
    } catch (err) {
        console.error('[PhonePe] Status check error:', err);
        return { success: false, error: 'Status check failed' };
    }
}

// ── Verify Callback Checksum ────────────────────────────────────────────────

export function verifyPhonePeCallback(
    base64Response: string,
    receivedChecksum: string
): boolean {
    const expected = `${sha256(base64Response + SALT_KEY)}###${SALT_INDEX}`;
    return expected === receivedChecksum;
}
