import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0C2410 0%, #1A4D25 40%, #2A7436 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(82,176,97,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(140,36,88,0.06)', pointerEvents: 'none' }} />

            <div style={{ textAlign: 'center', maxWidth: '520px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease' }}>

                {/* Grape SVG illustration */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Vine stem */}
                        <path d="M60 12 C60 12 60 28 60 34" stroke="#52B061" strokeWidth="3.5" strokeLinecap="round" />
                        {/* Leaves */}
                        <path d="M60 24 C64 16 80 15 80 24 C80 34 66 37 60 34 C54 37 40 34 40 24 C40 15 56 16 60 24Z" fill="#52B061" opacity="0.85" />
                        {/* Grape cluster */}
                        <circle cx="45" cy="52" r="13" fill="#8C2458" opacity="0.9" />
                        <circle cx="75" cy="52" r="13" fill="#8C2458" opacity="0.9" />
                        <circle cx="60" cy="44" r="13" fill="#A83070" />
                        <circle cx="36" cy="72" r="12" fill="#8C2458" opacity="0.85" />
                        <circle cx="60" cy="74" r="13" fill="#6B1A46" />
                        <circle cx="84" cy="72" r="12" fill="#8C2458" opacity="0.85" />
                        <circle cx="48" cy="93" r="10.5" fill="#A83070" opacity="0.9" />
                        <circle cx="72" cy="93" r="10.5" fill="#A83070" opacity="0.9" />
                        <circle cx="60" cy="108" r="9" fill="#8C2458" />
                        {/* Subtle shine */}
                        <circle cx="52" cy="48" r="3.5" fill="rgba(255,255,255,0.25)" />
                        <circle cx="67" cy="40" r="3" fill="rgba(255,255,255,0.2)" />
                    </svg>
                </div>

                {/* 404 badge */}
                <div style={{
                    display: 'inline-block', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '40px',
                    padding: '0.3rem 1rem', marginBottom: '1.25rem',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
                }}>
                    Error 404
                </div>

                <h1 style={{
                    fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: 900,
                    color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1,
                    marginBottom: '1rem',
                }}>
                    Page Not Found
                </h1>

                <p style={{
                    fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
                    marginBottom: '2rem', maxWidth: '380px', margin: '0 auto 2rem',
                }}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
                </p>

                <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.75rem 1.5rem', borderRadius: '10px',
                        background: 'white', color: '#1A4D25',
                        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                        transition: 'all 0.15s', boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}>
                        🏠 Go to Home
                    </Link>
                    <Link href="/products" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.75rem 1.5rem', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.12)', color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                        transition: 'all 0.15s',
                    }}>
                        🌾 Browse Products
                    </Link>
                </div>

                {/* Flavor text */}
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.75rem', marginTop: '2.5rem' }}>
                    GrapeMaster Agri Supplies · Pune, Maharashtra
                </p>
            </div>
        </div>
    );
}
