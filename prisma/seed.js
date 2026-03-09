// Plain JS seed file - no TypeScript needed
// Run with: node prisma/seed.js

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');

// Prisma v7 requires a database adapter (pg adapter for Node.js)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── 1. Admin User ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@grapemaster.com' },
    update: {},
    create: {
      email: 'admin@grapemaster.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });
  console.log('✅ Admin created: admin@grapemaster.com / admin123');

  // ─── 2. Dealers (with PostGIS location + login password) ───────────────────
  const dealerPassword = await bcrypt.hash('dealer123', 10);
  await prisma.$executeRaw`
    INSERT INTO dealers (id, name, phone, email, password_hash, address, location, coverage_radius_km, is_active, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 'Shivaji Agro Center', '+919876543210', 'shivaji@agro.com', ${dealerPassword},
      'Main Road, Shirur, Pune, Maharashtra 412210',
      ST_SetSRID(ST_MakePoint(74.3789, 18.8324), 4326)::geography,
      15.0, true, NOW(), NOW()
    ) ON CONFLICT (email) DO UPDATE SET password_hash = ${dealerPassword}
  `;
  await prisma.$executeRaw`
    INSERT INTO dealers (id, name, phone, email, password_hash, address, location, coverage_radius_km, is_active, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 'Krushna Seeds & Fertilizers', '+919876543211', 'krushna@seeds.com', ${dealerPassword},
      'Pune-Nagar Road, Pune, Maharashtra 411014',
      ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326)::geography,
      20.0, true, NOW(), NOW()
    ) ON CONFLICT (email) DO UPDATE SET password_hash = ${dealerPassword}
  `;
  await prisma.$executeRaw`
    INSERT INTO dealers (id, name, phone, email, password_hash, address, location, coverage_radius_km, is_active, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 'Nashik Agri Supplies', '+919876543212', 'nashik@agri.com', ${dealerPassword},
      'CBS Road, Nashik, Maharashtra 422001',
      ST_SetSRID(ST_MakePoint(73.7898, 19.9975), 4326)::geography,
      25.0, true, NOW(), NOW()
    ) ON CONFLICT (email) DO UPDATE SET password_hash = ${dealerPassword}
  `;
  console.log('✅ Dealers created/updated with passwords (dealer123)');

  // ─── 3. Products ───────────────────────────────────────────────────────────
  const productData = [
    { name: 'NPK Fertilizer (19:19:19)', description: '50kg bag of premium NPK fertilizer', category: 'Fertilizer', unit: 'bag', basePrice: 800 },
    { name: 'Urea Fertilizer', description: '50kg bag of high-quality urea', category: 'Fertilizer', unit: 'bag', basePrice: 600 },
    { name: 'DAP Fertilizer', description: '50kg bag of Di-Ammonium Phosphate', category: 'Fertilizer', unit: 'bag', basePrice: 1350 },
    { name: 'Hybrid Tomato Seeds (F1)', description: '100g packet of F1 hybrid tomato seeds', category: 'Seeds', unit: 'packet', basePrice: 250 },
    { name: 'Hybrid Onion Seeds', description: '500g packet of premium hybrid onion seeds', category: 'Seeds', unit: 'packet', basePrice: 350 },
    { name: 'Pesticide Spray (Chlorpyrifos)', description: '1 liter pesticide for crop protection', category: 'Pesticide', unit: 'liter', basePrice: 450 },
    { name: 'Fungicide (Mancozeb)', description: '500g packet of Mancozeb fungicide', category: 'Pesticide', unit: 'packet', basePrice: 280 },
    { name: 'Organic Manure', description: '25kg bag of organic manure', category: 'Fertilizer', unit: 'bag', basePrice: 300 },
    { name: 'Drip Irrigation Kit', description: 'Complete drip irrigation kit for 1 acre', category: 'Equipment', unit: 'kit', basePrice: 4500 },
    { name: 'Sprayer Pump (16L)', description: '16 liter manual knapsack sprayer pump', category: 'Equipment', unit: 'piece', basePrice: 850 },
  ];

  const createdProducts = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: { name: p.name, description: p.description, category: p.category, unit: p.unit, basePrice: p.basePrice, isActive: true },
    });
    createdProducts.push(product);
  }
  console.log(`✅ Products created: ${createdProducts.length}`);

  // ─── 4. Dealer Inventory ───────────────────────────────────────────────────
  const dealers = await prisma.dealer.findMany();
  for (const dealer of dealers) {
    for (const product of createdProducts) {
      const qty = Math.floor(Math.random() * 80) + 20;
      const priceAdd = Math.floor(Math.random() * 50);
      await prisma.dealerInventory.create({
        data: {
          dealerId: dealer.id,
          productId: product.id,
          quantity: qty,
          price: Number(product.basePrice) + priceAdd,
        },
      });
    }
  }
  console.log('✅ Inventory seeded for all dealers');

  // ─── 5. Locations ──────────────────────────────────────────────────────────
  const locations = [
    { name: 'Shirur', district: 'Pune', state: 'Maharashtra', lng: 74.3789, lat: 18.8324 },
    { name: 'Pune', district: 'Pune', state: 'Maharashtra', lng: 73.8567, lat: 18.5204 },
    { name: 'Nashik', district: 'Nashik', state: 'Maharashtra', lng: 73.7898, lat: 19.9975 },
    { name: 'Ahmednagar', district: 'Ahmednagar', state: 'Maharashtra', lng: 74.748, lat: 19.0948 },
    { name: 'Solapur', district: 'Solapur', state: 'Maharashtra', lng: 75.9064, lat: 17.6599 },
    { name: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', lng: 74.2433, lat: 16.705 },
    { name: 'Satara', district: 'Satara', state: 'Maharashtra', lng: 74.0183, lat: 17.6805 },
    { name: 'Sangli', district: 'Sangli', state: 'Maharashtra', lng: 74.5815, lat: 16.8524 },
  ];
  for (const loc of locations) {
    await prisma.$executeRaw`
      INSERT INTO locations (id, name, district, state, location, created_at)
      VALUES (gen_random_uuid(), ${loc.name}, ${loc.district}, ${loc.state},
        ST_SetSRID(ST_MakePoint(${loc.lng}, ${loc.lat}), 4326)::geography, NOW())
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`✅ Locations seeded: ${locations.length}`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('─────────────────────────────────');
  console.log('Admin Login:');
  console.log('  Email:    admin@grapemaster.com');
  console.log('  Password: admin123');
  console.log('─────────────────────────────────');
  console.log('Dealer Logins (password: dealer123):');
  console.log('  shivaji@agro.com');
  console.log('  krushna@seeds.com');
  console.log('  nashik@agri.com');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
