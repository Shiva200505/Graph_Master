import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'gm-super-secret-jwt-key-change-in-prod'
);

export const COOKIE_NAME = 'gm_session';

export type SessionRole = 'admin' | 'dealer' | 'customer';

export interface SessionPayload {
    id: string;
    email?: string;
    phone?: string;
    name: string;
    role: SessionRole;
}

/** Sign a JWT and return it as a string */
export async function signToken(
    payload: SessionPayload,
    expiresIn = '1d'
): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET);
}

/** Verify a JWT string — returns payload or null */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

/** Read + verify session from the Next.js cookie store (Server Components / Route Handlers) */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

/** Build a Set-Cookie header value for the session token */
export function buildSessionCookie(token: string): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24; // 1 day in seconds
    return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProduction ? '; Secure' : ''}`;
}

/** Clear cookie header */
export function clearSessionCookie(): string {
    return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
