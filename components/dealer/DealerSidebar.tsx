'use client';

import { useRouter, usePathname } from 'next/navigation';

const NAV = [
    { href: '/dealer', label: 'Dashboard', icon: '📊' },
    { href: '/dealer/orders', label: 'My Orders', icon: '📦' },
    { href: '/dealer/inventory', label: 'Inventory', icon: '🌾' },
];

export default function DealerSidebar({ name }: { name: string }) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/dealer/login');
        router.refresh();
    };

    return (
        <aside style={{ width: '210px', flexShrink: 0, background: 'linear-gradient(180deg, #3D1A54 0%, #4a2060 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🏪</span>
                    <div>
                        <div style={{ fontWeight: 900, color: 'white', fontSize: '0.95rem', letterSpacing: '-0.03em' }}>
                            Grape<span style={{ color: '#B07FD7' }}>Master</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dealer Panel</div>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.07)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.1rem' }}>Logged in as</div>
                    <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                </div>
            </div>

            <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {NAV.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dealer' && pathname.startsWith(item.href));
                    return (
                        <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.875rem', borderRadius: '10px', background: isActive ? 'rgba(176,127,215,0.2)' : 'transparent', color: isActive ? '#D8AEFF' : 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: isActive ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.15s', borderLeft: isActive ? '3px solid #B07FD7' : '3px solid transparent' }}>
                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                            {item.label}
                        </a>
                    );
                })}
            </nav>

            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}
