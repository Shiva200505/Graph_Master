'use client';

import { useEffect, useState } from 'react';

interface Product {
    id: string; name: string; description: string; category: string; unit: string;
    basePrice: number; isActive: boolean; dealerCount: number; orderCount: number;
}

const CATEGORIES = ['Fertilizer', 'Seeds', 'Pesticide', 'Equipment', 'Other'];
const UNITS = ['bag', 'packet', 'liter', 'piece', 'kit', 'kg'];

const emptyForm = { name: '', description: '', category: 'Fertilizer', unit: 'bag', basePrice: '' };

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchProducts = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(data.products ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleSave = async () => {
        if (!form.name || !form.basePrice) return;
        setSaving(true);
        if (editId) {
            await fetch(`/api/admin/products/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, basePrice: parseFloat(form.basePrice) }) });
        } else {
            await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, basePrice: parseFloat(form.basePrice) }) });
        }
        await fetchProducts();
        setShowForm(false); setForm(emptyForm); setEditId(null); setSaving(false);
    };

    const toggleActive = async (id: string, cur: boolean) => {
        await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !cur }) });
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !cur } : p));
    };

    const startEdit = (p: Product) => {
        setForm({ name: p.name, description: p.description ?? '', category: p.category ?? 'Fertilizer', unit: p.unit ?? 'bag', basePrice: String(p.basePrice) });
        setEditId(p.id); setShowForm(true);
    };

    const CATCOLORS: Record<string, string> = { Fertilizer: '#D1FAE5', Seeds: '#FEF3C7', Pesticide: '#FEE2E2', Equipment: '#DBEAFE', Other: '#F3F4F6' };
    const CATTEXT: Record<string, string> = { Fertilizer: '#065F46', Seeds: '#92400E', Pesticide: '#991B1B', Equipment: '#1E40AF', Other: '#374151' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Products</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{products.filter(p => p.isActive).length} active products</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
                    style={{ padding: '0.55rem 1.1rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    + Add Product
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>{editId ? 'Edit Product' : 'Add New Product'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                        <div><label className="input-label">Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" /></div>
                        <div><label className="input-label">Category *</label>
                            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div><label className="input-label">Unit *</label>
                            <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                                {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                        <div><label className="input-label">Base Price (₹) *</label><input className="input" type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} placeholder="0.00" /></div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Description</label>
                        <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional product description" style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} disabled={saving || !form.name || !form.basePrice} style={{ padding: '0.5rem 1.1rem', background: 'var(--leaf-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: !form.name || !form.basePrice ? 0.4 : 1 }}>
                            {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Product'}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />) :
                    products.map(p => (
                        <div key={p.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)', opacity: p.isActive ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: CATCOLORS[p.category ?? 'Other'] ?? '#F3F4F6', color: CATTEXT[p.category ?? 'Other'] ?? '#374151' }}>{p.category}</span>
                                {!p.isActive && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>Inactive</span>}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</div>
                            {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: '0.625rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>}
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '0.875rem' }}>
                                <span>Unit: <strong>{p.unit}</strong></span>
                                <span>{p.dealerCount} dealers</span>
                                <span>{p.orderCount} orders</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--leaf-700)' }}>₹{p.basePrice}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => startEdit(p)} style={{ padding: '0.3rem 0.65rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                    <button onClick={() => toggleActive(p.id, p.isActive)} style={{ padding: '0.3rem 0.65rem', border: 'none', borderRadius: '7px', background: p.isActive ? '#FEE2E2' : '#D1FAE5', color: p.isActive ? '#991B1B' : '#065F46', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                        {p.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
