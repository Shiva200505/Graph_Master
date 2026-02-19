export interface Location {
    lat: number;
    lng: number;
}

export interface User {
    id: string;
    phone: string;
    name?: string;
    email?: string;
}

export interface Dealer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    location: Location;
    coverageRadiusKm: number;
    distance?: number;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    category?: string;
    unit?: string;
    basePrice: number;
    imageUrl?: string;
    stock?: number;
    price?: number;
}

export interface CartItem {
    productId: string;
    productName: string;
    unit?: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
}

export interface OrderCreate {
    customer: {
        name: string;
        phone: string;
        address: string;
        location: Location;
    };
    dealerId: string;
    fulfillmentType: 'pickup' | 'delivery';
    items: Array<{
        productId: string;
        quantity: number;
    }>;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    dealerId: string;
    dealerName?: string;
    deliveryAddress: string;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryDistanceKm?: number;
    deliveryCharge: number;
    subtotal: number;
    total: number;
    status: string;
    paymentStatus?: string;
    items: CartItem[];
    createdAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    details?: any;
}
