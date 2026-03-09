'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { useRouter } from 'next/navigation';

interface Stats {
    totalOrders: number; pendingOrders: number; activeDealers: number;
    totalProducts: number; newCustomers: number; totalRevenue: number;
    todayRevenue: number; statusBreakdown: { status: string; count: number }[];
    recentOrders: { id: string; orderNumber: string; customerName: string; dealerName: string; itemCount: number; total: number; status: string; createdAt: string }[];
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(d => setStats(d))
            .finally(() => setLoading(false));
    }, []);

    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    const fmtNum = (n: number) => n.toLocaleString('en-IN');

    if (loading) return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: '14px', width: '280px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />)}
            </div>
        </div>
    );

    if (!stats) return <div style={{ color: '#DC2626' }}>Failed to load stats</div>;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>Dashboard</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Welcome back! Here's what's happening with GrapeMaster today.
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} icon="💰" color="#16a34a" sublabel="All time (excl. cancelled)" />
                <StatCard label="Today's Revenue" value={fmt(stats.todayRevenue)} icon="📈" color="#2A7436" sublabel="Orders today" />
                <StatCard label="Total Orders" value={fmtNum(stats.totalOrders)} icon="📦" color="#3B82F6" sublabel={`${stats.pendingOrders} pending`} />
                <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" color="#F59E0B" sublabel="Need attention" />
                <StatCard label="Active Dealers" value={stats.activeDealers} icon="🏪" color="#8B5CF6" />
                <StatCard label="New Customers" value={stats.newCustomers} icon="👤" color="#EC4899" sublabel="Last 7 days" />
            </div>

            {/* Bottom grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>

                {/* Recent Orders */}
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Orders</div>
                        <button onClick={() => router.push('/admin/orders')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                    {['Order #', 'Customer', 'Dealer', 'Items', 'Total', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map((o, i) => (
                                    <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)}
                                        style={{ borderBottom: '1px solid var(--gray-50)', cursor: 'pointer', background: i % 2 === 0 ? 'white' : 'var(--gray-50)', transition: 'background 0.1s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--leaf-50)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : 'var(--gray-50)')}>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--leaf-700)' }}>#{o.orderNumber}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customerName}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--gray-500)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dealerName}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                        <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>₹{o.total.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Order Status</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {stats.statusBreakdown.map(s => {
                            const pct = stats.totalOrders > 0 ? Math.round((s.count / stats.totalOrders) * 100) : 0;
                            const colors: Record<string, string> = { pending: '#F59E0B', confirmed: '#3B82F6', dispatched: '#8B5CF6', delivered: '#10B981', cancelled: '#EF4444' };
                            return (
                                <div key={s.status}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-700)' }}>{s.status}</span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-900)' }}>{s.count}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: colors[s.status] ?? '#9CA3AF', borderRadius: '3px', transition: 'width 0.5s' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
