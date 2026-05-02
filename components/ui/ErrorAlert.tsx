'use client';

interface ErrorAlertProps {
    message: string;
    title?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export default function ErrorAlert({ message, title = 'Something went wrong', onRetry, onDismiss }: ErrorAlertProps) {
    return (
        <div role="alert" style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            gap: '0.875rem',
            alignItems: 'flex-start',
            animation: 'fadeUp 0.25s ease',
        }}>
            {/* Icon */}
            <div style={{
                width: '36px', height: '36px', flexShrink: 0,
                borderRadius: '50%', background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
            }}>
                ⚠️
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {title}
                </div>
                <div style={{ color: '#DC2626', fontSize: '0.84rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {message}
                </div>

                {(onRetry || onDismiss) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        {onRetry && (
                            <button onClick={onRetry} style={{
                                padding: '0.4rem 0.875rem', border: 'none', borderRadius: '8px',
                                background: '#DC2626', color: 'white',
                                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                transition: 'opacity 0.15s',
                            }}>
                                🔄 Try Again
                            </button>
                        )}
                        {onDismiss && (
                            <button onClick={onDismiss} style={{
                                padding: '0.4rem 0.875rem', border: '1px solid #FECACA', borderRadius: '8px',
                                background: 'white', color: '#991B1B',
                                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                transition: 'opacity 0.15s',
                            }}>
                                Dismiss
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Dismiss X (always visible if callback provided) */}
            {onDismiss && (
                <button onClick={onDismiss} aria-label="Dismiss error" style={{
                    background: 'none', border: 'none', color: '#F87171',
                    cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                    padding: '0.1rem', flexShrink: 0,
                }}>
                    ✕
                </button>
            )}
        </div>
    );
}
