export default function GlobalLoading() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--cream)',
            gap: '1.25rem',
        }}>
            {/* Pulsing logo */}
            <div style={{
                fontSize: '3rem', lineHeight: 1,
                animation: 'pulse 1.8s ease-in-out infinite',
            }}>
                🍇
            </div>

            {/* Spinner */}
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid var(--gray-200)',
                borderTop: '3px solid var(--leaf-500)',
                borderRadius: '50%',
                animation: 'spin 0.85s linear infinite',
            }} />

            <p style={{
                fontSize: '0.88rem', color: 'var(--gray-400)',
                fontWeight: 600, letterSpacing: '0.03em',
            }}>
                Loading GrapeMaster…
            </p>
        </div>
    );
}
