# 🌿 GrapeMaster — Agri-Input E-Commerce Platform

A production-ready, full-stack e-commerce platform digitizing India's agricultural input supply chain. GrapeMaster connects Maharashtra farmers with their nearest verified local dealers for fertilizers, seeds, pesticides, and equipment — with real-time inventory, smart location matching, and doorstep delivery.

> **Built for Indian farmers** — Kharif, Rabi, and everything in between.

---

## ✨ Features

### 🛒 Customer-Facing
- **GPS & Manual Location Selection** — Auto-detect via browser GPS or pick from 8 Maharashtra districts (Pune, Nashik, Shirur, Ahmednagar, Solapur, Satara, Kolhapur, Sangli)
- **Nearest-Dealer Matching** — PostGIS spatial queries assign the closest active dealer instantly
- **Real-Time Inventory** — Per-dealer stock and pricing, live on every product card
- **Category Browsing** — Fertilizers, Seeds, Pesticides, Equipment
- **Flexible Fulfillment** — Store pickup or farm-gate home delivery with dynamic delivery-charge calculation
- **OTP Authentication** — Phone-number login via MSG91 SMS (no passwords for customers)
- **Razorpay Payments** — Secure online payment with webhook-based status verification
- **Order Tracking** — Full order lifecycle from `pending` → `confirmed` → `dispatched` → `delivered`
- **WhatsApp Notifications** — Automated order confirmations via Meta Cloud API

### 🧠 ML Recommendation Engine (100% in-database, no external service)
Five cascading recommendation strategies, applied in priority order:
1. **Collaborative Filtering** — "Farmers with similar purchase history also bought…"
2. **Location-Based Popularity** — Trending products within 50 km radius (last 90 days)
3. **Frequently Bought Together** — Market-basket analysis via `product_associations` table
4. **Session Interest Signals** — Cart-add and view events from anonymous sessions
5. **Season-Weighted Fallback** — Boosts categories by Indian agricultural calendar (Kharif/Rabi/Summer)

### 🏪 Dealer Portal
- Dedicated login and dashboard (`/dealer`)
- Order management (view, accept, update status)
- Inventory management (per-product stock and price)
- Profile management and product-request submission to admin

### 🛡️ Admin Dashboard (`/admin`)
- Platform-wide analytics and stats
- Dealer management (create, activate/deactivate)
- Product catalog management
- Inventory oversight across all dealers
- Order management and payment status tracking
- ML recompute trigger
- Product-request approval workflow
- Dev notification viewer (WhatsApp/email mock preview)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4, Vanilla CSS |
| **State Management** | Zustand v5 (`cartStore`, `locationStore`) |
| **Forms** | React Hook Form + Zod v4 validation |
| **Charts** | Recharts (admin analytics) |
| **Database** | PostgreSQL 16 + PostGIS 3.4 |
| **ORM** | Prisma v7 (`@prisma/adapter-pg`) |
| **Authentication** | Custom JWT (`jose`) + HTTP-only cookies |
| **Payment** | Razorpay |
| **Notifications** | WhatsApp Business Cloud API + Resend (email) + MSG91 (SMS/OTP) |
| **Deployment** | Vercel (recommended) / Docker |
| **DB Hosting** | Supabase (PostgreSQL + pgbouncer) |

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ with **PostGIS** extension enabled  
  *(or a Supabase project — PostGIS is pre-installed)*
