'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface DealerInfo {
    id: string; name: string; email: string; phone: string; address: string;
}

export default function DealerInvitePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [dealer, setDealer] = useState<DealerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const loginUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/dealer/login`
        : 'https://app.grapemaster.com/dealer/login';

    useEffect(() => {
        fetch(`/api/admin/dealers/${id}`)
            .then(r => r.json())
            .then(d => setDealer(d.dealer))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/dealers/${id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (data.ok) { setSuccess(true); }
            else { setError(data.error ?? 'Failed to set password'); }
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(loginUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        if (!dealer) return;
        const msg =
            `🍇 *GrapeMaster Dealer Portal*\n\n` +
            `Hello ${dealer.name}! Your dealer account has been set up.\n\n` +
            `📧 Email: ${dealer.email}\n` +
            `🔑 Password: ${newPassword || '[as set by admin]'}\n` +
            `🔗 Login: ${loginUrl}\n\n` +
            `Please change your password after first login. Welcome aboard!`;
        const phone = dealer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handlePrint = () => {
        if (!dealer) return;
        const win = window.open('', '_blank', 'width=600,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head>
        <title>GrapeMaster Dealer Credentials</title>
        <style>
            body{font-family:Arial,sans-serif;padding:2rem;max-width:520px;margin:0 auto;color:#111}
            h1{color:#2A7436;font-size:1.4rem;border-bottom:3px solid #2A7436;padding-bottom:.5rem}
            .row{display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid #eee;font-size:.9rem}
            .label{color:#777;font-weight:600}.val{font-weight:700}
            .box{background:#f0fdf4;border:2px solid #2A7436;border-radius:8px;padding:1rem;margin-top:1rem}
            .footer{margin-top:2rem;color:#aaa;font-size:.75rem;text-align:center}
        </style></head><body>
        <h1>🍇 GrapeMaster — Dealer Login Credentials</h1>
        <div class="row"><span class="label">Dealer Name</span><span class="val">${dealer.name}</span></div>
        <div class="row"><span class="label">Email</span><span class="val">${dealer.email}</span></div>
        <div class="row"><span class="label">Phone</span><span class="val">${dealer.phone}</span></div>
        <div class="row"><span class="label">Address</span><span class="val">${dealer.address}</span></div>
        <div class="box">
            <div class="row"><span class="label">Login URL</span><span class="val">${loginUrl}</span></div>
            <div class="row"><span class="label">Email (username)</span><span class="val">${dealer.email}</span></div>
            <div class="row"><span class="label">Password</span><span class="val">${newPassword || '(as set by admin)'}</span></div>
        </div>
        <div class="footer">GrapeMaster Admin · Printed ${new Date().toLocaleString('en-IN')}<br/>Please change your password after first login.</div>
        </body></html>`);
        win.document.close();
        win.print();
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</div>;
    if (!dealer) return <div style={{ color: '#DC2626', padding: '2rem' }}>Dealer not found</div>;

    return (
        <div style={{ maxWidth: '640px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                <button onClick={() => router.push('/admin/dealers')} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>Dealers</button>
                <span>›</span>
                <button onClick={() => router.push(`/admin/dealers/${id}`)} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', cursor: 'pointer', fontWeight: 600 }}>{dealer.name}</button>
                <span>›</span>
                <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>Onboard / Invite</span>
            </div>

            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                Dealer Onboarding
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginBottom: '1.75rem' }}>
                Set a login password and share credentials with {dealer.name}.
            </p>

            {/* Dealer Info card */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.875rem', color: 'var(--gray-700)' }}>👤 Dealer Details</div>
                {[
                    { label: 'Name', val: dealer.name },
                    { label: 'Email (Login ID)', val: dealer.email },
                    { label: 'Phone', val: dealer.phone },
                    { label: 'Address', val: dealer.address },
                ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.84rem' }}>
                        <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontWeight: 700, color: 'var(--gray-800)', maxWidth: '65%', textAlign: 'right' }}>{val}</span>
                    </div>
                ))}
            </div>

            {/* Set password form */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>🔑 Set Login Password</div>
                {success ? (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', color: '#15803D', fontWeight: 600, fontSize: '0.88rem' }}>
                        ✓ Password set successfully! Share the credentials below with the dealer.
                    </div>
                ) : (
                    <form onSubmit={handleSetPassword}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.3rem' }}>New Password *</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Min 8 characters" minLength={8}
                                    className="input" style={{ fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.3rem' }}>Confirm Password *</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    className="input" style={{ fontSize: '0.85rem' }} />
                            </div>
                            {error && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#DC2626', fontSize: '0.82rem' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                            <button type="submit" disabled={saving} style={{
                                padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px',
                                background: 'var(--leaf-600)', color: 'white', fontWeight: 700, fontSize: '0.88rem',
                                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.75 : 1, alignSelf: 'flex-start',
                            }}>
                                {saving ? 'Setting Password…' : 'Set Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Share credentials */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>📤 Share Credentials</div>

                {/* Login URL */}
                <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Login URL</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--leaf-700)', wordBreak: 'break-all' }}>{loginUrl}</div>
                    </div>
                    <button onClick={handleCopyLink} style={{
                        padding: '0.4rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '7px',
                        background: copied ? '#D1FAE5' : 'white', color: copied ? '#15803D' : 'var(--gray-700)',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    }}>
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleWhatsApp} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.6rem 1.1rem', border: '1px solid #25D366', borderRadius: '8px',
                        background: 'white', color: '#128C7E', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}>
                        💬 Send via WhatsApp
                    </button>
                    <button onClick={handlePrint} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.6rem 1.1rem', border: '1px solid var(--gray-200)', borderRadius: '8px',
                        background: 'white', color: 'var(--gray-700)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}>
                        🖨️ Print Credentials
                    </button>
                </div>
            </div>
        </div>
    );
}
