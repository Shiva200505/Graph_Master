import { z } from 'zod';

export const locationSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

export const customerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    phone: z.string().regex(/^(\+91|91)?[6-9]\d{9}$/, 'Invalid Indian phone number'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    location: locationSchema,
});

export const orderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
    customer: customerSchema,
    dealerId: z.string().uuid(),
    fulfillmentType: z.enum(['pickup', 'delivery']),
    items: z.array(orderItemSchema).min(1, 'At least one item required').max(50, 'Maximum 50 items allowed'),
});

export const updateInventorySchema = z.object({
    quantity: z.number().int().min(0),
    price: z.number().positive().optional(),
});

export const adminLoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
