'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // In production this would call an error reporting service (e.g. Sentry)
        console.error('[GrapeMaster Error Boundary]', error);
    }, [error]);

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                maxWidth: '560px', width: '100%',
                background: 'white', border: '1px solid var(--gray-200)',
                borderRadius: '16px', boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden', animation: 'fadeUp 0.4s ease',
            }}>
                {/* Red header strip */}
                <div style={{ height: '5px', background: 'linear-gradient(to right, #DC2626, #EF4444)' }} />

                <div style={{ padding: '2rem 2rem 1.75rem' }}>
                    {/* Warning icon */}
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: '#FEF2F2', border: '2px solid #FECACA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', fontSize: '1.75rem',
                    }}>
                        ⚠️
                    </div>

                    <h1 style={{
                        fontSize: '1.4rem', fontWeight: 900, color: 'var(--gray-900)',
                        letterSpacing: '-0.03em', textAlign: 'center', marginBottom: '0.5rem',
                    }}>
                        Something Went Wrong
                    </h1>
                    <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        An unexpected error occurred. Our team has been notified.
                        {error.digest && (
                            <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--gray-400)', fontSize: '0.72rem' }}>
                                Error ID: {error.digest}
                            </span>
                        )}
                    </p>

                    {/* Error message in code block */}
                    {error.message && (
                        <div style={{
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: '8px', padding: '0.875rem 1rem',
                            marginBottom: '1.5rem',
                        }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                                Error Detail
                            </div>
                            <code style={{
                                display: 'block', fontSize: '0.8rem', color: '#DC2626',
                                lineHeight: 1.6, fontFamily: 'ui-monospace, monospace',
                                wordBreak: 'break-word',
                            }}>
                                {error.message}
                            </code>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={reset}
                            style={{
                                flex: 1, minWidth: '120px', padding: '0.7rem 1.25rem',
                                border: 'none', borderRadius: '10px',
                                background: 'var(--leaf-600)', color: 'white',
                                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                transition: 'all 0.15s',
                            }}
                        >
                            🔄 Try Again
                        </button>
                        <Link href="/" style={{
                            flex: 1, minWidth: '120px', padding: '0.7rem 1.25rem',
                            border: '1px solid var(--gray-200)', borderRadius: '10px',
                            background: 'white', color: 'var(--gray-700)',
                            fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        }}>
                            🏠 Go Home
                        </Link>
                    </div>
                </div>

                <div style={{ padding: '0.875rem 2rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                        GrapeMaster · If the issue persists, please contact support.
                    </p>
                </div>
            </div>
        </div>
    );
}
