'use client';

import { useEffect, useState, useCallback } from 'react';

const STATUSES = ['all', 'success', 'failed', 'pending', 'refund_pending'];

interface Payment {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    orderStatus: string;
    amount: number;
    status: string;
    merchantTransactionId: string | null;
    transactionId: string | null;
    createdAt: string;
}

function defaultFrom() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}
function defaultTo() { return new Date().toISOString().slice(0, 10); }

function getStatusBadge(status: string) {
    if (status === 'success') return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>SUCCESS</span>;
    if (status === 'failed') return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>FAILED</span>;
    if (status === 'refund_pending') return <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>REFUND PEND</span>;
    return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>{status.toUpperCase()}</span>;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('all');
    const [dateFrom, setDateFrom] = useState(defaultFrom());
    const [dateTo, setDateTo] = useState(defaultTo());
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchPayments = useCallback(async (pageNum = 1, append = false) => {
        setLoading(true);
        const params = new URLSearchParams({ status, page: String(pageNum), limit: '20' });
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        
        try {
            const res = await fetch(`/api/admin/payments?${params}`);
            const data = await res.json();
            setPayments(prev => append ? [...prev, ...(data.payments ?? [])] : (data.payments ?? []));
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(pageNum);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [status, dateFrom, dateTo]);

    useEffect(() => { fetchPayments(1, false); }, [fetchPayments]);

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ status, limit: 'all' });
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            const res = await fetch(`/api/admin/payments?${params}`);
            const data = await res.json();
            const rows: Payment[] = data.payments ?? [];

            const header = ['Order#', 'Customer', 'Phone', 'Amount', 'TxnID', 'Status', 'Date'];
            const csvRows = [
                header.join(','),
                ...rows.map(p => [
                    `"${p.orderNumber}"`,
                    `"${p.customerName}"`,
                    `"${p.customerPhone}"`,
                    p.amount,
                    `"${p.transactionId || p.merchantTransactionId || ''}"`,
                    p.status,
                    `"${new Date(p.createdAt).toLocaleDateString('en-IN')}"`,
                ].join(',')),
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gm-payments-${dateFrom}-to-${dateTo}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Payments Reconciliation</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{total} total records</p>
                </div>
                <button onClick={handleExportCSV} disabled={exporting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', color: 'var(--gray-700)' }}>
                    {exporting ? 'Exporting…' : '📥 Export CSV'}
                </button>
            </div>

            {/* ── Filters ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-400)', fontSize: '0.75rem' }}>FROM</span>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="input" style={{ width: '140px', fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} />
                    <span style={{ color: 'var(--gray-300)' }}>—</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="input" style={{ width: '140px', fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
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

            {/* ── Table ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                {['Order #', 'Customer', 'Amount', 'Razorpay TxnID', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '0.7rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && page === 1 ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                            )) : payments.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>No payment records found</td></tr>
                            ) : payments.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '0.7rem 0.75rem', fontWeight: 700, color: 'var(--leaf-700)', fontSize: '0.82rem' }}>#{p.orderNumber}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.82rem' }}>
                                        <div style={{ fontWeight: 600 }}>{p.customerName}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{p.customerPhone}</div>
                                    </td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.82rem', fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                                        {p.transactionId || p.merchantTransactionId || '-'}
                                    </td>
                                    <td style={{ padding: '0.7rem 0.75rem' }}>{getStatusBadge(p.status)}</td>
                                    <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {page < totalPages && (
                    <div style={{ padding: '1.25rem', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
                        <button 
                            onClick={() => fetchPayments(page + 1, true)} 
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
