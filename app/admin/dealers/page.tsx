'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Dealer {
    id: string; name: string; phone: string; email: string; address: string;
    isActive: boolean; orderCount: number; totalRevenue: number; coverageRadiusKm: number; createdAt: string;
}

export default function AdminDealersPage() {
    const router = useRouter();
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchDealers = async () => {
        const res = await fetch('/api/admin/dealers');
        const data = await res.json();
        setDealers(data.dealers ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchDealers(); }, []);

    const toggleActive = async (id: string, cur: boolean) => {
        setToggling(id);
        const res = await fetch(`/api/admin/dealers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !cur }),
        });
        const data = await res.json();
        if (data.ok) setDealers(prev => prev.map(d => d.id === id ? { ...d, isActive: !cur } : d));
        setToggling(null);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Dealers</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{dealers.filter(d => d.isActive).length} active of {dealers.length} total</p>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                {['Dealer', 'Phone', 'Coverage', 'Orders', 'Revenue', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}><td colSpan={7} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                            )) : dealers.map((d, i) => (
                                <tr key={d.id}
                                    style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.1s', opacity: d.isActive ? 1 : 0.6 }}>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{d.name}</div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--gray-400)', marginTop: '0.15rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.address}</div>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: 'var(--gray-600)' }}>{d.phone}</td>
                                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{d.coverageRadiusKm} km</td>
                                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>{d.orderCount}</td>
                                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--leaf-700)' }}>₹{d.totalRevenue.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: d.isActive ? '#D1FAE5' : '#FEE2E2', color: d.isActive ? '#065F46' : '#991B1B' }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.isActive ? '#10B981' : '#EF4444' }} />
                                            {d.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button onClick={() => router.push(`/admin/dealers/${d.id}`)}
                                                style={{ padding: '0.3rem 0.65rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                View
                                            </button>
                                            <button onClick={() => toggleActive(d.id, d.isActive)} disabled={toggling === d.id}
                                                style={{ padding: '0.3rem 0.65rem', border: 'none', borderRadius: '7px', background: d.isActive ? '#FEE2E2' : '#D1FAE5', color: d.isActive ? '#991B1B' : '#065F46', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                {toggling === d.id ? '…' : d.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
