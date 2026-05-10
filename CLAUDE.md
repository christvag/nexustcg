# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Trading Card Game (TCG) grading service e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS. The application provides professional card grading services for Pokemon, Yu-Gi-Oh!, MTG, and other trading card games.

## Development Commands

```bash
# Start development server at port 3000
npm run dev                         # Start Next.js development server

# Build and production
npm run build                       # Build production bundle
npm start                          # Start production server

# Code quality
npm run lint                       # Run ESLint

# Database initialization
node scripts/init-user-database.js  # Initialize SQLite user database
node scripts/init-clean-database.js # Reset database to clean state

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/demo
```

## Architecture

### Database Layer
- **SQLite (Primary)**: `database/user-management.db` via `better-sqlite3` (sync, not async)
  - ⚠️ **CRITICAL**: Always use `better-sqlite3` in API routes (not the async `sqlite3` library). Sync operations prevent N+1 queries and 5+ second load times.
  - Database modules in `lib/`:
    - `user-database.ts` - Users, orders, order items
    - `population-report-database.ts` - TCG population statistics + cards (the only card source of truth)
    - `card-games-database.ts` - Card game metadata
    - `tcgrading-database.ts` - Legacy: opens `database/tcgrading.db`. Still imported by `app/api/orders/[id]/route.ts`, `app/api/orders/[id]/items/route.ts`, `app/api/admin/dashboard/route.ts`, and `lib/notion-integration.ts`. Slated for migration onto `user-management.db`.
  - PostgreSQL (`lib/database.ts`, `lib/auth.ts`) - Configured but unused

### Database Usage Pattern
```typescript
// Correct pattern - used in all API routes
import Database from 'better-sqlite3'
function getDb() {
  const dbPath = path.join(process.cwd(), 'database', 'user-management.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  return db
}
// In handler: const db = getDb(); ... db.close()

// Field stripping - always remove before returning user data:
// password_hash, reset_token, reset_token_expires
```

### Authentication System
- JWT-based (`lib/middleware/auth.ts`) - Active and required for admin routes
- Token secret: `process.env.JWT_SECRET || 'nexus-tcgrading-secret-key-2024'`
- Password hashing: `bcryptjs` (pure JS, not native `bcrypt`)
- User roles: `user`, `admin`, `staff`
- Token expiry: 7 days

### API Structure
All API routes follow RESTful patterns under `/app/api/`:
- `/auth/` - Authentication (login, register, me)
- `/admin/` - Admin endpoints (require Bearer JWT with admin role)
- `/user/` - User endpoints (profile, orders, addresses)
- `/orders/` - Order GET (paginated) and POST (with email trigger)
- `/population-report/` - TCG population statistics (public read)
- `/packages/` - Package offerings (public read)
- `/packages/[slug]/` - Single package detail (public read)
- **Pagination**: Use `limit` and `offset` query params for list endpoints

### Email Integration
- **Email Service** (`lib/email-service.ts`): Nodemailer-based email dispatch
- **Email Trigger** (`lib/email-trigger.ts`): Hooks for order events
  - Triggered on order creation, status updates
  - Integrates with Notion database for tracking
- **Notion Integration** (`lib/notion-integration.ts`): Syncs orders and cards to Notion

### Frontend Structure
- **App Router** (Next.js 14) with TypeScript (strict mode)
- Three main sections:
  - Public pages (login, about, home)
  - User dashboard (`/app/user/dashboard/`)
  - Admin dashboard (`/app/admin/dashboard/`)
- Dark/light theme support via `next-themes`
- Type definitions: `lib/types/dashboard.ts` (User, Order, Product, PopulationReport, etc.)

### Key Dependencies (Active)
- **Payments**: Stripe integration (`@stripe/react-stripe-js`, `stripe`)
- **UI**: Tailwind CSS, Framer Motion, Lucide React icons
- **Data**: Tanstack React Table, Recharts
- **Database**: `better-sqlite3` (sync), `pg` (unused)
- **Email**: Nodemailer
- **Auth**: `jsonwebtoken`, `bcryptjs`
- **Other**: Notion client, MTG SDK

## Important Implementation Notes

### Database Migrations & Schema
- Schema defined in `database/user-management-schema.sql` (users / orders / packages / package_features / package_feature_values / packages_settings / etc.) and `database/graded-cards-schema.sql` (cards).
- Foreign keys enforced via `PRAGMA foreign_keys = ON`. WAL journaling enabled.
- Before schema changes: verify no running servers, backup DBs, update schema file, run `npm run db:seed`.

### Database Files & Deployment
- `.db` files are git-ignored (`/database/*.db` in `.gitignore`). They never travel with the repo.
- Every fresh checkout / clean install seeds the DB automatically via `npm run postinstall` → `scripts/db-seed.js`.
- `scripts/db-seed.js` is **idempotent**: it creates the schema if missing, runs `migrate-drop-v2-suffix.js` if legacy V2 tables are detected, seeds the admin user only if no admin exists, and seeds default `packages` only if the table is empty.
- Manual reseed: `npm run db:seed`. Override admin credentials via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars.
- The single source of truth for cards is `population_report_cards` in `graded-cards.db`, served by `lib/population-report-database.ts`.

