'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            router.push('/admin');
            router.refresh();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0C2410 0%, #1A4D25 100%)' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 1rem' }}>
                {/* Card */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍇</div>
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#0C2410' }}>
                            Grape<span style={{ color: '#2A7436' }}>Master</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.25rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Admin Portal
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="input-label">Email Address</label>
                            <input
                                className="input"
                                type="email"
                                placeholder="admin@grapemaster.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="input-label">Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>

                        {error && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#DC2626', fontSize: '0.85rem', display: 'flex', gap: '0.4rem' }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '0.8rem', background: loading ? '#ccc' : 'linear-gradient(135deg, #1A4D25, #2A7436)',
                                color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700,
                                fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
                            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <a href="/" style={{ fontSize: '0.8rem', color: 'var(--gray-400)', textDecoration: 'none' }}>← Back to Storefront</a>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                        <a href="/dealer/login" style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.3)', textDecoration: 'none' }}>
                            Are you a dealer? → Dealer Portal
                        </a>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                    GrapeMaster Admin Panel v2.0 · Restricted Access
                </div>
            </div>
        </div>
    );
}
