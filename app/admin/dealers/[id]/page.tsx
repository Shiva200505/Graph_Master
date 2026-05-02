'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';

interface DealerDetail {
    id: string; name: string; phone: string; email: string; address: string;
    isActive: boolean; coverageRadiusKm: number;
    inventory: { id: string; productName: string; category: string; unit: string; basePrice: number; price: number | null; quantity: number }[];
    orders: { id: string; orderNumber: string; customerName: string; total: number; status: string; itemCount: number; createdAt: string }[];
}

interface EditForm {
    name: string; phone: string; email: string; address: string;
    coverageRadiusKm: string; lat: string; lng: string; password: string;
}

// Reset Password Modal
function ResetPasswordModal({ id, onClose }: { id: string; onClose: () => void }) {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPass.length < 8) { setError('Min 8 characters'); return; }
        if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/dealers/${id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: newPass }),
            });
            const data = await res.json();
            if (data.ok) setDone(true);
            else setError(data.error ?? 'Failed');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(2px)' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-xl)', animation: 'fadeUp 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>🔑 Reset Password</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--gray-400)' }}>✕</button>
                </div>
                {done ? (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', color: '#15803D', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
                        ✓ Password reset successfully!
                        <br />
                        <button onClick={onClose} style={{ marginTop: '0.75rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '7px', padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>New Password</label>
                            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input" placeholder="Min 8 characters" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Confirm Password</label>
                            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="input" placeholder="Repeat password" />
                        </div>
                        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', padding: '0.5rem 0.75rem', color: '#DC2626', fontSize: '0.82rem' }}>⚠️ {error}</div>}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: saving ? 0.75 : 1 }}>
                                {saving ? 'Saving…' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const IL = { fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)', marginBottom: '0.3rem', display: 'block' } as const;
const II = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', outline: 'none', boxSizing: 'border-box' as const };

export default function AdminDealerDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [dealer, setDealer] = useState<DealerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'orders' | 'inventory' | 'edit'>('orders');
    const [showResetModal, setShowResetModal] = useState(false);

    const [editForm, setEditForm] = useState<EditForm>({ name: '', phone: '', email: '', address: '', coverageRadiusKm: '', lat: '', lng: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    useEffect(() => {
        fetch(`/api/admin/dealers/${id}`)
            .then(r => r.json())
            .then(d => {
                setDealer(d.dealer);
                if (d.dealer) {
                    setEditForm({ name: d.dealer.name ?? '', phone: d.dealer.phone ?? '', email: d.dealer.email ?? '', address: d.dealer.address ?? '', coverageRadiusKm: String(d.dealer.coverageRadiusKm ?? 15), lat: '', lng: '', password: '' });
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    const toggleActive = async () => {
        if (!dealer) return;
        const res = await fetch(`/api/admin/dealers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !dealer.isActive }) });
        const data = await res.json();
        if (data.ok) setDealer(d => d ? { ...d, isActive: !d.isActive } : d);
    };

    const ef = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));

    const validateEdit = (): string => {
        if (!editForm.name.trim()) return 'Name is required';
        if (!editForm.phone.trim() || !/^[6-9]\d{9}$/.test(editForm.phone.trim())) return 'Phone must be a valid 10-digit number starting with 6–9';
        if (!editForm.email.trim()) return 'Email is required';
        if (!editForm.address.trim()) return 'Address is required';
        if (editForm.password && editForm.password.length < 8) return 'New password must be at least 8 characters';
        if (editForm.lat) { const latN = parseFloat(editForm.lat); if (isNaN(latN) || latN < 15 || latN > 25) return 'Latitude must be between 15 and 25'; }
        if (editForm.lng) { const lngN = parseFloat(editForm.lng); if (isNaN(lngN) || lngN < 72 || lngN > 80) return 'Longitude must be between 72 and 80'; }
        if ((editForm.lat && !editForm.lng) || (!editForm.lat && editForm.lng)) return 'Both Latitude and Longitude must be provided together';
        return '';
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateEdit();
        if (err) { setEditError(err); setEditSuccess(''); return; }
        setSaving(true); setEditError(''); setEditSuccess('');
        try {
            const payload: Record<string, unknown> = { name: editForm.name.trim(), phone: editForm.phone.trim(), email: editForm.email.trim(), address: editForm.address.trim(), coverageRadiusKm: parseFloat(editForm.coverageRadiusKm) || 15 };
            if (editForm.password) payload.password = editForm.password;
            if (editForm.lat && editForm.lng) { payload.lat = parseFloat(editForm.lat); payload.lng = parseFloat(editForm.lng); }
            const res = await fetch(`/api/admin/dealers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) { setEditError(data.error ?? 'Failed to update dealer'); return; }
            setDealer(d => d ? { ...d, name: editForm.name.trim(), phone: editForm.phone.trim(), email: editForm.email.trim(), address: editForm.address.trim(), coverageRadiusKm: parseFloat(editForm.coverageRadiusKm) || d.coverageRadiusKm } : d);
            setEditForm(p => ({ ...p, password: '', lat: '', lng: '' }));
            setEditSuccess('✓ Dealer updated successfully');
        } finally { setSaving(false); }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</div>;
    if (!dealer) return <div style={{ color: '#DC2626' }}>Dealer not found</div>;

    return (
        <div>
            {showResetModal && <ResetPasswordModal id={id} onClose={() => setShowResetModal(false)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                <button onClick={() => router.push('/admin/dealers')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>Dealers</button>
                <span>›</span><span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{dealer.name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{dealer.name}</h1>
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>📞 {dealer.phone}</span>
                        {dealer.email && <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>✉️ {dealer.email}</span>}
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>📍 {dealer.coverageRadiusKm} km radius</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Reset Password button */}
                    <button onClick={() => setShowResetModal(true)} style={{ padding: '0.5rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', color: 'var(--gray-700)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        🔑 Reset Password
                    </button>
                    {/* Onboard / Invite button */}
                    <button onClick={() => router.push(`/admin/dealers/${id}/invite`)} style={{ padding: '0.5rem 0.875rem', border: '1px solid var(--leaf-500)', borderRadius: '8px', background: 'var(--leaf-50)', color: 'var(--leaf-700)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        📤 Onboard Dealer
                    </button>
                    <button onClick={toggleActive} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: dealer.isActive ? '#FEE2E2' : '#D1FAE5', color: dealer.isActive ? '#991B1B' : '#065F46', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                        {dealer.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--gray-200)', marginBottom: '1.25rem' }}>
                {(['orders', 'inventory', 'edit'] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setEditError(''); setEditSuccess(''); }}
                        style={{ padding: '0.6rem 1.25rem', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--leaf-600)' : '2px solid transparent', marginBottom: '-2px', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--leaf-700)' : 'var(--gray-500)', cursor: 'pointer', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                        {t === 'orders' ? `Orders (${dealer.orders.length})` : t === 'inventory' ? `Inventory (${dealer.inventory.length})` : '✏️ Edit'}
                    </button>
                ))}
            </div>

            {/* Orders Tab */}
            {tab === 'orders' && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                                <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{dealer.orders.map((o) => (
                            <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: 'white' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--leaf-50)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--leaf-700)', fontSize: '0.82rem' }}>#{o.orderNumber}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>{o.customerName}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', textAlign: 'center' }}>{o.itemCount}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>₹{o.total.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={o.status} size="sm" /></td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--gray-400)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {/* Inventory Tab */}
            {tab === 'inventory' && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            {['Product', 'Category', 'Base Price', 'Dealer Price', 'Stock'].map(h => (
                                <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{dealer.inventory.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                <td style={{ padding: '0.7rem 1rem' }}><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.productName}</div><div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{item.unit}</div></td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', color: 'var(--gray-600)' }}>{item.category}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem' }}>₹{item.basePrice}</td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>{item.price ? `₹${item.price}` : '—'}</td>
                                <td style={{ padding: '0.7rem 1rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: item.quantity < 10 ? '#DC2626' : item.quantity < 20 ? '#D97706' : '#16a34a' }}>
                                        {item.quantity}{item.quantity < 10 && <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', color: '#DC2626' }}>⚠️ Low</span>}
                                    </span>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {/* Edit Tab */}
            {tab === 'edit' && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>Edit Dealer Details</h2>
                    <form onSubmit={handleEditSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div><label style={IL}>Name *</label><input style={II} value={editForm.name} onChange={ef('name')} placeholder="Dealer name" /></div>
                            <div><label style={IL}>Phone *</label><input style={II} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} maxLength={10} placeholder="10-digit mobile" /></div>
                            <div><label style={IL}>Email *</label><input style={II} type="email" value={editForm.email} onChange={ef('email')} /></div>
                            <div><label style={IL}>Coverage Radius (km) *</label><input style={II} type="number" step="any" min="1" value={editForm.coverageRadiusKm} onChange={ef('coverageRadiusKm')} /></div>
                            <div><label style={IL}>New Latitude <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(optional, 15–25)</span></label><input style={II} type="number" step="any" placeholder="Leave blank to keep" value={editForm.lat} onChange={ef('lat')} /></div>
                            <div><label style={IL}>New Longitude <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(optional, 72–80)</span></label><input style={II} type="number" step="any" placeholder="Leave blank to keep" value={editForm.lng} onChange={ef('lng')} /></div>
                            <div><label style={IL}>New Password <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(leave blank to keep)</span></label><input style={II} type="password" placeholder="Min 8 characters" value={editForm.password} onChange={ef('password')} /></div>
                            <div style={{ gridColumn: '1 / -1' }}><label style={IL}>Address *</label><textarea style={{ ...II, resize: 'vertical' }} rows={2} value={editForm.address} onChange={ef('address')} /></div>
                        </div>
                        {editError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#DC2626', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', gap: '0.4rem' }}><span>⚠️</span> {editError}</div>}
                        {editSuccess && <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#15803D', fontSize: '0.84rem', marginBottom: '1rem' }}>{editSuccess}</div>}
                        <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px', background: 'var(--leaf-600)', color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.75 : 1 }}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
