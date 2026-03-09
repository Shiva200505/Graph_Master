import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'gm-super-secret-jwt-key-change-in-prod'
);
const COOKIE = 'gm_session';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always forward pathname as a header so layouts can read it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);

    // ── Admin routes ─────────────────────────────────────────────────────────
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
    matcher: ['/admin/:path*', '/dealer/:path*', '/account/:path*'],
};
