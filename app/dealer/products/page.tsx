'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
    id: string; productId: string; productName: string; category: string; unit: string;
    basePrice: number; price: number | null; quantity: number; updatedAt: string;
}

interface Product {
    id: string; name: string; description: string; category: string; unit: string;
    basePrice: number; isActive: boolean;
}

interface ProductRequest {
    id: string; productName: string; category: string; unit: string;
    estimatedPrice: number; status: string; adminNote: string | null; createdAt: string;
}

const CATEGORIES = ['Fertilizer', 'Seeds', 'Pesticide', 'Equipment', 'Other'];
const UNITS = ['bag', 'packet', 'liter', 'piece', 'kit', 'kg'];

export default function DealerProductsPage() {
    const [activeTab, setActiveTab] = useState<'my-products' | 'add-existing' | 'request-new'>('my-products');
    const [loading, setLoading] = useState(true);
    
    // Tab 1 state
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [editing, setEditing] = useState<Record<string, { qty: string; price: string }>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<Record<string, string>>({});
    const [bulkAddToExisting, setBulkAddToExisting] = useState(true);
    const [savingBulk, setSavingBulk] = useState(false);

    // Tab 2 state
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [addingExistingId, setAddingExistingId] = useState<string | null>(null);
    const [existingForm, setExistingForm] = useState({ quantity: '', price: '' });

    // Tab 3 state
    const [requests, setRequests] = useState<ProductRequest[]>([]);
    const [reqForm, setReqForm] = useState({ productName: '', category: 'Fertilizer', unit: 'bag', estimatedPrice: '', description: '', reason: '' });
    const [submittingReq, setSubmittingReq] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invRes, catRes, reqRes] = await Promise.all([
                fetch('/api/dealer/inventory'),
                fetch('/api/products'),
                fetch('/api/dealer/product-requests')
            ]);
            
            if (invRes.ok) {
                const invData = await invRes.json();
                setInventory(invData.inventory ?? []);
            }
            if (catRes.ok) {
                const catData = await catRes.json();
                setCatalog(catData.products ?? []);
            }
            if (reqRes.ok) {
                const reqData = await reqRes.json();
                setRequests(reqData.requests ?? []);
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    // --- TAB 1 FUNCTIONS ---
    const startEdit = (item: InventoryItem) => {
        setEditing(prev => ({ ...prev, [item.id]: { qty: String(item.quantity), price: String(item.price ?? item.basePrice) } }));
    };
    
    const cancelEdit = (id: string) => {
        setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    };
    
    const save = async (id: string) => {
        const e = editing[id];
        if (!e) return;
        setSaving(id);
        const res = await fetch(`/api/dealer/inventory/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: parseInt(e.qty), price: parseFloat(e.price) }),
        });
        if (res.ok) {
            setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: parseInt(e.qty) || 0, price: parseFloat(e.price) } : i));
        }
        cancelEdit(id);
        setSaving(null);
    };

    const removeFromShelf = async (id: string) => {
        if (!confirm('Are you sure you want to remove this from your shelf? (Quantity will be set to 0)')) return;
        setSaving(id);
        const res = await fetch(`/api/dealer/inventory/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: 0 }),
        });
        if (res.ok) {
            setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: 0 } : i));
        }
        setSaving(null);
    };

    const handleBulkSave = async () => {
        const updates = Object.entries(bulkUpdates)
            .filter(([_, qty]) => qty.trim() !== '')
            .map(([id, qty]) => ({ id, quantity: parseInt(qty) }));
            
        if (updates.length === 0) {
            setShowBulkModal(false);
            return;
        }

        setSavingBulk(true);
        const res = await fetch('/api/dealer/inventory/bulk', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates, addToExisting: bulkAddToExisting }),
        });

        if (res.ok) {
            await loadData();
            setBulkUpdates({});
            setShowBulkModal(false);
        }
        setSavingBulk(false);
    };

    // --- TAB 2 FUNCTIONS ---
    const addExistingProduct = async (productId: string) => {
        setAddingExistingId(productId);
        const res = await fetch('/api/dealer/inventory/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: parseInt(existingForm.quantity) || 0, price: parseFloat(existingForm.price) }),
        });
        if (res.ok) {
            await loadData();
            setActiveTab('my-products');
            setAddingExistingId(null);
            setExistingForm({ quantity: '', price: '' });
        }
    };

    // --- TAB 3 FUNCTIONS ---
    const submitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingReq(true);
        const res = await fetch('/api/dealer/product-requests', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqForm),
        });
        if (res.ok) {
            const data = await res.json();
            setRequests(prev => [data.request, ...prev]);
            setReqForm({ productName: '', category: 'Fertilizer', unit: 'bag', estimatedPrice: '', description: '', reason: '' });
        }
        setSubmittingReq(false);
    };

    // Computed values
    const lowCount = inventory.filter(i => i.quantity < 10).length;
    const inventoryProductIds = new Set(inventory.map(i => i.productId));
    const availableCatalog = catalog.filter(p => p.isActive && !inventoryProductIds.has(p.id))
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const CATCOLORS: Record<string, string> = { Fertilizer: '#D1FAE5', Seeds: '#FEF3C7', Pesticide: '#FEE2E2', Equipment: '#DBEAFE', Other: '#F3F4F6' };
    const CATTXT: Record<string, string> = { Fertilizer: '#065F46', Seeds: '#92400E', Pesticide: '#991B1B', Equipment: '#1E40AF', Other: '#374151' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Product Management</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>Manage your inventory and product catalog</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
                <button onClick={() => setActiveTab('my-products')} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'my-products' ? '2px solid #8B5CF6' : '2px solid transparent', color: activeTab === 'my-products' ? '#8B5CF6' : 'var(--gray-500)', fontWeight: activeTab === 'my-products' ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem' }}>
                    My Products ({inventory.length})
                </button>
                <button onClick={() => setActiveTab('add-existing')} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'add-existing' ? '2px solid #8B5CF6' : '2px solid transparent', color: activeTab === 'add-existing' ? '#8B5CF6' : 'var(--gray-500)', fontWeight: activeTab === 'add-existing' ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Add Existing Product
                </button>
                <button onClick={() => setActiveTab('request-new')} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'request-new' ? '2px solid #8B5CF6' : '2px solid transparent', color: activeTab === 'request-new' ? '#8B5CF6' : 'var(--gray-500)', fontWeight: activeTab === 'request-new' ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Request New Product
                </button>
            </div>

            {/* TAB 1: MY PRODUCTS */}
            {activeTab === 'my-products' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            {lowCount > 0 && <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.85rem' }}>⚠️ {lowCount} low stock items</span>}
                        </div>
                        <button onClick={() => setShowBulkModal(true)} style={{ padding: '0.5rem 1rem', background: '#F3E8FF', color: '#7E22CE', border: '1px solid #D8B4FE', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            📦 Bulk Update Stock
                        </button>
                    </div>

                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                    {['Product', 'Category', 'Base Price', 'Your Price', 'Stock', 'Last Updated', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> : 
                                     inventory.length === 0 ? <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>No products in your inventory. Go to "Add Existing Product" to start.</td></tr> :
                                     inventory.map((item, i) => {
                                        const isEditing = !!editing[item.id];
                                        const stockColor = item.quantity < 10 ? '#DC2626' : item.quantity < 20 ? '#D97706' : '#16a34a';
                                        const stockBg = item.quantity < 10 ? '#FEF2F2' : item.quantity < 20 ? '#FFFBEB' : '#F0FDF4';

                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)', background: isEditing ? '#FAFAF5' : i % 2 === 0 ? 'white' : 'var(--gray-50)' }}>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{item.productName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>per {item.unit}</div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: CATCOLORS[item.category ?? 'Other'] ?? '#F3F4F6', color: CATTXT[item.category ?? 'Other'] ?? '#374151' }}>{item.category}</span>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: 'var(--gray-500)' }}>₹{item.basePrice}</td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    {isEditing ? (
                                                        <input type="number" value={editing[item.id].price} onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: e.target.value } }))}
                                                            style={{ width: '80px', padding: '0.3rem 0.5rem', border: '1.5px solid #8B5CF6', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
                                                    ) : (
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.price ? `₹${item.price}` : <span style={{ color: 'var(--gray-400)' }}>—</span>}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    {isEditing ? (
                                                        <input type="number" value={editing[item.id].qty} onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: e.target.value } }))}
                                                            style={{ width: '70px', padding: '0.3rem 0.5rem', border: '1.5px solid #8B5CF6', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: stockBg, color: stockColor, fontWeight: 800, fontSize: '0.85rem' }}>
                                                            {item.quantity}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', fontSize: '0.76rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                                    {new Date(item.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                            <button onClick={() => save(item.id)} disabled={saving === item.id} style={{ padding: '0.3rem 0.7rem', border: 'none', borderRadius: '7px', background: '#8B5CF6', color: 'white', fontSize: '0.76rem', cursor: 'pointer' }}>Save</button>
                                                            <button onClick={() => cancelEdit(item.id)} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer' }}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button onClick={() => startEdit(item)} style={{ padding: '0.3rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                                            <button onClick={() => removeFromShelf(item.id)} disabled={saving === item.id} style={{ padding: '0.3rem 0.75rem', border: '1px solid #FECACA', borderRadius: '7px', background: '#FEF2F2', color: '#DC2626', fontSize: '0.78rem', cursor: 'pointer' }}>Remove</button>
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
                </div>
            )}

            {/* BULK UPDATE MODAL */}
            {showBulkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Bulk Update Stock</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>Enter the quantity for products you want to update.</p>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '8px' }}>
                            <input type="checkbox" checked={bulkAddToExisting} onChange={e => setBulkAddToExisting(e.target.checked)} />
                            Add to existing stock (unchecked = replace current stock)
                        </label>

                        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--gray-200)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)' }}>Product</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)' }}>Current Stock</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--gray-500)' }}>Quantity to Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}>{item.productName}</td>
                                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>{item.quantity}</td>
                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                <input type="number" placeholder="0" 
                                                    value={bulkUpdates[item.id] || ''} 
                                                    onChange={e => setBulkUpdates(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    style={{ width: '80px', padding: '0.3rem 0.5rem', border: '1px solid var(--gray-300)', borderRadius: '4px' }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => { setShowBulkModal(false); setBulkUpdates({}); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleBulkSave} disabled={savingBulk || Object.values(bulkUpdates).every(v => v.trim() === '')} style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', background: '#8B5CF6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                {savingBulk ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ADD EXISTING PRODUCT */}
            {activeTab === 'add-existing' && (
                <div>
                    <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--gray-300)', marginBottom: '1.5rem' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {availableCatalog.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No products found to add.</div> :
                         availableCatalog.map(p => (
                            <div key={p.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px', background: CATCOLORS[p.category] ?? '#F3F4F6', color: CATTXT[p.category] ?? '#374151' }}>{p.category}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--gray-500)' }}>₹{p.basePrice} base</span>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '1rem' }}>Unit: {p.unit}</div>

                                {addingExistingId === p.id ? (
                                    <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <div style={{ flex: 1 }}><input type="number" placeholder="Qty" value={existingForm.quantity} onChange={e => setExistingForm(prev => ({ ...prev, quantity: e.target.value }))} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }} /></div>
                                            <div style={{ flex: 1 }}><input type="number" placeholder="Price (₹)" value={existingForm.price} onChange={e => setExistingForm(prev => ({ ...prev, price: e.target.value }))} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }} /></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => addExistingProduct(p.id)} style={{ flex: 1, padding: '0.4rem', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                                            <button onClick={() => setAddingExistingId(null)} style={{ flex: 1, padding: '0.4rem', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => { setAddingExistingId(p.id); setExistingForm({ quantity: '', price: String(p.basePrice) }); }} style={{ width: '100%', padding: '0.5rem', background: 'white', border: '1px solid #8B5CF6', color: '#8B5CF6', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                        + Add to My Shelf
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: REQUEST NEW PRODUCT */}
            {activeTab === 'request-new' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                    <form onSubmit={submitRequest} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Request New Product</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Product Name *</label>
                                <input required type="text" value={reqForm.productName} onChange={e => setReqForm({...reqForm, productName: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Category *</label>
                                    <select value={reqForm.category} onChange={e => setReqForm({...reqForm, category: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Unit *</label>
                                    <select value={reqForm.unit} onChange={e => setReqForm({...reqForm, unit: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }}>
                                        {UNITS.map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Estimated Price (₹) *</label>
                                <input required type="number" value={reqForm.estimatedPrice} onChange={e => setReqForm({...reqForm, estimatedPrice: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                                <textarea rows={2} value={reqForm.description} onChange={e => setReqForm({...reqForm, description: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px', resize: 'vertical' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Why do you stock this?</label>
                                <textarea rows={2} value={reqForm.reason} onChange={e => setReqForm({...reqForm, reason: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '6px', resize: 'vertical' }} placeholder="e.g. Multiple farmers asking for it" />
                            </div>

                            <button type="submit" disabled={submittingReq} style={{ padding: '0.75rem', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                {submittingReq ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>

                    <div>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Past Requests</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {requests.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>No requests made yet.</div> :
                             requests.map(req => (
                                <div key={req.id} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.productName}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px', 
                                            background: req.status === 'pending' ? '#FEF3C7' : req.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                                            color: req.status === 'pending' ? '#92400E' : req.status === 'approved' ? '#065F46' : '#991B1B'
                                        }}>{req.status.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>₹{req.estimatedPrice} per {req.unit} · {req.category}</div>
                                    {req.adminNote && (
                                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: '6px', fontSize: '0.8rem', borderLeft: req.status === 'rejected' ? '3px solid #EF4444' : '3px solid #10B981' }}>
                                            <strong>Admin Note:</strong> {req.adminNote}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