- **Razorpay** merchant account (test keys work fine)
- **MSG91** account for SMS OTP delivery
- *(Optional)* Meta WhatsApp Business API credentials
- *(Optional)* Resend.com API key for admin email alerts
- *(Optional)* Mapbox token for dealer map view

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd grape-master
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values — see the [Environment Variables](#-environment-variables) section below for a full reference.

### 3. Set Up PostgreSQL with PostGIS

```sql
-- Create database
CREATE DATABASE grapemaster;

-- Connect and enable PostGIS
\c grapemaster
CREATE EXTENSION IF NOT EXISTS postgis;
```

> **Using Supabase?** PostGIS is already enabled. Just copy your connection strings from the Supabase dashboard.

### 4. Generate Prisma Client & Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed the Database (Optional)

```bash
npx prisma db seed
```

This populates dealers, products, and inventory data for Maharashtra.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — select a location to get started.

---

## 🔑 Environment Variables

Copy `.env.example` → `.env` and fill in the values below.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (with `?pgbouncer=true` for Supabase pooler) |
| `DIRECT_URL` | Supabase only | Direct (non-pooled) connection for Prisma migrations |
| `JWT_SECRET` | ✅ | Strong random secret ≥ 32 chars — `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL, e.g. `https://yourapp.vercel.app` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret key |
| `MSG91_AUTHKEY` | ✅ prod | MSG91 auth key for OTP SMS; dev falls back to console log |
| `MSG91_TEMPLATE_ID` | ✅ prod | MSG91 approved OTP template ID |
| `WHATSAPP_TOKEN` | Optional | Meta Cloud API Bearer token |
| `WHATSAPP_PHONE_ID` | Optional | WhatsApp sender phone number ID |
| `WHATSAPP_TEMPLATE` | Optional | Approved template name (default: `order_confirmation`) |
| `RESEND_API_KEY` | Optional | Resend.com API key for admin order email alerts |
| `ADMIN_EMAIL` | Optional | Recipient for admin order alert emails |
| `CRON_SECRET` | Optional | Secret to protect the ML `/api/admin/ml` recompute endpoint |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional | Mapbox token for dealer map UI |
| `NODE_ENV` | Auto | `development` \| `production` |

> **Development note:** If `MSG91_AUTHKEY`, `WHATSAPP_TOKEN`, or `RESEND_API_KEY` are empty, the app falls back to console logging — no external calls are made.

---

## 📁 Project Structure

```
grape-master/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (location selector, categories, recommendations)
│   ├── layout.tsx                # Root layout + global CSS
│   ├── globals.css               # Design system tokens, utility classes
│   ├── products/                 # Product listing & detail pages
│   ├── checkout/                 # Checkout flow
│   ├── payment/                  # Razorpay payment page
│   ├── order/                    # Order confirmation
│   ├── login/                    # Customer OTP login
│   ├── account/                  # Customer account & order history
│   ├── dealer/                   # Dealer portal (auth-guarded)
│   │   ├── page.tsx              # Dealer dashboard
│   │   ├── orders/               # Order management
│   │   ├── products/             # Inventory management
│   │   └── profile/              # Dealer profile
│   ├── admin/                    # Admin dashboard (auth-guarded)
│   │   ├── page.tsx              # Admin overview & stats
│   │   ├── dealers/              # Dealer management
│   │   ├── products/             # Product catalog management
│   │   ├── inventory/            # Cross-dealer inventory view
│   │   ├── orders/               # All orders management
│   │   ├── payments/             # Payment records
│   │   ├── analytics/            # Charts & analytics
│   │   └── ml/                   # ML recompute trigger
│   └── api/                      # API Routes (Next.js Route Handlers)
│       ├── auth/
│       │   ├── send-otp/         # POST — generate & send OTP via MSG91
│       │   ├── verify-otp/       # POST — verify OTP, issue JWT cookie
│       │   ├── logout/           # POST — clear session cookie
│       │   ├── me/               # GET — current user from JWT
│       │   ├── admin/            # POST — admin email/password login
│       │   └── dealer/           # POST — dealer login
│       ├── dealers/
│       │   ├── nearest/          # GET — find nearest dealer by lat/lng (PostGIS)
│       │   └── [id]/status/      # PATCH — toggle dealer active status
│       ├── products/             # GET — products (with dealer inventory filter)
│       ├── orders/               # POST create, GET list, PATCH status
│       ├── payments/
│       │   ├── initiate/         # POST — create Razorpay order
│       │   ├── callback/         # POST — Razorpay webhook / callback
│       │   └── status/           # GET — poll payment status
│       ├── recommendations/
│       │   ├── route.ts          # GET — 5-strategy ML recommendations
│       │   └── events/           # POST — track view/cart_add events
│       ├── delivery-charge/      # GET — calculate delivery fee by distance
│       ├── admin/                # Admin-only CRUD endpoints (dealers, products, ML)
│       ├── dealer/               # Dealer-specific endpoints (inventory, orders, requests)
│       ├── account/              # Customer order history
│       └── health/               # GET — health check (used by Docker/Vercel)
├── components/
│   ├── ui/                       # Shared UI components (ProductRecommendations, etc.)
│   ├── admin/                    # AdminSidebar, StatCard, StatusBadge
│   └── dealer/                   # DealerSidebar
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # JWT sign/verify helpers
│   ├── notify.ts                 # WhatsApp + Resend email notification utilities
│   ├── otp.ts                    # OTP generation & MSG91 delivery
│   ├── razorpay.ts               # Razorpay client initializer
│   ├── haversine.ts              # Distance calculation utility
│   ├── trackEvent.ts             # Recommendation event tracker
│   ├── validations.ts            # Zod schemas
│   └── utils.ts                  # Shared helpers (formatCurrency, cn, etc.)
├── store/
│   ├── cartStore.ts              # Zustand cart state (items, dealer, totals)
│   └── locationStore.ts          # Zustand location state (lat, lng, nearestDealer)
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── prisma/
│   ├── schema.prisma             # Database schema (see below)
│   ├── seed.ts / seed.js         # Seed script with dealers, products, inventory
│   └── migrations/               # Prisma migration history
├── middleware.ts                 # JWT auth guards + in-memory rate limiter
├── Dockerfile                    # Multi-stage Docker build (node:20-alpine)
├── docker-compose.yml            # App + PostgreSQL/PostGIS containers
├── next.config.ts                # Next.js config
└── .env.example                  # Environment variable reference
```

---

## 🗄️ Database Schema

PostgreSQL 16 + PostGIS. Spatial columns use the `geography` type (EPSG:4326) for accurate distance calculations in metres.

| Model | Table | Key Fields |
|---|---|---|
| `User` | `users` | `phone` (unique), `otp`, `otpExpiry`, `isVerified` |
| `Dealer` | `dealers` | `location` (geography), `coverageRadiusKm`, `isActive`, `passwordHash` |
| `Product` | `products` | `name`, `category`, `basePrice`, `imageUrl`, `isActive` |
| `DealerInventory` | `dealer_inventory` | `dealerId`, `productId`, `quantity`, `price` (per-dealer override) |
| `Order` | `orders` | `orderNumber`, `userId`, `dealerId`, `fulfillmentType`, `status`, `total` |
| `OrderItem` | `order_items` | `orderId`, `productId`, `unitPrice`, `quantity`, `subtotal` |
| `Payment` | `payments` | `orderId`, `transactionId`, `merchantTransactionId`, `amount`, `status` |
| `Location` | `locations` | `name`, `district`, `state`, `location` (geography) |
| `Admin` | `admins` | `email`, `password`, `role`, `isActive` |
| `RecommendationEvent` | `recommendation_events` | `eventType` (view/cart_add/purchase), `userId`, `sessionId`, `productId` |
| `ProductAssociation` | `product_associations` | `productA`, `productB`, `coOccurrenceCount`, `confidence`, `lift` |
| `ProductRequest` | `product_requests` | `dealerId`, `productName`, `status`, `adminNote` |

**Indexes:** GiST index on `dealers.location` and `locations.location` for fast spatial lookups.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send OTP to phone (rate-limited: 5/10min) |
| `POST` | `/api/auth/verify-otp` | Verify OTP, issue `gm_session` JWT cookie (rate-limited: 10/10min) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current session user |
| `POST` | `/api/auth/admin/login` | Admin email+password login (rate-limited: 10/5min) |
| `POST` | `/api/auth/dealer` | Dealer email+password login |

### Products & Dealers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products?dealerId=&category=` | List products with dealer inventory |
| `GET` | `/api/dealers/nearest?lat=&lng=` | Find nearest active dealer via PostGIS |
| `PATCH` | `/api/dealers/[id]/status` | Toggle dealer active/inactive (admin) |
| `GET` | `/api/delivery-charge?lat=&lng=&dealerId=` | Calculate delivery fee by Haversine distance |

### Orders & Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Create new order |
| `GET` | `/api/orders?userId=` | List orders for a user |
| `PATCH` | `/api/orders/[id]` | Update order status |
| `POST` | `/api/payments/initiate` | Create Razorpay order, returns `orderId` and `amount` |
| `POST` | `/api/payments/callback` | Razorpay webhook — verifies signature, updates payment status |
| `GET` | `/api/payments/status?orderId=` | Poll payment + order status |

### Recommendations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommendations?lat=&lng=&userId=&sessionId=&limit=` | Get personalized product recommendations |
| `POST` | `/api/recommendations/events` | Track a user event (view, cart_add, purchase) |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (used by Docker HEALTHCHECK and Vercel) |

---

## 🔐 Security

- **JWT Authentication** — signed with `jose`, stored in HTTP-only `gm_session` cookie
- **Role-based Route Guards** — middleware enforces `admin` / `dealer` / `customer` roles before serving protected routes
- **In-memory Rate Limiting** — applied to OTP and login endpoints (replace with Redis/Upstash for multi-instance)
- **Zod Validation** — all API inputs validated with Zod schemas before DB access
- **Prisma ORM** — parameterized queries prevent SQL injection
- **bcryptjs** — dealer/admin passwords hashed at rest
- **Razorpay Signature Verification** — webhook payloads verified with HMAC-SHA256 before processing
- **Non-root Docker user** — container runs as `nextjs` user (UID 1001)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub and import the project into Vercel.
2. Add all environment variables from `.env.example` in the Vercel dashboard.
3. Set **Database** to your Supabase PostgreSQL instance.
4. Deploy — Vercel runs `next build` automatically.

```bash
# Or use the CLI
npm i -g vercel
vercel --prod
```

> **Prisma on Vercel:** The `prisma generate` step runs automatically during `next build` via the Prisma postinstall hook. Ensure `DIRECT_URL` is set for migration commands.

### Docker (Self-Hosted)

```bash
# Build image
docker build -t grapemaster .

# Run with env file
docker run -p 3000:3000 --env-file .env grapemaster
```

### Docker Compose (App + Postgres)

```bash
# Copy env file first
cp .env.example .env

# Start all services
docker compose up --build
```

This spins up:
- `grapemaster-app` — Next.js app on port `3000`
- `grapemaster-db` — PostGIS 16 on port `5432` with persistent volume

---

## 🛠️ Development Workflow

```bash
# Run dev server
npm run dev

# Lint
npm run lint

# Create a new migration
npx prisma migrate dev --name <description>

# Reset database (drops all data)
npx prisma migrate reset

# Regenerate Prisma Client (after schema changes)
npx prisma generate

# Open Prisma Studio (visual DB editor)
npx prisma studio

# Re-seed the database
npx prisma db seed
```

---

## 📊 Performance Notes

- **PostGIS GiST indexes** on geography columns for O(log n) spatial lookups
- **Recommendation caching** — `Cache-Control: public, max-age=300, stale-while-revalidate=60`
- **Server-Side Rendering** via Next.js App Router for SEO-critical pages
- **Zustand** for lightweight client-side cart and location state (no Redux overhead)
- **Prisma connection pooling** via `@prisma/adapter-pg` + pgbouncer (Supabase)
- **Rate limiter memory pruning** — stale entries auto-purged every 5 minutes

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [PostGIS](https://postgis.net/) — spatial database extension powering dealer matching
- [Razorpay](https://razorpay.com/) — payment gateway
- [Supabase](https://supabase.com/) — managed PostgreSQL hosting
- [Vercel](https://vercel.com/) — deployment platform
- [Prisma](https://www.prisma.io/) — type-safe ORM
- [MSG91](https://msg91.com/) — SMS OTP delivery
- [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/) — order notifications
- [Resend](https://resend.com/) — transactional email

---

*Built with ❤️ for Indian farmers — Maharashtra's Agri Supply Platform*
