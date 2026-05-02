'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'phone' | 'otp';

export default function CustomerLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') ?? '/account';
    const reason = searchParams.get('reason');

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    const sendOtp = async () => {
        if (!phone.match(/^[6-9]\d{9}$/)) { setError('Enter a valid 10-digit mobile number'); return; }
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setStep('otp');
            setCountdown(30);
        } catch { setError('Failed to send OTP. Try again.'); }
        finally { setLoading(false); }
    };

    const verifyOtp = async () => {
        const otpStr = otp.join('');
        if (otpStr.length !== 6) { setError('Enter all 6 digits'); return; }
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: otpStr }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            router.push(next);
            router.refresh();
        } catch { setError('Verification failed. Try again.'); }
        finally { setLoading(false); }
    };

    const handleOtpInput = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const n = [...otp]; n[i] = val.slice(-1); setOtp(n);
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
    };

    const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A4D25 0%, #2A7436 50%, #1a3a6e 100%)' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 1rem' }}>
                <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍇</div>
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.04em' }}>
                            Grape<span style={{ color: '#2A7436' }}>Master</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.25rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {step === 'phone' ? 'Sign In with OTP' : `OTP sent to +91 ${phone}`}
                        </div>
                    </div>

                    {reason === 'session_expired' && (
                        <div style={{ 
                            background: '#FEF3C7', border: '1px solid rgba(217,119,6,0.2)', 
                            borderRadius: '10px', padding: '0.625rem 0.875rem',
                            marginBottom: '1.25rem', fontSize: '0.82rem', color: '#92400E',
                            display: 'flex', gap: '0.4rem', alignItems: 'center'
                        }}>
                            ⏱️ Your session expired. Please log in again.
                        </div>
                    )}

                    {step === 'phone' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="input-label">Mobile Number</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.9rem', pointerEvents: 'none' }}>+91</span>
                                    <input className="input" type="tel" maxLength={10} placeholder="98765 43210" value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                                        style={{ paddingLeft: '3rem' }} autoFocus />
                                </div>
                            </div>
                            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.875rem', color: '#DC2626', fontSize: '0.85rem' }}>⚠️ {error}</div>}
                            <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, #1A4D25, #2A7436)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
                                {loading ? 'Sending OTP...' : 'Get OTP →'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'center', margin: 0 }}>Enter the 6-digit OTP</p>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                {otp.map((digit, i) => (
                                    <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="tel" maxLength={1} value={digit}
                                        onChange={(e) => handleOtpInput(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKey(i, e)}
                                        style={{ width: '48px', height: '56px', textAlign: 'center', fontWeight: 800, fontSize: '1.3rem', border: `2px solid ${digit ? '#2A7436' : 'var(--gray-200)'}`, borderRadius: '10px', outline: 'none', color: '#0C2410', background: digit ? '#f0fdf4' : 'white', transition: 'all 0.1s' }} />
                                ))}
                            </div>
                            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem', color: '#DC2626', fontSize: '0.85rem', textAlign: 'center' }}>⚠️ {error}</div>}
                            <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, #1A4D25, #2A7436)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
                                {loading ? 'Verifying...' : 'Verify OTP ✓'}
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                {countdown > 0
                                    ? <span style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>Resend in {countdown}s</span>
                                    : <button onClick={() => { setOtp(['', '', '', '', '', '']); sendOtp(); }} style={{ background: 'none', border: 'none', color: 'var(--leaf-600)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Resend OTP</button>}
                            </div>
                            <button onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '0.8rem', cursor: 'pointer' }}>← Change number</button>
                        </div>
                    )}
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <a href="/" style={{ fontSize: '0.8rem', color: 'var(--gray-400)', textDecoration: 'none' }}>← Back to Storefront</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
