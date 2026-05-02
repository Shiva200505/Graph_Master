import React from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.25rem', fontSize: '0.82rem',
            color: 'var(--gray-400)', flexWrap: 'wrap'
        }}>
            {items.map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i > 0 && <span>›</span>}
                    {item.href
                        ? <a href={item.href} style={{ color: 'var(--leaf-600)', fontWeight: 600, textDecoration: 'none' }}>{item.label}</a>
                        : <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{item.label}</span>
                    }
                </span>
            ))}
        </div>
    );
}
