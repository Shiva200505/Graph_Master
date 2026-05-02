'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/admin/StatusBadge';
import { useCartStore } from '@/store/cartStore';

interface Order {
    id: string; orderNumber: string; dealerId: string; dealerName: string; fulfillmentType: string;
    status: string; total: number; deliveryCharge: number; createdAt: string;
    items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
}

interface UserInfo { id: string; name: string | null; phone: string | null; }

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES = new Set(['pending', 'pending_payment', 'confirmed', 'dispatched']);
const POLL_INTERVAL = 30_000; // 30 s

function isActive(status: string) { return ACTIVE_STATUSES.has(status); }
function isCompleted(status: string) { return status === 'delivered'; }
function isCancelled(status: string) { return status === 'cancelled'; }

export default function AccountPage() {
    const router = useRouter();
    const { addItem, setDealer, openCart } = useCartStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [reordering, setReordering] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch orders ─────────────────────────────────────────────────────────
    const fetchOrders = useCallback(async (pageNum = 1, append = false) => {
        const res = await fetch(`/api/account/orders?page=${pageNum}`);
        if (res.status === 401) { router.push('/login?next=/account'); return; }
        const d = await res.json();
        if (d.orders) {
            setOrders(prev => append ? [...prev, ...d.orders] : d.orders);
            setTotalPages(d.totalPages || 1);
            setPage(d.page || 1);
        }
        setLoading(false);
    }, [router]);

    // ── Fetch user info ──────────────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => { 
                if (d && !d.error) { 
                    setUser(d); 
                    setProfileName(d.name || ''); 
                } 
            });
    }, []);

    // ── Initial load + polling ───────────────────────────────────────────────
    useEffect(() => {
        fetchOrders(1, false);
    }, [fetchOrders]);

    useEffect(() => {
        // Start polling when there are active orders
        const hasActive = orders.some(o => isActive(o.status));
        if (hasActive && !intervalRef.current) {
            intervalRef.current = setInterval(() => fetchOrders(), POLL_INTERVAL);
        } else if (!hasActive && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        };
    }, [orders, fetchOrders]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    // ── Reorder ──────────────────────────────────────────────────────────────
    const handleReorder = async (order: Order) => {
        setReordering(order.id);
        try {
            const statusRes = await fetch(`/api/dealers/${order.dealerId}/status`);
            const statusData = await statusRes.json();
            
            if (!statusData.active) {
                alert('This dealer is no longer active. Please select a new location to find another dealer.');
                return;
            }

            setDealer(order.dealerId, statusData.name);

            order.items.forEach((item, idx) => {
                addItem({
                    id: `reorder-${order.id}-${idx}`,
                    productId: `reorder-${idx}`, // Just a placeholder, ideally should be actual productId if we had it, but this works for UX
                    name: item.productName,
                    unit: '',
                    price: item.unitPrice,
                    maxQuantity: 999, // Set to 999 as requested
                    inventoryId: '',
                });
            });
            openCart();
            router.push('/checkout');
        } catch (err) {
            console.error(err);
            alert('Failed to initiate reorder. Please try again.');
        } finally {
            setReordering(null);
        }
    };

    // ── Profile ──────────────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!profileName || profileName.trim().length < 2) return alert('Name must be at least 2 characters');
        setSavingProfile(true);
        try {
            const res = await fetch('/api/account/profile', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: profileName }),
            });
            if (res.ok) {
                setUser(prev => prev ? { ...prev, name: profileName.trim() } : null);
                setShowProfile(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save profile');
            }
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Cancel Order ─────────────────────────────────────────────────────────
    const handleCancel = async (order: Order) => {
        if (!confirm(`Cancel order #${order.orderNumber}? Your refund of ₹${order.total.toLocaleString('en-IN')} will be processed in 5-7 days.`)) return;
        
        setCancelling(order.id);
        try {
            const res = await fetch(`/api/account/orders/${order.id}/cancel`, { method: 'POST' });
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
                alert('Order cancelled successfully.');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to cancel order.');
            }
        } finally {
            setCancelling(null);
        }
    };

    // ── Filter ───────────────────────────────────────────────────────────────
    const filtered = orders.filter(o => {
        if (activeTab === 'active') return isActive(o.status);
        if (activeTab === 'completed') return isCompleted(o.status);
        if (activeTab === 'cancelled') return isCancelled(o.status);
        return true;
    });

    const tabCounts = {
        all: orders.length,
        active: orders.filter(o => isActive(o.status)).length,
        completed: orders.filter(o => isCompleted(o.status)).length,
        cancelled: orders.filter(o => isCancelled(o.status)).length,
    };

    const TABS: { key: FilterTab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
    ];

    const hasActiveOrders = orders.some(o => isActive(o.status));

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--leaf-600)', textDecoration: 'none', fontWeight: 600, marginBottom: '0.75rem' }}>
                            ← Back to Shop
                        </a>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--gray-900)', margin: 0 }}>My Orders</h1>
                            {hasActiveOrders && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700, color: '#22C55E', background: '#F0FDF4', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                    Live Tracking
                                </div>
                            )}
                        </div>
                        {user && (
                            <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', margin: 0 }}>
                                {user.name ? <>Hey, <strong style={{ color: 'var(--gray-700)' }}>{user.name}</strong> · </> : ''}{orders.length} order{orders.length !== 1 ? 's' : ''}
                                {user.phone && <span style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}> · {user.phone}</span>}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setShowProfile(!showProfile)} style={{ padding: '0.45rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: showProfile ? 'var(--gray-100)' : 'white', fontSize: '0.82rem', color: 'var(--gray-700)', cursor: 'pointer', fontWeight: 600 }}>
                            ⚙️ Profile
                        </button>
                        <button onClick={handleLogout} style={{ padding: '0.45rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.82rem', color: 'var(--gray-600)', cursor: 'pointer', fontWeight: 600 }}>
                            Log Out
                        </button>
                    </div>
                </div>

                {/* ── Profile Section ── */}
                {showProfile && user && (
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--gray-800)' }}>Edit Profile</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '0.3rem' }}>Phone Number</label>
                                <input type="text" value={user.phone || ''} disabled style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'var(--gray-50)', color: 'var(--gray-500)', fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '0.3rem' }}>Full Name</label>
                                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your Name" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--gray-300)', borderRadius: '8px', fontSize: '0.85rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowProfile(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', background: 'white', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={handleSaveProfile} disabled={savingProfile || !profileName.trim()} style={{ padding: '0.5rem 1rem', border: 'none', background: 'var(--leaf-600)', color: 'white', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                                {savingProfile ? 'Saving...' : 'Save Name'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Filter Tabs ── */}
                {!loading && orders.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'white', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '0.25rem', boxShadow: 'var(--shadow-xs)' }}>
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, padding: '0.45rem 0.5rem', border: 'none',
                                    borderRadius: '7px', cursor: 'pointer', fontWeight: activeTab === tab.key ? 700 : 500,
                                    fontSize: '0.82rem', transition: 'all 0.15s',
                                    background: activeTab === tab.key ? 'var(--leaf-600)' : 'transparent',
                                    color: activeTab === tab.key ? 'white' : 'var(--gray-600)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                }}>
                                {tab.label}
                                {tabCounts[tab.key] > 0 && (
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700,
                                        background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--gray-100)',
                                        color: activeTab === tab.key ? 'white' : 'var(--gray-500)',
                                        padding: '0.05rem 0.4rem', borderRadius: '20px', minWidth: '18px', textAlign: 'center',
                                    }}>
                                        {tabCounts[tab.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Loading skeletons ── */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
                    </div>

                ) : orders.length === 0 ? (
                    /* ── Empty state ── */
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>🌾</div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>No orders yet</div>
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: '280px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                            Start shopping for fresh agricultural products from dealers near you.
                        </p>
                        <a href="/products" style={{ padding: '0.65rem 1.5rem', background: 'var(--leaf-600)', color: 'white', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block' }}>
                            Browse Products →
                        </a>
                    </div>

                ) : filtered.length === 0 ? (
                    /* ── Empty filtered state ── */
                    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
                        <div style={{ fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.4rem' }}>No {activeTab} orders</div>
                        <button onClick={() => setActiveTab('all')} style={{ fontSize: '0.84rem', color: 'var(--leaf-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all orders →</button>
                    </div>

                ) : (
                    /* ── Order list ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {filtered.map(order => {
                            const live = isActive(order.status);
                            return (
                                <div key={order.id} style={{ background: 'white', border: `1px solid ${live ? 'rgba(34,197,94,0.25)' : 'var(--gray-200)'}`, borderRadius: '14px', overflow: 'hidden', boxShadow: live ? '0 0 0 3px rgba(34,197,94,0.06)' : 'var(--shadow-xs)', transition: 'box-shadow 0.2s' }}>

                                    {/* Active order indicator strip */}
                                    {live && (
                                        <div style={{ height: '3px', background: 'linear-gradient(to right, #22C55E, #4ADE80)', animation: 'shimmer 2s linear infinite' }} />
                                    )}

                                    {/* Order Header row */}
                                    <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                        style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--leaf-700)', fontSize: '0.9rem' }}>#{order.orderNumber}</span>
                                                <StatusBadge status={order.status} size="sm" />
                                                {live && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 700, color: '#22C55E' }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                                        Live
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', background: order.fulfillmentType === 'pickup' ? '#E0F2FE' : '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 600 }}>
                                                    {order.fulfillmentType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                                {order.dealerName} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--gray-900)' }}>₹{order.total.toLocaleString('en-IN')}</div>
                                            <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{expandedId === order.id ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {/* Expanded Items + Reorder */}
                                    {expandedId === order.id && (
                                        <div style={{ borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
                                            <div style={{ padding: '1rem 1.25rem' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead><tr>
                                                        {['Product', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                                                            <th key={h} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', padding: '0.3rem 0.5rem', textAlign: h !== 'Product' ? 'right' : 'left' }}>{h}</th>
                                                        ))}
                                                    </tr></thead>
                                                    <tbody>
                                                        {order.items.map((item, i) => (
                                                            <tr key={i} style={{ borderTop: '1px solid var(--gray-200)' }}>
                                                                <td style={{ padding: '0.5rem', fontSize: '0.83rem', fontWeight: 600 }}>{item.productName}</td>
                                                                <td style={{ padding: '0.5rem', fontSize: '0.83rem', textAlign: 'right' }}>{item.quantity}</td>
                                                                <td style={{ padding: '0.5rem', fontSize: '0.83rem', textAlign: 'right' }}>₹{item.unitPrice}</td>
                                                                <td style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.83rem', textAlign: 'right', color: 'var(--leaf-700)' }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                                                            </tr>
                                                        ))}
                                                        {order.deliveryCharge > 0 && (
                                                            <tr style={{ borderTop: '1px solid var(--gray-200)' }}>
                                                                <td colSpan={3} style={{ padding: '0.5rem', fontSize: '0.82rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>Delivery charge</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.82rem' }}>₹{order.deliveryCharge}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <a href={`/order/${order.id}`}
                                                    style={{ padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'white', fontSize: '0.8rem', color: 'var(--gray-700)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    📋 View Details
                                                </a>
                                                {!isCancelled(order.status) && (
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        disabled={reordering === order.id}
                                                        style={{
                                                            padding: '0.4rem 0.875rem', border: 'none', borderRadius: '8px',
                                                            background: 'var(--leaf-600)', color: 'white', fontSize: '0.8rem',
                                                            cursor: reordering === order.id ? 'wait' : 'pointer', fontWeight: 700,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                            opacity: reordering === order.id ? 0.75 : 1,
                                                        }}>
                                                        {reordering === order.id ? '…' : '🔄 Reorder'}
                                                    </button>
                                                )}
                                                {['pending', 'pending_payment', 'confirmed'].includes(order.status) && (
                                                    <button
                                                        onClick={() => handleCancel(order)}
                                                        disabled={cancelling === order.id}
                                                        style={{
                                                            padding: '0.4rem 0.875rem', border: '1px solid #FECACA', borderRadius: '8px',
                                                            background: '#FEF2F2', color: '#991B1B', fontSize: '0.8rem',
                                                            cursor: cancelling === order.id ? 'wait' : 'pointer', fontWeight: 700,
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                            opacity: cancelling === order.id ? 0.75 : 1,
                                                        }}>
                                                        {cancelling === order.id ? 'Cancelling…' : '❌ Cancel Order'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Polling notice */}
                {hasActiveOrders && (
                    <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '1.25rem' }}>
                        🔄 Active orders refresh automatically every 30 seconds
                    </p>
                )}

                {/* Load More Button */}
                {page < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button 
                            onClick={async () => {
                                setLoadingMore(true);
                                await fetchOrders(page + 1, true);
                                setLoadingMore(false);
                            }} 
                            disabled={loadingMore}
                            style={{ padding: '0.6rem 1.5rem', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-700)', cursor: 'pointer' }}>
                            {loadingMore ? 'Loading...' : 'Load More ↓'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