### Native Modules (better-sqlite3, bcrypt)
- `better-sqlite3` and `bcrypt` are **native modules**. They must be compiled against the running Node.js major version (`NODE_MODULE_VERSION` mismatch ⇒ silent 500s on every DB-touching route).
- Symptom: every route that opens the DB returns 500 with `Error: The module '...better_sqlite3.node' was compiled against a different Node.js version`.
- Fix locally: `npm rebuild better-sqlite3 sqlite3 bcrypt`.
- Fix in Docker: the Dockerfile already runs `npm rebuild ... --build-from-source` against Alpine.
- `next.config.js` declares them in `experimental.serverComponentsExternalPackages` so the Next.js standalone build does not try to bundle their `.node` bindings.

### Authentication Flow
1. User logs in via `/api/auth/login` (accepts email + password)
2. Password verified with `bcryptjs.compare()`
3. JWT token generated: `{ user: { id, email, role, firstName, lastName } }`
4. Token sent in Authorization header: `Bearer <token>`
5. `authMiddleware` validates token, extracts user, enforces role checks
6. Admin routes require `{ role: 'admin' }`

### Order Lifecycle
- **Status flow**: `pending` → `received` → `in_progress` → `grading` → `completed` → `shipped` → `delivered`
- **Payment statuses**: `pending`, `paid`, `failed`, `refunded`
- **On creation**: `/api/orders` POST triggers `triggerOrderEmail()` which:
  - Sends confirmation email to customer
  - Syncs order to Notion database
  - Creates order items linked to graded cards

### Population Report System
- Tracks TCG population statistics (total graded cards per card variant)
- Endpoint: `/api/population-report` (public, paginated, filterable by card_id)
- Features: Grade distribution breakdown, comment threads per card
- Export settings allow admins to configure email notifications for report changes

### Current Package Offerings (from `packages` table)
1. **Authentication** - $10/card (bulk discount entry)
2. **Bulk Grading** - $12/card (minimum 50 cards)
3. **Standard** - $15/card (standard service)
4. **Express** - $20/card (priority turnaround)
- All accessible via `/api/packages` (public read)
- Admin update via `/api/admin/packages` (POST/PUT)

## Environment Variables

### Required
```
JWT_SECRET=<secure-random-string>                          # JWT signing secret
STRIPE_SECRET_KEY=<stripe-secret-key>                     # Stripe backend key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-public-key>    # Stripe frontend key
NOTIONHQ_TOKEN=<notion-api-token>                         # Notion workspace token (optional, for email sync)
NOTION_DATABASE_ID=<notion-database-id>                   # Notion orders database (optional)
```

### Optional (PostgreSQL, not currently used)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tcg_grading
DB_USER=postgres
DB_PASSWORD=<database-password>
```

## Testing & Debugging

### API Endpoints
- `GET /api/health` - Server health check
- `GET /api/demo` - Demo/test data endpoint
- `GET /api/test-db` - Database connection test

### Test Scripts
- `node scripts/test-db.js` - Direct database query test
- `node scripts/test-direct.js` - API endpoint test
- `node scripts/test-simple.js` - Simplified test runner

### Best Practices
- Always test with dummy data before merging
- Verify email triggers work with order creation
- Check population report calculations for correctness
- Validate Stripe payment intents before marking orders paid

## Common Development Tasks

### Adding New API Endpoints
1. Create `app/api/[feature]/route.ts` with GET/POST handlers
2. Use `getDb()` pattern for database access; **close the connection with `db.close()`**
3. Apply `authMiddleware` if authentication required; check `requiredRole` parameter
4. Validate input with Zod if handling user data
5. Strip sensitive fields (password_hash, reset_token) before returning user objects
6. Return consistent JSON: `{ data: ..., error?: string, status?: number }`
7. Test with dummy data and clean up before commit

### Implementing Email Triggers
1. Add trigger logic to `lib/email-trigger.ts` (export function like `triggerOrderEmail()`)
2. Import and call from relevant POST endpoints (e.g., order creation)
3. Configure Notion integration if syncing to external DB
4. Email template: use Nodemailer with HTML formatting
5. Log all email events for debugging: `console.log('[Email Trigger]', message)`

### Adding Population Report Features
1. Queries use `lib/population-report-database.ts` (getPopulationReports, updateGradeDistribution)
2. Endpoint: `GET /api/population-report` with filters (card_id, game, sort, pagination)
3. Grade distribution stored as JSON in `grades` field
4. Export settings stored in `export_settings` table for admin configuration
5. Comments use nested structure: parent comment + replies via `parent_comment_id`

### Modifying Database Schema
1. Update `database/user-management-schema.sql` with ALTER TABLE or CREATE TABLE
2. Update TypeScript interfaces in `lib/user-database.ts` or `lib/types/dashboard.ts`
3. Add database accessor functions if needed
4. Run `node scripts/init-clean-database.js` to reset (dev only)
5. Test endpoints that use the changed tables
6. Commit schema SQL alongside code changes

### Implementing New Dashboard Features
1. Create page in `/app/user/dashboard/[feature]/page.tsx` or `/app/admin/dashboard/[feature]/page.tsx`
2. Create corresponding API endpoint(s) in `/app/api/...`
3. Use consistent layout wrapper from `layout.tsx` in the dashboard directory
4. Apply theme colors via `next-themes` context (check `useTheme()` hook)
5. Use Lucide icons from `lucide-react` for consistency
6. Fetch data client-side with `fetch('/api/...')` or server-side with direct DB calls