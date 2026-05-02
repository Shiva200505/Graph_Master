'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['all', 'pending', 'pending_payment', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
const UPDATABLE = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

interface Order {
    id: string; orderNumber: string; customerName: string; customerPhone: string;
    dealerName: string; itemCount: number; total: number; fulfillmentType: string;
    status: string; createdAt: string;
}

// Default date range: last 30 days
function defaultFrom() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}
function defaultTo() { return new Date().toISOString().slice(0, 10); }

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState(defaultFrom());
    const [dateTo, setDateTo] = useState(defaultTo());
    const [loading, setLoading] = useState(true);

    // ── Bulk selection ──────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('confirmed');
    const [bulkLoading, setBulkLoading] = useState(false);

    // ── CSV export ──────────────────────────────────────────────────────────
    const [exporting, setExporting] = useState(false);

    // ── Inline status update ────────────────────────────────────────────────
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = useCallback(async (pageNum = 1, append = false) => {
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(pageNum), limit: '10' });
        if (search) params.set('search', search);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        const res = await fetch(`/api/admin/orders?${params}`);
        const data = await res.json();
        setOrders(prev => append ? [...prev, ...(data.orders ?? [])] : (data.orders ?? []));
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(pageNum);
        if (!append) setSelected(new Set()); // clear selection only on new fetch
        setLoading(false);
    }, [status, search, dateFrom, dateTo]);

    useEffect(() => { fetchOrders(1, false); }, [fetchOrders]);

    // ── Inline status update per row ────────────────────────────────────────
    const handleInlineStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // ── Bulk update ─────────────────────────────────────────────────────────
    const handleBulkUpdate = async () => {
        if (selected.size === 0) return;
        setBulkLoading(true);
        try {
            const res = await fetch('/api/admin/orders/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
            });
            const data = await res.json();
            if (data.ok) {
                setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
                setSelected(new Set());
            }
        } finally {
            setBulkLoading(false);
        }
    };

    // ── CSV Export ─────────────────────────────────────────────────────────
    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ status, limit: 'all' });
            if (search) params.set('search', search);
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            const res = await fetch(`/api/admin/orders?${params}`);
            const data = await res.json();
            const rows: Order[] = data.orders ?? [];

            const header = ['Order#', 'Customer', 'Phone', 'Dealer', 'Items', 'Total', 'Type', 'Status', 'Date'];
            const csvRows = [
                header.join(','),
                ...rows.map(o => [
                    `"${o.orderNumber}"`,
                    `"${o.customerName}"`,
                    `"${o.customerPhone}"`,
                    `"${o.dealerName}"`,
                    o.itemCount,
                    o.total,
                    o.fulfillmentType,
                    o.status,
                    `"${new Date(o.createdAt).toLocaleDateString('en-IN')}"`,
                ].join(',')),
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gm-orders-${dateFrom}-to-${dateTo}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    // ── Checkbox helpers ───────────────────────────────────────────────────
    const allChecked = orders.length > 0 && orders.every(o => selected.has(o.id));
    const toggleAll = () => {
        if (allChecked) setSelected(new Set());
        else setSelected(new Set(orders.map(o => o.id)));
    };
    const toggleOne = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Orders</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{total} total orders</p>
                </div>
                <button onClick={handleExportCSV} disabled={exporting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', color: 'var(--gray-700)' }}>
                    {exporting
                        ? <><div style={{ width: '13px', height: '13px', border: '2px solid var(--gray-300)', borderTop: '2px solid var(--leaf-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Exporting…</>
                        : <>📥 Export CSV</>
                    }
                </button>
            </div>

            {/* ── Filters ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <input className="input" placeholder="Search order#, customer..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '220px', fontSize: '0.84rem' }} />

                {/* Date range */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-400)', fontSize: '0.75rem' }}>FROM</span>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="input" style={{ width: '140px', fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} />
                    <span style={{ color: 'var(--gray-300)' }}>—</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="input" style={{ width: '140px', fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} />
                </div>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setStatus(s)} style={{
                            padding: '0.3rem 0.65rem', borderRadius: '20px', border: '1.5px solid',
                            borderColor: status === s ? 'var(--leaf-600)' : 'var(--gray-200)',
                            background: status === s ? 'var(--leaf-600)' : 'white',
                            color: status === s ? 'white' : 'var(--gray-600)',
                            fontWeight: status === s ? 700 : 500, fontSize: '0.75rem', cursor: 'pointer',
                        }}>
                            {s === 'all' ? 'All' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Bulk action bar ── */}
            {selected.size > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #1A4D25, #2A7436)',
                    borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                    animation: 'fadeUp 0.2s ease',
                }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                        {selected.size} order{selected.size !== 1 ? 's' : ''} selected
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Mark as:</span>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '7px', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                        {['confirmed', 'dispatched', 'delivered', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                    <button onClick={handleBulkUpdate} disabled={bulkLoading} style={{
                        padding: '0.35rem 0.875rem', borderRadius: '7px', border: 'none',
                        background: 'white', color: '#1A4D25', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                    }}>
                        {bulkLoading ? 'Updating…' : 'Apply'}
                    </button>
                    <button onClick={() => setSelected(new Set())} style={{
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', borderRadius: '7px', padding: '0.3rem 0.6rem', fontSize: '0.78rem',
                        cursor: 'pointer', fontWeight: 600, marginLeft: 'auto',
                    }}>
                        ✕ Clear
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                <th style={{ padding: '0.7rem 0.75rem' }}>
                                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--leaf-600)' }} />
                                </th>
                                {['Order #', 'Customer', 'Dealer', 'Items', 'Total', 'Type', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '0.7rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}><td colSpan={10} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                            )) : orders.length === 0 ? (
                                <tr><td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>No orders found for the selected filters</td></tr>
                            ) : orders.map((o, i) => (
                                <tr key={o.id}
                                    style={{ borderBottom: '1px solid var(--gray-100)', background: selected.has(o.id) ? 'rgba(42,116,54,0.04)' : i % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.1s' }}
                                    onMouseEnter={e => { if (!selected.has(o.id)) e.currentTarget.style.background = 'var(--leaf-50)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = selected.has(o.id) ? 'rgba(42,116,54,0.04)' : i % 2 === 0 ? 'white' : '#fafafa'; }}
                                >
                                    {/* Checkbox */}
                                    <td style={{ padding: '0.7rem 0.75rem' }} onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)}
                                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--leaf-600)' }} />
                                    </td>
                                    {/* Clickable cells → detail page */}
                                    <td style={{ padding: '0.7rem 0.75rem', fontWeight: 700, color: 'var(--leaf-700)', fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                        onClick={() => router.push(`/admin/orders/${o.id}`)}>#{o.orderNumber}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.82rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                        onClick={() => router.push(`/admin/orders/${o.id}`)}>
                                        <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{o.customerPhone}</div>
                                    </td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem', color: 'var(--gray-600)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                        onClick={() => router.push(`/admin/orders/${o.id}`)}>{o.dealerName}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.82rem', fontWeight: 700 }}>₹{o.total.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.78rem' }}>
                                        <span style={{ background: o.fulfillmentType === 'pickup' ? '#E0F2FE' : '#FEF3C7', color: o.fulfillmentType === 'pickup' ? '#0369A1' : '#92400E', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.72rem' }}>
                                            {o.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.7rem 0.75rem' }}><StatusBadge status={o.status} size="sm" /></td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.78rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </td>
                                    {/* Inline status select */}
                                    <td style={{ padding: '0.5rem 0.75rem' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                            <select
                                                value={o.status}
                                                onChange={e => handleInlineStatus(o.id, e.target.value)}
                                                disabled={updatingId === o.id}
                                                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--gray-200)', borderRadius: '7px', fontSize: '0.75rem', background: 'white', cursor: 'pointer', minWidth: '100px' }}>
                                                {UPDATABLE.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                            {updatingId === o.id && (
                                                <div style={{ width: '12px', height: '12px', border: '2px solid var(--gray-200)', borderTop: '2px solid var(--leaf-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Load More */}
                {page < totalPages && (
                    <div style={{ padding: '1.25rem', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
                        <button 
                            onClick={() => fetchOrders(page + 1, true)} 
                            disabled={loading}
                            style={{ padding: '0.5rem 1.5rem', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-700)', cursor: 'pointer' }}>
                            {loading ? 'Loading...' : 'Load More ↓'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
