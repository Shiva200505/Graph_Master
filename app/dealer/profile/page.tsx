'use client';

import { useEffect, useState } from 'react';

interface Profile {
    id: string; name: string; email: string; phone: string;
    address: string; coverageRadiusKm: number; lat: number | null; lng: number | null;
}

const IL = { display: 'block', fontWeight: 700, fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.3rem' } as const;
const II = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: '8px', fontSize: '0.85rem', background: 'white', boxSizing: 'border-box' as const };

export default function DealerProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit contact form
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [contactSaving, setContactSaving] = useState(false);
    const [contactMsg, setContactMsg] = useState('');
    const [contactErr, setContactErr] = useState('');

    // Change password form
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passSaving, setPassSaving] = useState(false);
    const [passMsg, setPassMsg] = useState('');
    const [passErr, setPassErr] = useState('');

    useEffect(() => {
        fetch('/api/dealer/profile')
            .then(r => r.json())
            .then(d => {
                if (d.dealer) {
                    setProfile(d.dealer);
                    setPhone(d.dealer.phone ?? '');
                    setAddress(d.dealer.address ?? '');
                }
            })
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    const handleContactSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactErr(''); setContactMsg('');
        if (!/^[6-9]\d{9}$/.test(phone)) { setContactErr('Enter a valid 10-digit Indian mobile number'); return; }
        if (!address.trim()) { setContactErr('Address cannot be empty'); return; }
        setContactSaving(true);
        try {
            const res = await fetch('/api/dealer/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, address: address.trim() }),
            });
            const data = await res.json();
            if (data.ok) {
                setContactMsg('✓ Profile updated successfully');
                setProfile(p => p ? { ...p, phone, address: address.trim() } : p);
            } else {
                setContactErr(data.error ?? 'Update failed');
            }
        } finally { setContactSaving(false); }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassErr(''); setPassMsg('');
        if (!currentPass) { setPassErr('Enter your current password'); return; }
        if (newPass.length < 8) { setPassErr('New password must be at least 8 characters'); return; }
        if (newPass !== confirmPass) { setPassErr('Passwords do not match'); return; }
        setPassSaving(true);
        try {
            const res = await fetch('/api/dealer/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
            });
            const data = await res.json();
            if (data.ok) {
                setPassMsg('✓ Password changed successfully');
                setCurrentPass(''); setNewPass(''); setConfirmPass('');
            } else {
                setPassErr(data.error ?? 'Failed to change password');
            }
        } finally { setPassSaving(false); }
    };

    if (loading) return (
        <div style={{ maxWidth: '720px' }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px', marginBottom: '1rem' }} />)}
        </div>
    );
    if (error || !profile) return <div style={{ color: '#DC2626', padding: '1rem' }}>{error || 'Failed to load profile'}</div>;

    return (
        <div style={{ maxWidth: '720px' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>My Profile</h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.84rem', marginTop: '0.25rem' }}>View and update your dealer account details.</p>
            </div>

            {/* ── Account Info (read-only) ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>👤 Account Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {[
                        { label: 'Full Name', val: profile.name },
                        { label: 'Email (Login ID)', val: profile.email },
                        { label: 'Coverage Radius', val: `${profile.coverageRadiusKm} km` },
                    ].map(({ label, val }) => (
                        <div key={label} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>{val}</div>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.875rem', margin: '0.875rem 0 0' }}>
                    ℹ️ Email, location, and coverage radius can only be changed by an administrator. Contact your GrapeMaster admin to update these.
                </p>
            </div>

            {/* ── Edit contact form ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>✏️ Update Contact Details</div>
                <form onSubmit={handleContactSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={IL}>Phone Number *</label>
                        <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                            maxLength={10} placeholder="10-digit mobile" style={II} />
                    </div>
                    <div>
                        <label style={IL}>Address *</label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)}
                            rows={3} style={{ ...II, resize: 'vertical' }} placeholder="Your store / depot address" />
                    </div>
                    {contactErr && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#DC2626', fontSize: '0.82rem' }}>⚠️ {contactErr}</div>}
                    {contactMsg && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#15803D', fontSize: '0.82rem' }}>{contactMsg}</div>}
                    <div>
                        <button type="submit" disabled={contactSaving} style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', background: '#8B5CF6', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: contactSaving ? 'wait' : 'pointer', opacity: contactSaving ? 0.75 : 1 }}>
                            {contactSaving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Change password form ── */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>🔑 Change Password</div>
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={IL}>Current Password *</label>
                        <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} style={II} placeholder="Your current password" />
                    </div>
                    <div>
                        <label style={IL}>New Password *</label>
                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={II} placeholder="Min 8 characters" />
                    </div>
                    <div>
                        <label style={IL}>Confirm New Password *</label>
                        <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={II} placeholder="Repeat new password" />
                    </div>
                    {passErr && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#DC2626', fontSize: '0.82rem' }}>⚠️ {passErr}</div>}
                    {passMsg && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#15803D', fontSize: '0.82rem', fontWeight: 600 }}>{passMsg}</div>}
                    <div>
                        <button type="submit" disabled={passSaving} style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: '8px', background: '#4B5563', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: passSaving ? 'wait' : 'pointer', opacity: passSaving ? 0.75 : 1 }}>
                            {passSaving ? 'Changing…' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
