import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    unit: string;
    price: number;
    quantity: number;
    maxQuantity: number;
    inventoryId: string;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    fulfillmentType: 'pickup' | 'delivery';
    dealerId: string | null;
    dealerName: string | null;

    openCart: () => void;
    closeCart: () => void;
    setFulfillmentType: (type: 'pickup' | 'delivery') => void;
    setDealer: (id: string, name: string) => void;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;

    // computed
    totalItems: () => number;
    subtotal: () => number;
    deliveryCharge: () => number;
    total: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            fulfillmentType: 'pickup',
            dealerId: null,
            dealerName: null,

            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            setFulfillmentType: (type) => set({ fulfillmentType: type }),
            setDealer: (id, name) => set({ dealerId: id, dealerName: name }),

            addItem: (item) => {
                const existing = get().items.find((i) => i.productId === item.productId);
                if (existing) {
                    set({
                        items: get().items.map((i) =>
                            i.productId === item.productId
                                ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQuantity) }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...get().items, { ...item, quantity: 1 }] });
                }
            },

            removeItem: (productId) =>
                set({ items: get().items.filter((i) => i.productId !== productId) }),

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((i) =>
                        i.productId === productId
                            ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
                            : i
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            subtotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

            deliveryCharge: () => {
                if (get().fulfillmentType === 'pickup') return 0;
                const sub = get().subtotal();
                return sub >= 2000 ? 0 : 50;
            },

            total: () => get().subtotal() + get().deliveryCharge(),
        }),
        { name: 'grape-master-cart', partialize: (s) => ({ items: s.items, dealerId: s.dealerId, dealerName: s.dealerName }) }
    )
);
