'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
    id: string; productName: string; category: string; unit: string;
    basePrice: number; price: number | null; quantity: number; updatedAt: string;
}

interface EditState { qty: string; price: string; }

export default function DealerInventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Record<string, EditState>>({});
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dealer/inventory').then(r => r.json()).then(d => setInventory(d.inventory ?? [])).finally(() => setLoading(false));
    }, []);

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
        const data = await res.json();
        if (data.ok) {
            setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: parseInt(e.qty), price: parseFloat(e.price) } : i));
        }
        cancelEdit(id);
        setSaving(null);
    };

    const lowCount = inventory.filter(i => i.quantity < 10).length;
    const CATCOLORS: Record<string, string> = { Fertilizer: '#D1FAE5', Seeds: '#FEF3C7', Pesticide: '#FEE2E2', Equipment: '#DBEAFE', Other: '#F3F4F6' };
    const CATTXT: Record<string, string> = { Fertilizer: '#065F46', Seeds: '#92400E', Pesticide: '#991B1B', Equipment: '#1E40AF', Other: '#374151' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Inventory</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{inventory.length} products · {lowCount > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠️ {lowCount} low stock</span>}</p>
                </div>
            </div>

            {lowCount > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1.125rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: '#991B1B' }}>
                    <span>⚠️</span>
                    <strong>{lowCount} item(s)</strong> have less than 10 units in stock. Update quantities to avoid stockouts.
                </div>
            )}

            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            {['Product', 'Category', 'Base Price', 'Your Price', 'Stock', 'Last Updated', ''].map(h => (
                                <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={7} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '18px' }} /></td></tr>
                            )) : inventory.map((item, i) => {
                                const isEditing = !!editing[item.id];
                                const stockColor = item.quantity < 10 ? '#DC2626' : item.quantity < 20 ? '#D97706' : '#16a34a';
                                const stockBg = item.quantity < 10 ? '#FEF2F2' : item.quantity < 20 ? '#FFFBEB' : '#F0FDF4';

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)', background: isEditing ? '#FAFAF5' : i % 2 === 0 ? 'white' : 'var(--gray-50)', transition: 'background 0.1s' }}>
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
                                                    style={{ width: '80px', padding: '0.3rem 0.5rem', border: '1.5px solid #8B5CF6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                                            ) : (
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.price ? `₹${item.price}` : <span style={{ color: 'var(--gray-400)' }}>—</span>}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            {isEditing ? (
                                                <input type="number" value={editing[item.id].qty} onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: e.target.value } }))}
                                                    style={{ width: '70px', padding: '0.3rem 0.5rem', border: '1.5px solid #8B5CF6', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '8px', background: stockBg, color: stockColor, fontWeight: 800, fontSize: '0.85rem' }}>
                                                    {item.quantity}
                                                    {item.quantity < 10 && <span style={{ fontSize: '0.65rem' }}>⚠️</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.76rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                            {new Date(item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                    <button onClick={() => save(item.id)} disabled={saving === item.id} style={{ padding: '0.3rem 0.7rem', border: 'none', borderRadius: '7px', background: '#8B5CF6', color: 'white', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>
                                                        {saving === item.id ? '…' : 'Save'}
                                                    </button>
                                                    <button onClick={() => cancelEdit(item.id)} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.76rem', cursor: 'pointer' }}>✕</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(item)} style={{ padding: '0.3rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '7px', background: 'white', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                                                    Edit
                                                </button>
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
    );
}
