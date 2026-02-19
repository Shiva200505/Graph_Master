# Grape Master - Agricultural E-Commerce Platform

A production-ready, full-stack e-commerce platform that digitizes the agricultural input supply chain, connecting farmers with local dealers through intelligent location-based matching.

## 🚀 Features

- **Location-Based Shopping**: Automatic dealer assignment based on user location
- **Dealer-Specific Inventory**: Real-time stock management per dealer
- **Flexible Fulfillment**: Pickup or home delivery options with dynamic pricing
- **PhonePe Payment Integration**: Secure digital payments
- **ML Recommendations**: Intelligent product suggestions
- **Admin Dashboard**: Comprehensive analytics and management tools

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with PostGIS
- **ORM**: Prisma
- **Payment**: PhonePe Gateway
- **Maps**: Mapbox/Google Maps API
- **SMS**: Twilio/MSG91

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- PhonePe Merchant Account
- Mapbox/Google Maps API Key
- SMS Provider Account (Twilio/MSG91)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
cd grape-master
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL with PostGIS

```sql
-- Create database
CREATE DATABASE grapemaster;

-- Connect to database
\c grapemaster

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `PHONEPE_*`: PhonePe merchant credentials
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox API token
- SMS provider credentials
- `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 6. Seed Database (Optional)

```bash
npx prisma db seed
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
grape-master/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public-facing pages
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── product/          # Product-related components
│   ├── cart/             # Shopping cart
│   └── admin/            # Admin components
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Seed data
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 🗄️ Database Schema

The application uses PostgreSQL with PostGIS extension for spatial queries. Key tables:

- `users`: Customer information
- `dealers`: Dealer details with geolocation
- `products`: Product catalog
- `dealer_inventory`: Stock per dealer
- `orders`: Order master
- `order_items`: Order line items
- `payments`: Payment transactions
- `locations`: Predefined locations

See [database_schema.md](../../../.gemini/antigravity/brain/a6ce642a-68ee-4589-863e-abb25f0ff1cb/database_schema.md) for complete ERD.

## 🔌 API Documentation

See [api_specifications.md](../../../.gemini/antigravity/brain/a6ce642a-68ee-4589-863e-abb25f0ff1cb/api_specifications.md) for complete API documentation.

### Key Endpoints

- `GET /api/products?lat={lat}&lng={lng}` - Get products from nearest dealer
- `GET /api/dealers/nearest?lat={lat}&lng={lng}` - Find nearest dealer
- `POST /api/orders/create` - Create new order
- `POST /api/orders/{id}/payment/init` - Initialize payment
- `POST /api/ml/recommendations` - Get ML recommendations

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t grape-master .

# Run container
docker run -p 3000:3000 grape-master
```

## 📝 Development Workflow

### 1. Database Changes

```bash
# Create migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Open Prisma Studio

```bash
npx prisma studio
```

## 🔐 Security

- All API routes validate input using Zod schemas
- Payment data is PCI-DSS compliant
- HTTPS only in production
- Environment variables for sensitive data
- SQL injection prevention via Prisma ORM
- XSS protection through React escaping

## 📊 Performance

- Server-side rendering for SEO
- Image optimization with Next.js Image
- Database query optimization
- Redis caching (optional)
- CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@grapemaster.com or join our Discord community.

## 🙏 Acknowledgments

- PostGIS for spatial queries
- PhonePe for payment gateway
- Vercel for hosting
- The open-source community

---

Built with ❤️ for Indian farmers
