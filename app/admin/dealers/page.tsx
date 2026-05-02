'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Dealer {
    id: string; name: string; phone: string; email: string; address: string;
    isActive: boolean; orderCount: number; totalRevenue: number; coverageRadiusKm: number; createdAt: string;
    lowStockCount?: number;
}

interface FormData {
    name: string; phone: string; email: string; password: string;
    address: string; lat: string; lng: string; coverageRadiusKm: string;
}

const EMPTY_FORM: FormData = {
    name: '', phone: '', email: '', password: '',
    address: '', lat: '', lng: '', coverageRadiusKm: '15',
};

const IL = { fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)', marginBottom: '0.3rem', display: 'block' } as const;
const II = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', outline: 'none', boxSizing: 'border-box' as const };

export default function AdminDealersPage() {
    const router = useRouter();
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    // ── Add Dealer Form state ──────────────────────────────────────────────────
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

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

    // ── Client-side validation ─────────────────────────────────────────────────
    const validate = (): string => {
        const { name, phone, email, password, address, lat, lng, coverageRadiusKm } = formData;
        if (!name.trim()) return 'Name is required';
        if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) return 'Phone must be a valid 10-digit number starting with 6–9';
        if (!email.trim()) return 'Email is required';
        if (!password || password.length < 8) return 'Password must be at least 8 characters';
        if (!address.trim()) return 'Address is required';
        const latN = parseFloat(lat);
        const lngN = parseFloat(lng);
        if (isNaN(latN) || latN < 15 || latN > 25) return 'Latitude must be between 15 and 25 (Maharashtra range)';
        if (isNaN(lngN) || lngN < 72 || lngN > 80) return 'Longitude must be between 72 and 80 (Maharashtra range)';
        const radN = parseFloat(coverageRadiusKm);
        if (isNaN(radN) || radN <= 0) return 'Coverage radius must be a positive number';
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setFormError(err); return; }

        setSaving(true);
        setFormError('');
        try {
            const res = await fetch('/api/admin/dealers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    address: formData.address.trim(),
                    lat: parseFloat(formData.lat),
                    lng: parseFloat(formData.lng),
                    coverageRadiusKm: parseFloat(formData.coverageRadiusKm),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error ?? 'Failed to create dealer'); return; }

            // Success — close form, reset, refresh list
            setShowForm(false);
            setFormData(EMPTY_FORM);
            await fetchDealers();
        } finally {
            setSaving(false);
        }
    };

    const f = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Dealers</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>
                        {dealers.filter(d => d.isActive).length} active of {dealers.length} total
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(v => !v); setFormError(''); }}
                    style={{
                        padding: '0.55rem 1.1rem', border: 'none', borderRadius: '8px',
                        background: showForm ? 'var(--gray-200)' : 'var(--leaf-600)',
                        color: showForm ? 'var(--gray-700)' : 'white',
                        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        transition: 'all 0.15s',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Add Dealer'}
                </button>
            </div>

            {/* ── Add Dealer Form Panel ── */}
            {showForm && (
                <div style={{
                    background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px',
                    padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)',
                    animation: 'fadeUp 0.2s ease',
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>
                        ➕ New Dealer
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

                            <div>
                                <label style={IL}>Name *</label>
                                <input style={II} placeholder="Dealer / Store name" value={formData.name} onChange={f('name')} />
                            </div>
                            <div>
                                <label style={IL}>Phone *</label>
                                <input style={II} placeholder="10-digit mobile" value={formData.phone}
                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                                    maxLength={10} />
                            </div>
                            <div>
                                <label style={IL}>Email *</label>
                                <input style={II} type="email" placeholder="dealer@example.com" value={formData.email} onChange={f('email')} />
                            </div>
                            <div>
                                <label style={IL}>Password *</label>
                                <input style={II} type="password" placeholder="Min 8 characters" value={formData.password} onChange={f('password')} />
                            </div>
                            <div>
                                <label style={IL}>Latitude * <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(15 – 25)</span></label>
                                <input style={II} type="number" step="any" placeholder="e.g. 18.5204" value={formData.lat} onChange={f('lat')} />
                            </div>
                            <div>
                                <label style={IL}>Longitude * <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(72 – 80)</span></label>
                                <input style={II} type="number" step="any" placeholder="e.g. 73.8567" value={formData.lng} onChange={f('lng')} />
                            </div>
                            <div>
                                <label style={IL}>Coverage Radius (km) *</label>
                                <input style={II} type="number" step="any" min="1" value={formData.coverageRadiusKm} onChange={f('coverageRadiusKm')} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={IL}>Address *</label>
                                <textarea style={{ ...II, resize: 'vertical' }} rows={2} placeholder="Full address of the dealer/store"
                                    value={formData.address} onChange={f('address')} />
                            </div>
                        </div>

                        {formError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#DC2626', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span>⚠️</span> {formError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px',
                                background: 'var(--leaf-600)', color: 'white', fontWeight: 700, fontSize: '0.88rem',
                                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.75 : 1,
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                                {saving ? (
                                    <><span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />Saving…</>
                                ) : 'Create Dealer'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); setFormError(''); }}
                                style={{ padding: '0.6rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600, color: 'var(--gray-600)' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Performance Summary ── */}
            {!loading && dealers.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>🏆 Top Revenue</div>
                        {[...dealers].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]?.totalRevenue > 0 ? (
                            <>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--leaf-700)' }}>{[...dealers].sort((a, b) => b.totalRevenue - a.totalRevenue)[0].name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginTop: '0.2rem' }}>₹{[...dealers].sort((a, b) => b.totalRevenue - a.totalRevenue)[0].totalRevenue.toLocaleString('en-IN')}</div>
                            </>
                        ) : <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No data yet</div>}
                    </div>
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>📦 Most Orders</div>
                        {[...dealers].sort((a, b) => b.orderCount - a.orderCount)[0]?.orderCount > 0 ? (
                            <>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--leaf-700)' }}>{[...dealers].sort((a, b) => b.orderCount - a.orderCount)[0].name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginTop: '0.2rem' }}>{[...dealers].sort((a, b) => b.orderCount - a.orderCount)[0].orderCount} orders</div>
                            </>
                        ) : <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No data yet</div>}
                    </div>
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>⚠️ Lowest Stock</div>
                        {[...dealers].sort((a, b) => (b.lowStockCount || 0) - (a.lowStockCount || 0))[0]?.lowStockCount && [...dealers].sort((a, b) => (b.lowStockCount || 0) - (a.lowStockCount || 0))[0].lowStockCount! > 0 ? (
                            <>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#991B1B' }}>{[...dealers].sort((a, b) => (b.lowStockCount || 0) - (a.lowStockCount || 0))[0].name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginTop: '0.2rem' }}>{[...dealers].sort((a, b) => (b.lowStockCount || 0) - (a.lowStockCount || 0))[0].lowStockCount} items &lt; 10 units</div>
                            </>
                        ) : <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>All stocks healthy</div>}
                    </div>
                </div>
            )}

            {/* ── Dealers Table ── */}
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
                            )) : dealers.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.88rem' }}>No dealers yet — add one above.</td></tr>
                            ) : dealers.map((d, i) => (
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
