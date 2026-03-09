interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: string;
    sublabel?: string;
    trend?: { value: number; label: string };
}

export default function StatCard({ label, value, icon, color = '#2A7436', sublabel, trend }: StatCardProps) {
    return (
        <div style={{
            background: 'white', border: '1px solid var(--gray-200)',
            borderRadius: '14px', padding: '1.25rem 1.375rem',
            boxShadow: 'var(--shadow-xs)',
            borderTop: `3px solid ${color}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
            </div>
            {sublabel && <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.35rem' }}>{sublabel}</div>}
            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trend.value >= 0 ? '#16a34a' : '#dc2626' }}>
                        {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{trend.label}</span>
                </div>
            )}
        </div>
    );
}
