# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Trading Card Game (TCG) grading service e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS. The application provides professional card grading services for Pokemon, Yu-Gi-Oh!, MTG, and other trading card games.

## Development Commands

```bash
# Start development server at port 3000
npx kill-port 3000  # Kill any existing process on port 3000
npm run dev         # Start Next.js development server

# Build and production
npm run build       # Build production bundle
npm start          # Start production server

# Code quality
npm run lint       # Run ESLint

# Database initialization
node scripts/init-user-database.js  # Initialize SQLite user database
node scripts/init-clean-database.js # Clean database initialization
```

## Architecture

### Database Layer
- **Dual Database System**:
  - PostgreSQL (`lib/database.ts`) - Primary database for production (configured but not actively used)
  - SQLite (`lib/user-database.ts`) - Currently active database for user management and orders
  - Database path: `database/user-management.db`

### Authentication System
- JWT-based authentication with bcrypt password hashing
- Two authentication implementations:
  - `lib/auth.ts` - PostgreSQL-based auth (inactive)
  - `lib/middleware/auth.ts` - Active JWT middleware
- User roles: `user`, `admin`, `staff`
- Token expiry: 7 days

### API Structure
All API routes follow RESTful patterns under `/app/api/`:
- `/auth/` - Authentication endpoints (login, register, me)
- `/admin/` - Admin dashboard endpoints (users, orders, products, pricing)
- `/user/` - User-specific endpoints (profile, orders, addresses, support)
- `/orders/` - Order management with nested `/[id]/items/` for order items

### Frontend Structure
- **App Router** (Next.js 14) with TypeScript
- Three main sections:
  - Public pages (login, about, home)
  - User dashboard (`/user/dashboard/`)
  - Admin dashboard (`/admin/dashboard/`)
- Dark/light theme support via `next-themes`

### Key Dependencies
- **Payments**: Stripe integration (`@stripe/stripe-js`, `stripe`)
- **UI**: Tailwind CSS, Framer Motion, Lucide React icons
- **Data**: Tanstack React Table, Recharts
- **Real-time**: Socket.io (configured but not implemented)

## Important Implementation Notes

### Database Migrations
Before making database changes:
1. Check existing schema in `database/user-management-schema.sql`
2. Run migrations if schema changes are needed
3. Use transaction wrapper for complex operations

### Authentication Flow
1. User logs in via `/api/auth/login`
2. JWT token generated with user data
3. Token sent in Authorization header: `Bearer <token>`
4. Middleware validates token and extracts user

### Order Processing
Orders follow this status flow:
- `pending` → `received` → `in_progress` → `grading` → `completed` → `shipped` → `delivered`
- Payment statuses: `pending`, `paid`, `failed`, `refunded`

### Current Package Offerings
1. Authentication - $10/card
2. Bulk Grading - $12/card (min 50 cards)
3. Standard - $15/card
4. Express - $20/card (priority)

## Environment Variables Required
```
JWT_SECRET=<secure-random-string>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_grading
DB_USER=postgres
DB_PASSWORD=<database-password>
STRIPE_SECRET_KEY=<stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-public-key>
```

## Testing Approach
- Manual testing via API routes
- Test endpoints available: `/api/test-db`, `/api/health`, `/api/demo`
- Use test scripts: `test-db.js`, `test-direct.js`, `test-simple.js`

## Common Development Tasks

### Adding New API Endpoints
1. Create route file in appropriate `/app/api/` directory
2. Implement authentication using `authMiddleware` from `lib/middleware/auth.ts`
3. Use database functions from `lib/user-database.ts`
4. Return consistent JSON responses with error handling

### Modifying Database Schema
1. Update `database/user-management-schema.sql`
2. Update TypeScript interfaces in `lib/user-database.ts`
3. Run `node scripts/init-clean-database.js` to reinitialize
4. Test with existing API endpoints

### Implementing New Dashboard Features
1. Add route in `/app/[user|admin]/dashboard/`
2. Create corresponding API endpoint
3. Use consistent layout from `layout.tsx`
4. Follow existing dark mode theming patterns