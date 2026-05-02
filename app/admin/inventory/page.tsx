'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dealer { id: string; name: string; isActive: boolean; }
interface InventoryItem {
    id: string; productId: string; productName: string; category: string;
    unit: string; basePrice: number; price: number | null; quantity: number; updatedAt: string;
}
interface AvailableProduct { id: string; name: string; category: string; unit: string; basePrice: number; }
interface EditState { qty: string; price: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CATCOLORS: Record<string, string> = { Fertilizer: '#D1FAE5', Seeds: '#FEF3C7', Pesticide: '#FEE2E2', Equipment: '#DBEAFE' };
const CATTXT: Record<string, string> = { Fertilizer: '#065F46', Seeds: '#92400E', Pesticide: '#991B1B', Equipment: '#1E40AF' };
const catBg = (c: string) => CATCOLORS[c] ?? '#F3F4F6';
const catTxt = (c: string) => CATTXT[c] ?? '#374151';

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminInventoryPage() {
    // Dealer selector
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [dealersLoading, setDealersLoading] = useState(true);
    const [selectedDealerId, setSelectedDealerId] = useState('');

    // Inventory table
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [invLoading, setInvLoading] = useState(false);

    // Inline editing
    const [editing, setEditing] = useState<Record<string, EditState>>({});
    const [saving, setSaving] = useState<string | null>(null);

    // Add Product modal
    const [showModal, setShowModal] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
    const [modalProductId, setModalProductId] = useState('');
    const [modalQty, setModalQty] = useState('0');
    const [modalPrice, setModalPrice] = useState('');
    const [modalSaving, setModalSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    // Bulk / export
    const [bulkResetting, setBulkResetting] = useState(false);

    // ── Load dealers ─────────────────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/admin/dealers')
            .then(r => r.json())
            .then(d => setDealers(d.dealers ?? []))
            .finally(() => setDealersLoading(false));
    }, []);

    // ── Load inventory when dealer changes ───────────────────────────────────
    const fetchInventory = useCallback(async (dealerId: string) => {
        if (!dealerId) return;
        setInvLoading(true);
        setEditing({});
        try {
            const res = await fetch(`/api/admin/inventory?dealerId=${dealerId}`);
            const d = await res.json();
            setInventory(d.inventory ?? []);
        } finally {
            setInvLoading(false);
        }
    }, []);

    useEffect(() => { if (selectedDealerId) fetchInventory(selectedDealerId); }, [selectedDealerId, fetchInventory]);

    // ── Computed stats ───────────────────────────────────────────────────────
    const totalSKUs = inventory.length;
    const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;

