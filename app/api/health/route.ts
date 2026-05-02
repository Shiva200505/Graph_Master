import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const REQUIRED_ENV = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PHONEPE_MERCHANT_ID',
    'PHONEPE_SALT_KEY',
    'NEXT_PUBLIC_APP_URL',
];

export const dynamic = 'force-dynamic';

export async function GET() {
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version ?? '1.0.0';

    // ── DB check ─────────────────────────────────────────────────────────────
    let dbStatus: 'connected' | 'error' = 'error';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (err) {
        console.error('[health] DB check failed:', err);
    }

    // ── Service configuration check ──────────────────────────────────────────
    const services = {
        database: dbStatus,
        phonepe: process.env.PHONEPE_MERCHANT_ID ? 'configured' : 'not_configured',
        whatsapp: process.env.WHATSAPP_TOKEN ? 'configured' : 'mock',
        email: process.env.RESEND_API_KEY ? 'configured' : 'mock',
        ml: process.env.ML_SERVICE_URL ? 'configured' : 'fallback',
        sms: process.env.MSG91_AUTHKEY ? 'configured' : 'console_log',
    } as const;

    // ── Missing required env vars ────────────────────────────────────────────
    const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);

    // ── Overall health status ────────────────────────────────────────────────
    const isUnhealthy = dbStatus === 'error';
    const isDegraded = !isUnhealthy && (
        services.phonepe === 'not_configured' ||
        missingEnv.length > 0
    );

    const status: 'healthy' | 'degraded' | 'unhealthy' =
        isUnhealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy';

    const body = {
        status,
        timestamp,
        version,
        services,
        ...(missingEnv.length > 0 && { missingEnv }),
        environment: process.env.NODE_ENV ?? 'unknown',
    };

    return NextResponse.json(body, {
        status: isUnhealthy ? 503 : 200,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Health-Status': status,
        },
    });
}
