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

    const { dailyRevenue, ordersByStatus, topProducts, topDealers, fulfillmentStats, totalStats } = data;

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

        </div>
    );
}