    // ── Inline editing ───────────────────────────────────────────────────────
    const startEdit = (item: InventoryItem) => {
        setEditing(prev => ({ ...prev, [item.id]: { qty: String(item.quantity), price: String(item.price ?? item.basePrice) } }));
    };
    const cancelEdit = (id: string) => {
        setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    };
    const saveEdit = async (id: string) => {
        const e = editing[id];
        if (!e) return;
        setSaving(id);
        const res = await fetch(`/api/admin/inventory/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: parseInt(e.qty, 10), price: parseFloat(e.price) }),
        });
        const data = await res.json();
        if (data.ok) {
            setInventory(prev => prev.map(i => i.id === id
                ? { ...i, quantity: parseInt(e.qty, 10), price: parseFloat(e.price), updatedAt: data.item.updatedAt }
                : i));
        }
        cancelEdit(id);
        setSaving(null);
    };

    // ── Delete item ──────────────────────────────────────────────────────────
    const deleteItem = async (id: string, name: string) => {
        if (!confirm(`Remove "${name}" from this dealer's inventory?`)) return;
        await fetch(`/api/admin/inventory/${id}`, { method: 'DELETE' });
        setInventory(prev => prev.filter(i => i.id !== id));
    };

    // ── Bulk: zero all stock ─────────────────────────────────────────────────
    const bulkZeroStock = async () => {
        if (!confirm(`Set ALL stock quantities to 0 for this dealer? This cannot be undone.`)) return;
        setBulkResetting(true);
        await Promise.all(inventory.map(i =>
            fetch(`/api/admin/inventory/${i.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: 0 }),
            })
        ));
        setInventory(prev => prev.map(i => ({ ...i, quantity: 0 })));
        setBulkResetting(false);
    };

    // ── Export CSV ───────────────────────────────────────────────────────────
    const exportCsv = () => {
        const dealer = dealers.find(d => d.id === selectedDealerId);
        const headers = ['Product', 'Category', 'Unit', 'Base Price', 'Dealer Price', 'Stock Qty', 'Last Updated'];
        const rows = inventory.map(i => [
            `"${i.productName}"`, i.category, i.unit, i.basePrice,
            i.price ?? '', i.quantity, new Date(i.updatedAt).toLocaleString('en-IN'),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-${dealer?.name ?? 'dealer'}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Open Add Product modal ───────────────────────────────────────────────
    const openModal = async () => {
        setModalProductId(''); setModalQty('0'); setModalPrice(''); setModalError('');
        setShowModal(true);
        const res = await fetch(`/api/admin/products/available?dealerId=${selectedDealerId}`);
        const d = await res.json();
        setAvailableProducts(d.products ?? []);
    };

    // ── Submit Add Product ───────────────────────────────────────────────────
    const submitAddProduct = async () => {
        if (!modalProductId) { setModalError('Please select a product'); return; }
        const qty = parseInt(modalQty, 10);
        if (isNaN(qty) || qty < 0) { setModalError('Quantity must be >= 0'); return; }
        setModalSaving(true); setModalError('');
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealerId: selectedDealerId,
                    productId: modalProductId,
                    quantity: qty,
                    ...(modalPrice ? { price: parseFloat(modalPrice) } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setModalError(data.error ?? 'Failed to add product'); return; }
            setInventory(prev => [data.item, ...prev]);
            setShowModal(false);
        } finally {
            setModalSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Inventory Management</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>
                        Manage stock and prices across all dealers
                    </p>
                </div>
                {selectedDealerId && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={exportCsv}
                            style={{ padding: '0.5rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            ⬇ Export CSV
                        </button>
                        <button onClick={bulkZeroStock} disabled={bulkResetting || inventory.length === 0}
                            style={{ padding: '0.5rem 0.875rem', border: 'none', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: bulkResetting ? 0.6 : 1 }}>
                            {bulkResetting ? '…Resetting' : '⚠ Zero All Stock'}
                        </button>
                        <button onClick={openModal}
                            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', background: 'var(--leaf-600)', color: 'white', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            + Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* ── Dealer Selector ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-700)', flexShrink: 0 }}>
                    Select Dealer to Manage Inventory
                </label>
                {dealersLoading ? (
                    <div className="skeleton" style={{ height: '38px', width: '260px', borderRadius: '8px' }} />
                ) : (
                    <select
                        value={selectedDealerId}
                        onChange={e => setSelectedDealerId(e.target.value)}
                        style={{ padding: '0.55rem 0.875rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, background: 'white', outline: 'none', minWidth: '260px', cursor: 'pointer' }}
                    >
                        <option value="">— Choose a dealer —</option>
                        {dealers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}{!d.isActive ? ' (Inactive)' : ''}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* ── Stats Bar ── */}
            {selectedDealerId && !invLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: 'Total SKUs', value: totalSKUs, color: 'var(--leaf-700)', bg: '#F0FDF4' },
                        { label: 'Low Stock (<10)', value: lowStockCount, color: lowStockCount > 0 ? '#D97706' : 'var(--gray-500)', bg: lowStockCount > 0 ? '#FFFBEB' : 'var(--gray-50)' },
                        { label: 'Out of Stock', value: outOfStockCount, color: outOfStockCount > 0 ? '#DC2626' : 'var(--gray-500)', bg: outOfStockCount > 0 ? '#FEF2F2' : 'var(--gray-50)' },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: stat.bg, border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Placeholder when no dealer selected ── */}
            {!selectedDealerId && (
                <div style={{ background: 'white', border: '2px dashed var(--gray-200)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--gray-600)' }}>Select a Dealer</div>
                    <div style={{ fontSize: '0.84rem' }}>Choose a dealer from the dropdown above to manage their inventory.</div>
                </div>
            )}

            {/* ── Inventory Table ── */}
            {selectedDealerId && (
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                    {['Product', 'Category', 'Base Price', 'Dealer Price', 'Stock Qty', 'Last Updated', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invLoading ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                                )) : inventory.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.88rem' }}>
                                        No products in inventory — click <strong>+ Add Product</strong> to get started.
                                    </td></tr>
                                ) : inventory.map((item, idx) => {
                                    const isEditing = !!editing[item.id];
                                    const isLow = item.quantity > 0 && item.quantity < 10;
                                    const isOut = item.quantity === 0;
                                    const stockColor = isOut ? '#DC2626' : isLow ? '#D97706' : '#16a34a';
                                    const stockBg = isOut ? '#FEF2F2' : isLow ? '#FFFBEB' : '#F0FDF4';
                                    const rowBg = isOut ? '#FFF5F5' : isEditing ? '#FAFAF5' : idx % 2 === 0 ? 'white' : 'var(--gray-50)';

                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)', background: rowBg, transition: 'background 0.1s' }}>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{item.productName}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>per {item.unit}</div>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: catBg(item.category), color: catTxt(item.category) }}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>₹{item.basePrice}</td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                {isEditing ? (
                                                    <input type="number" value={editing[item.id].price}
                                                        onChange={e => setEditing(p => ({ ...p, [item.id]: { ...p[item.id], price: e.target.value } }))}
                                                        style={{ width: '80px', padding: '0.3rem 0.5rem', border: '1.5px solid var(--leaf-500)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                                                ) : (
                                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.price ? `₹${item.price}` : <span style={{ color: 'var(--gray-400)' }}>—</span>}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                {isEditing ? (
                                                    <input type="number" value={editing[item.id].qty}
                                                        onChange={e => setEditing(p => ({ ...p, [item.id]: { ...p[item.id], qty: e.target.value } }))}
                                                        style={{ width: '70px', padding: '0.3rem 0.5rem', border: '1.5px solid var(--leaf-500)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: stockBg, color: stockColor, fontWeight: 800, fontSize: '0.85rem' }}>
                                                        {item.quantity}
                                                        {(isOut || isLow) && <span style={{ fontSize: '0.65rem' }}>{isOut ? '❌' : '⚠️'}</span>}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.76rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                                {new Date(item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                        <button onClick={() => saveEdit(item.id)} disabled={saving === item.id}
                                                            style={{ padding: '0.3rem 0.7rem', border: 'none', borderRadius: '7px', background: 'var(--leaf-600)', color: 'white', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>
                                                            {saving === item.id ? '…' : 'Save'}
                                                        </button>
                                                        <button onClick={() => cancelEdit(item.id)}
                                                            style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer' }}>✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                        <button onClick={() => startEdit(item)}
                                                            style={{ padding: '0.3rem 0.65rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                            Edit
                                                        </button>
                                                        <button onClick={() => deleteItem(item.id, item.productName)}
                                                            style={{ padding: '0.3rem 0.65rem', border: 'none', borderRadius: '7px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ADD PRODUCT MODAL
            ══════════════════════════════════════════════════════════════════ */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '460px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', animation: 'fadeUp 0.2s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gray-900)' }}>Add Product to Inventory</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1 }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.3rem' }}>Product *</label>
                                <select value={modalProductId} onChange={e => {
                                    const p = availableProducts.find(p => p.id === e.target.value);
                                    setModalProductId(e.target.value);
                                    if (p) setModalPrice(String(p.basePrice));
                                }} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', outline: 'none' }}>
                                    <option value="">— Select product —</option>
                                    {availableProducts.length === 0 ? (
                                        <option disabled>All products already added</option>
                                    ) : availableProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.category}) — ₹{p.basePrice}/{p.unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.3rem' }}>Initial Stock Qty *</label>
                                    <input type="number" min="0" value={modalQty} onChange={e => setModalQty(e.target.value)}
                                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.3rem' }}>Dealer Price (₹)</label>
                                    <input type="number" step="0.01" min="0" value={modalPrice} onChange={e => setModalPrice(e.target.value)}
                                        placeholder="leave blank = base price"
                                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }} />
                                </div>
                            </div>
                        </div>

                        {modalError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#DC2626', fontSize: '0.82rem', marginTop: '0.875rem', display: 'flex', gap: '0.35rem' }}>
                                <span>⚠️</span> {modalError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                            <button onClick={submitAddProduct} disabled={modalSaving}
                                style={{ flex: 1, padding: '0.65rem 1rem', border: 'none', borderRadius: '8px', background: 'var(--leaf-600)', color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: modalSaving ? 'wait' : 'pointer', opacity: modalSaving ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                {modalSaving ? (
                                    <><span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />Adding…</>
                                ) : 'Add to Inventory'}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                style={{ padding: '0.65rem 1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600, color: 'var(--gray-600)' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
