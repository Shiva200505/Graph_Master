'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';

interface Stats {
    totalOrders: number; pendingOrders: number; todayRevenue: number; lowStockCount: number;
    recentOrders: { id: string; orderNumber: string; customerName: string; total: number; status: string; itemCount: number; createdAt: string }[];
}

interface DealerProfile {
    id: string; name: string; phone: string; email: string; address: string;
    coverageRadiusKm: number; lat: number | null; lng: number | null;
}

export default function DealerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [profile, setProfile] = useState<DealerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Today's stats derived from recentOrders (same-day orders)
    const todayOrders = stats?.recentOrders.filter(o => {
        const d = new Date(o.createdAt);
        const today = new Date();
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    }) ?? [];
    const todayCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

    useEffect(() => {
        Promise.all([
            fetch('/api/dealer/stats').then(r => r.json()),
            fetch('/api/dealer/profile').then(r => r.json()),
        ]).then(([s, p]) => {
            setStats(s);
            setProfile(p?.dealer ?? null);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div>
            <div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '1.5rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />)}
            </div>
        </div>
    );

    if (!stats) return <div style={{ color: '#DC2626' }}>Failed to load</div>;

    return (
        <div>
            {/* ── Profile banner ── */}
            {profile && (
                <div style={{ background: 'linear-gradient(135deg, #3D1A54, #5A2875)', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🏪</div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', letterSpacing: '-0.02em' }}>{profile.name}</div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>📞 {profile.phone}</span>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>✉️ {profile.email}</span>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>📍 {profile.coverageRadiusKm} km radius</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => router.push('/dealer/profile')} style={{ padding: '0.45rem 0.875rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                        👤 My Profile →
                    </button>
                </div>
            )}

            {/* ── Today's highlight ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #1A4D25, #2A7436)', borderRadius: '12px', padding: '1rem 1.25rem', color: 'white' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Today's Orders</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{todayCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #92400E, #B45309)', borderRadius: '12px', padding: '1rem 1.25rem', color: 'white' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Today's Revenue</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em' }}>₹{(stats.todayRevenue || todayRevenue).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>From confirmed orders</div>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" color="#8B5CF6" />
                <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" color="#F59E0B" sublabel="Need action" />
                <StatCard label="Low Stock Items" value={stats.lowStockCount} icon="⚠️" color="#EF4444" sublabel="< 10 units" />
            </div>

            {/* ── Map embed (if coordinates available) ── */}
            {profile?.lat && profile?.lng && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.88rem' }}>
                        📍 Your Coverage Area
                        <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>{profile.coverageRadiusKm} km radius</span>
                    </div>
                    <iframe
                        title="Dealer location"
                        width="100%"
                        height="240"
                        frameBorder="0"
                        style={{ display: 'block', border: 0 }}
                        src={`https://maps.google.com/maps?q=${profile.lat},${profile.lng}&z=13&output=embed`}
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            )}

            {/* ── Recent Orders ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Orders</div>
                    <button onClick={() => router.push('/dealer/orders')} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                </div>
                {stats.recentOrders.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>No orders yet</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            {['Order #', 'Customer', 'Items', 'Total', 'Status'].map(h => (
                                <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{stats.recentOrders.map(o => (
                            <tr key={o.id} onClick={() => router.push('/dealer/orders')} style={{ borderBottom: '1px solid var(--gray-50)', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#FDF4FF'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#8B5CF6', fontSize: '0.82rem' }}>#{o.orderNumber}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{o.customerName}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, fontSize: '0.82rem' }}>₹{o.total.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
