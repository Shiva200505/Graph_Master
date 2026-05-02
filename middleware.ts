import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'gm-super-secret-jwt-key-change-in-prod'
);
const COOKIE = 'gm_session';

// ── In-memory rate limiter ────────────────────────────────────────────────────
//
// ⚠️  IMPORTANT: This implementation works for single-instance deployments only.
// For multi-instance / serverless production deployments, replace this Map with
// a Redis-backed store (e.g. ioredis + Upstash) so rate limits are shared across
// all running instances. Example: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
//
interface RateLimitEntry {
    count: number;
    windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitRule {
    maxRequests: number;
    windowMs: number; // sliding window in ms
}

const RATE_RULES: Record<string, RateLimitRule> = {
    '/api/auth/send-otp':    { maxRequests: 5,  windowMs: 10 * 60 * 1000 }, // 5 / 10 min
    '/api/auth/verify-otp':  { maxRequests: 10, windowMs: 10 * 60 * 1000 }, // 10 / 10 min
    '/api/auth/admin/login': { maxRequests: 10, windowMs: 5  * 60 * 1000 }, // 10 / 5 min
};

/**
 * Returns { allowed, remaining, retryAfterSec }
 * Uses a fixed window starting from first request.
 */
function checkRateLimit(key: string, rule: RateLimitRule): {
    allowed: boolean;
    remaining: number;
    retryAfterSec: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > rule.windowMs) {
        // New window
        rateLimitStore.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: rule.maxRequests - 1, retryAfterSec: 0 };
    }

    if (entry.count >= rule.maxRequests) {
        const retryAfterSec = Math.ceil((rule.windowMs - (now - entry.windowStart)) / 1000);
        return { allowed: false, remaining: 0, retryAfterSec };
    }

    entry.count += 1;
    return { allowed: true, remaining: rule.maxRequests - entry.count, retryAfterSec: 0 };
}

/** Get the real client IP from common headers (works behind Vercel / nginx / Cloudflare) */
function getClientIP(req: NextRequest): string {
    return (
        req.headers.get('cf-connecting-ip') ??
        req.headers.get('x-real-ip') ??
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        'unknown'
    );
}

// Periodically prune stale entries to prevent memory growth
// (runs at most once per ~5 minutes per cold start)
let lastPrune = 0;
function maybePruneStore() {
    const now = Date.now();
    if (now - lastPrune < 5 * 60 * 1000) return;
    lastPrune = now;
    for (const [key, entry] of rateLimitStore.entries()) {
        // Remove entries older than the longest window (10 min)
        if (now - entry.windowStart > 10 * 60 * 1000) rateLimitStore.delete(key);
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always forward pathname as a header so layouts can read it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);

    // ── Rate limiting (API routes only) ───────────────────────────────────────
    const rule = RATE_RULES[pathname];
    if (rule) {
        maybePruneStore();
        const ip = getClientIP(req);
        const key = `${ip}:${pathname}`;
        const { allowed, remaining, retryAfterSec } = checkRateLimit(key, rule);

        if (!allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests, please wait.',
                    retryAfter: retryAfterSec,
                    code: 'RATE_LIMITED',
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfterSec),
                        'X-RateLimit-Limit': String(rule.maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil((Date.now() + retryAfterSec * 1000) / 1000)),
                    },
                }
            );
        }

        // Attach rate limit headers to the forwarded request
        requestHeaders.set('X-RateLimit-Remaining', String(remaining));
    }

    // ── Admin routes ──────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        const token = req.cookies.get(COOKIE)?.value;
        if (!token) {
            const res = NextResponse.redirect(new URL('/admin/login', req.url));
            res.cookies.delete(COOKIE);
            return res;
        }
        try {
            const { payload } = await jwtVerify(token, SECRET);
            if (payload.role !== 'admin') throw new Error('not admin');
        } catch {
            const res = NextResponse.redirect(new URL('/admin/login', req.url));
            res.cookies.delete(COOKIE);
            return res;
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // ── Dealer routes ─────────────────────────────────────────────────────────
    if (pathname.startsWith('/dealer') && !pathname.startsWith('/dealer/login')) {
        const token = req.cookies.get(COOKIE)?.value;
        if (!token) {
            const res = NextResponse.redirect(new URL('/dealer/login', req.url));
            res.cookies.delete(COOKIE);
            return res;
        }
        try {
            const { payload } = await jwtVerify(token, SECRET);
            if (payload.role !== 'dealer') throw new Error('not dealer');
        } catch {
            const res = NextResponse.redirect(new URL('/dealer/login', req.url));
            res.cookies.delete(COOKIE);
            return res;
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // ── Customer account ──────────────────────────────────────────────────────
    if (pathname.startsWith('/account')) {
        const token = req.cookies.get(COOKIE)?.value;
        if (!token) return NextResponse.redirect(new URL('/login?next=/account', req.url));
        try {
            const { payload } = await jwtVerify(token, SECRET);
            if (payload.role !== 'customer') throw new Error('not customer');
        } catch {
            return NextResponse.redirect(new URL('/login?next=/account', req.url));
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dealer/:path*',
        '/account/:path*',
        // Rate-limited API endpoints
        '/api/auth/send-otp',
        '/api/auth/verify-otp',
        '/api/auth/admin/login',
    ],
};
