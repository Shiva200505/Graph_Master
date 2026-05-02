'use client';

import { useEffect, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
    dailyRevenue: { date: string; revenue: number; count: number }[];
    ordersByStatus: { status: string; count: number }[];
    topProducts: { productName: string; totalQty: number; totalRevenue: number }[];
    topDealers: { dealerName: string; orderCount: number; revenue: number }[];
    fulfillmentStats: { fulfillmentType: string; count: number }[];
    totalStats: { totalOrders: number; totalRevenue: number; avgOrderValue: number };
    locationInsights: { location: string; order_count: number; revenue: number }[];
    mlStats: { total_orders: number; returning_customers: number; avg_items_per_order: number; mlServiceActive: boolean };
}

const STATUS_COLORS: Record<string, string> = {
    confirmed: '#2A7436', pending: '#F59E0B', pending_payment: '#8B5CF6',
    dispatched: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444',
};

const PIE_COLORS = ['#2A7436', '#52B061', '#8C2458', '#E0B800', '#3B82F6', '#F59E0B'];

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--gray-200)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-400)', marginBottom: '0.4rem' }}>{label}</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.3rem' }}>{sub}</div>}
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--gray-200)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1.25rem' }}>{title}</h3>
            {children}
        </div>
    );
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then((r) => r.json())
            .then((d) => setData(d))
            .catch(() => setError('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid var(--leaf-200)', borderTop: '4px solid var(--leaf-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Loading analytics…</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>{error || 'No data'}</div>
    );

    const { dailyRevenue, ordersByStatus, topProducts, topDealers, fulfillmentStats, totalStats, locationInsights, mlStats } = data;

    // Format daily revenue for chart — fill empty dates with 0
    const chartRevenue = dailyRevenue.map((d) => ({
        date: d.date.slice(5), // MM-DD
        revenue: Number(d.revenue),
        orders: Number(d.count),
    }));

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--leaf-600)', marginBottom: '0.3rem' }}>Admin Panel</div>
                <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>Analytics & Insights</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', marginTop: '0.25rem' }}>Sales trends, product performance, and fulfillment breakdown</p>
            </div>

            {/* ── Summary Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatBox label="Total Revenue" value={fmt(totalStats.totalRevenue)} sub="all confirmed orders" />
                <StatBox label="Total Orders" value={String(totalStats.totalOrders)} sub="excluding cancelled" />
                <StatBox label="Avg Order Value" value={fmt(totalStats.avgOrderValue)} />
                <StatBox
                    label="Delivery Split"
                    value={`${Math.round(
                        ((fulfillmentStats.find((f) => f.fulfillmentType === 'delivery')?.count ?? 0) /
                            Math.max(fulfillmentStats.reduce((s, f) => s + Number(f.count), 0), 1)) * 100
                    )}%`}
                    sub="orders with delivery"
                />
            </div>

            {/* ── Revenue Chart ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <ChartCard title="📈 Daily Revenue — Last 30 Days">
                    {chartRevenue.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>No order data in the last 30 days</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={chartRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                                    labelStyle={{ fontWeight: 700 }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#2A7436" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            {/* ── Row: Orders by Status + Fulfillment Pie ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                <ChartCard title="📦 Orders by Status">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ordersByStatus} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={110} />
                            <Tooltip formatter={(v: unknown) => [Number(v), 'Orders']} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {ordersByStatus.map((entry) => (
                                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="🚚 Fulfillment Type Split">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ResponsiveContainer width="60%" height={200}>
                            <PieChart>
                                <Pie data={fulfillmentStats} dataKey="count" nameKey="fulfillmentType" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                                    {fulfillmentStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v: unknown) => [Number(v), 'Orders']} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {fulfillmentStats.map((f, i) => (
                                <div key={f.fulfillmentType} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{f.fulfillmentType}</span>
                                    <span style={{ color: 'var(--gray-400)' }}>({f.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* ── Row: Top Products + Top Dealers ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                <ChartCard title="🌾 Top Products by Quantity Ordered">
                    {topProducts.length === 0 ? (
                        <div style={{ color: 'var(--gray-400)', padding: '2rem', textAlign: 'center' }}>No product data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topProducts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="productName" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: unknown, name: unknown) => [
                                    name === 'totalQty' ? `${Number(v)} units` : `₹${Number(v).toLocaleString('en-IN')}`,
                                    name === 'totalQty' ? 'Qty Sold' : 'Revenue',
                                ]} />
                                <Legend />
                                <Bar dataKey="totalQty" name="Qty Sold" fill="#52B061" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="🏪 Top Dealers by Revenue">
                    {topDealers.length === 0 ? (
                        <div style={{ color: 'var(--gray-400)', padding: '2rem', textAlign: 'center' }}>No dealer data yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {topDealers.map((d, i) => {
                                const maxRev = Number(topDealers[0].revenue) || 1;
                                const pct = Math.round((Number(d.revenue) / maxRev) * 100);
                                return (
                                    <div key={d.dealerName}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600 }}>{i + 1}. {d.dealerName}</span>
                                            <span style={{ color: 'var(--leaf-700)', fontWeight: 700 }}>{fmt(Number(d.revenue))}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(to right, #2A7436, #52B061)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.15rem' }}>{d.orderCount} orders</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ── New Row: Location Insights + ML Stats ── */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Orders by Location — horizontal bar chart */}
                <ChartCard title="📍 Orders by Location">
                    {(!locationInsights || locationInsights.length === 0) ? (
                        <div style={{ color: 'var(--gray-400)', padding: '2rem', textAlign: 'center' }}>No location data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={locationInsights} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="location" type="category" tick={{ fontSize: 12, fontWeight: 600 }} width={96} />
                                <Tooltip
                                    formatter={(v: unknown, name: unknown) => [
                                        name === 'order_count' ? `${Number(v)} orders` : `₹${Number(v).toLocaleString('en-IN')}`,
                                        name === 'order_count' ? 'Orders' : 'Revenue',
                                    ]}
                                    labelStyle={{ fontWeight: 700 }}
                                />
                                <Bar dataKey="order_count" name="Orders" fill="#2A7436" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* ML Recommendation Insights */}
                <ChartCard title="🤖 ML Recommendation Insights">
                    {(() => {
                        const ml = mlStats ?? { total_orders: 0, returning_customers: 0, avg_items_per_order: 0, mlServiceActive: false };
                        const retentionPct = ml.total_orders > 0
                            ? Math.round((ml.returning_customers / ml.total_orders) * 100)
                            : 0;
                        const source = ml.mlServiceActive ? 'ML Engine' : 'Popularity Fallback';

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* 3 stat boxes */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    {[
                                        {
                                            label: 'Retention Rate',
                                            value: `${retentionPct}%`,
                                            sub: `${ml.returning_customers} returning / ${ml.total_orders} total`,
                                            color: retentionPct >= 50 ? 'var(--leaf-700)' : '#D97706',
                                        },
                                        {
                                            label: 'Avg Items / Order',
                                            value: String(ml.avg_items_per_order ?? '—'),
                                            sub: 'across non-cancelled orders',
                                            color: 'var(--gray-900)',
                                        },
                                        {
                                            label: 'ML Service',
                                            value: ml.mlServiceActive ? 'Active' : 'Fallback',
                                            sub: ml.mlServiceActive ? 'ML model serving recs' : 'Using popularity model',
                                            color: ml.mlServiceActive ? 'var(--leaf-700)' : '#D97706',
                                        },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '0.875rem 1rem' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-400)', marginBottom: '0.3rem' }}>{s.label}</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.2rem' }}>{s.value}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)' }}>{s.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Status banner */}
                                <div style={{
                                    background: ml.mlServiceActive ? '#F0FDF4' : '#FFFBEB',
                                    border: `1px solid ${ml.mlServiceActive ? 'rgba(22,163,74,0.3)' : '#FDE68A'}`,
                                    borderRadius: '10px',
                                    padding: '0.875rem 1rem',
                                    display: 'flex',
                                    gap: '0.6rem',
                                    alignItems: 'flex-start',
                                }}>
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ml.mlServiceActive ? '🤖' : '🔥'}</span>
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: ml.mlServiceActive ? '#15803D' : '#92400E', marginBottom: '0.15rem' }}>
                                            Currently using: {source}
                                        </div>
                                        <div style={{ fontSize: '0.77rem', color: ml.mlServiceActive ? '#166534' : '#92400E', lineHeight: 1.5 }}>
                                            ML recommendations improve as more orders are placed.
                                            {!ml.mlServiceActive && ' Set ML_SERVICE_URL in environment to enable real-time model serving.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar: retention */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '0.35rem' }}>
                                        <span>Customer Retention Progress</span>
                                        <span>{retentionPct}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${retentionPct}%`,
                                            height: '100%',
                                            background: retentionPct >= 50
                                                ? 'linear-gradient(to right, #2A7436, #52B061)'
                                                : 'linear-gradient(to right, #F59E0B, #FBBF24)',
                                            borderRadius: '4px',
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>Target: 50%+ for strong ML signal quality</div>
                                </div>
                            </div>
                        );
                    })()}
                </ChartCard>

            </div>

        </div>
    );
}
