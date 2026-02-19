'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from './CartDrawer';

// Inline SVG logo mark
function GrapeLogo({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bunch stem */}
            <path d="M20 4 C20 4 20 9 20 11" stroke="#2A7436" strokeWidth="2" strokeLinecap="round" />
            {/* Leaf */}
            <path d="M20 8 C22 5 28 5 28 8 C28 12 22 13 20 11 C18 13 12 12 12 8 C12 5 18 5 20 8Z" fill="#52B061" opacity="0.85" />
            {/* Grape cluster */}
            <circle cx="15" cy="17" r="4.5" fill="#8C2458" />
            <circle cx="25" cy="17" r="4.5" fill="#8C2458" />
            <circle cx="20" cy="14" r="4.5" fill="#A83070" />
            <circle cx="12" cy="24" r="4" fill="#8C2458" />
            <circle cx="20" cy="24" r="4.5" fill="#6B1A46" />
            <circle cx="28" cy="24" r="4" fill="#8C2458" />
            <circle cx="16" cy="31" r="3.5" fill="#A83070" />
            <circle cx="24" cy="31" r="3.5" fill="#A83070" />
            <circle cx="20" cy="36" r="3" fill="#8C2458" />
        </svg>
    );
}

export default function Navbar() {
    const { totalItems, openCart, isOpen } = useCartStore();
    const count = totalItems();

    return (
        <>
            <nav className="navbar">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

                        {/* ── Logo ── */}
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
                            <GrapeLogo size={38} />
                            <div style={{ lineHeight: 1 }}>
                                <div style={{
                                    fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.03em',
                                    color: 'var(--gray-900)',
                                }}>
                                    Grape<span style={{ color: 'var(--leaf-600)' }}>Master</span>
                                </div>
                                <div style={{
                                    fontSize: '0.62rem', fontWeight: 600, color: 'var(--gray-400)',
                                    letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px',
                                }}>
                                    Agri Supplies
                                </div>
                            </div>
                        </Link>

                        {/* ── Nav Links ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>

                            <Link href="/products" className="btn btn-ghost" style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Products
                            </Link>

                            {/* Cart Button */}
                            <button
                                id="cart-btn"
                                onClick={openCart}
                                style={{
                                    position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.55rem 1rem', marginLeft: '0.5rem',
                                    border: count > 0 ? '1.5px solid var(--leaf-500)' : '1.5px solid var(--gray-200)',
                                    borderRadius: '10px', background: count > 0 ? 'var(--leaf-50)' : 'var(--white)',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
                                    color: count > 0 ? 'var(--leaf-700)' : 'var(--gray-700)',
                                    transition: 'all 0.15s', boxShadow: 'var(--shadow-xs)',
                                }}
                            >
                                {/* Cart icon */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <span>Cart</span>

                                {count > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-7px', right: '-7px',
                                        background: 'var(--grape-600)', color: 'white',
                                        borderRadius: '50%', minWidth: '20px', height: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.68rem', fontWeight: 800, border: '2px solid white',
                                        animation: 'bounceIn 0.3s ease',
                                    }}>
                                        {count > 9 ? '9+' : count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {isOpen && <CartDrawer />}
        </>
    );
}
