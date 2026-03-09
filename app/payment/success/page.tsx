'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const txnId = searchParams.get('txnId');

    const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [tries, setTries] = useState(0);

    useEffect(() => {
        if (!txnId) { setStatus('failed'); return; }

        const poll = async () => {
            try {
                const res = await fetch(`/api/payments/status/${txnId}`);
                const data = await res.json();
                if (data.status === 'success') {
                    setStatus('success');
                    setOrderId(data.order?.id ?? null);
                    setOrderNumber(data.order?.orderNumber ?? null);
                } else if (data.status === 'failed') {
                    setStatus('failed');
                } else {
                    // Still pending — retry up to 6 times (30 seconds)
                    setTries((t) => t + 1);
                    if (tries < 6) {
                        setTimeout(poll, 5000);
                    } else {
                        setStatus('pending');
                    }
                }
            } catch {
                setStatus('failed');
            }
        };

        poll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [txnId]);

    if (status === 'checking') {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ width: '64px', height: '64px', border: '4px solid var(--leaf-200)', borderTop: '4px solid var(--leaf-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }} />
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Confirming Payment…</h2>
                <p style={{ color: 'var(--gray-500)' }}>Please wait while we verify your payment with PhonePe.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--leaf-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem', animation: 'bounceIn 0.5s ease' }}>✅</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--leaf-700)', marginBottom: '0.5rem' }}>Payment Successful!</h1>
                <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Your order has been confirmed.</p>
                {orderNumber && (
                    <div style={{ background: 'var(--leaf-50)', border: '1px solid rgba(42,116,54,0.2)', borderRadius: '10px', padding: '1rem', margin: '1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--leaf-700)' }}>
                        Order #{orderNumber}
                    </div>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '2rem' }}>
                    📲 You'll receive a WhatsApp confirmation shortly.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {orderId && (
                        <button className="btn btn-primary" onClick={() => router.push(`/order/${orderId}`)}>
                            View Order Details
                        </button>
                    )}
                    <button className="btn btn-outline" onClick={() => router.push('/products')}>
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Payment Processing</h2>
                <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                    Your payment is being processed. Check your order status in a few minutes.
                </p>
                <button className="btn btn-primary" onClick={() => router.push('/account')}>
                    Check My Orders
                </button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontWeight: 800, color: '#DC2626', marginBottom: '0.5rem' }}>Payment Failed</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                Your payment could not be processed. No charges were made. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-harvest" onClick={() => router.back()}>
                    Try Again
                </button>
                <button className="btn btn-outline" onClick={() => router.push('/products')}>
                    Back to Products
                </button>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
            <Suspense fallback={<div style={{ textAlign: 'center' }}>Loading…</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
