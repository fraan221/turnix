# AGENTS.md

> Guidelines for AI coding agents working in this repository.

## Project Overview

Turnix is a SaaS appointment booking system for barbershops in Argentina. All user-facing text is in **Argentine Spanish**. The timezone is hardcoded to `America/Argentina/Buenos_Aires` throughout.

**Stack**: Next.js 14 (App Router) | React 18 | TypeScript 5 (strict) | Prisma 7 + PostgreSQL (Supabase) | Tailwind CSS 3 | shadcn/ui | Zustand 5 | NextAuth v5 beta | MercadoPago | Vercel

## Build / Lint / Test Commands

```bash
# Development
npm run dev                  # next dev (Turbopack)

# Build (includes prisma generate)
npm run build                # prisma generate && next build

# Lint
npm run lint                 # next lint (built-in ESLint)

# Type check (no dedicated script; use tsc directly)
npx tsc --noEmit

# E2E tests (Playwright, chromium only)
npx playwright test                          # run all tests
npx playwright test tests/booking.spec.ts    # run a single test file
npx playwright test -g "test name"           # run a single test by name
npx playwright test --headed                 # run with visible browser

# Database
npx prisma migrate dev       # create/apply migrations
npx prisma db push           # push schema without migration
npx prisma db seed           # seed database (ts-node prisma/seed.ts)
npx prisma studio            # GUI for browsing data

# Email templates
npm run email                # react-email dev server on port 3001
```

## Project Structure

```
app/                    Next.js App Router pages and API routes
  dashboard/            Protected dashboard (auth required)
  api/                  API routes (webhooks, cron, upload, auth, push)
  [slug]/               Public barbershop profiles (dynamic routes)
actions/                Server actions (*.actions.ts)
components/             React components
  ui/                   shadcn/ui primitives (do not edit manually)
lib/                    Shared utilities, Prisma client, Zod schemas, stores
  stores/               Zustand stores
  mercadopago/          MercadoPago types and utilities
hooks/                  Custom React hooks
types/                  TypeScript type declarations
context/                React context providers
emails/                 React Email templates
prisma/                 Schema, migrations, seed script
tests/                  Playwright E2E tests
```

## Code Style

### TypeScript

- **Strict mode** is enabled. Never use `any` — use proper types or `unknown`.
- Path alias `@/*` maps to the project root. Always prefer `@/` imports over relative paths except for same-directory imports.
- Import order: external packages, then `@/` aliased imports, then relative imports.
- Named exports preferred. Default exports only for page/layout components (Next.js convention).

### Naming Conventions

| Element               | Convention     | Example                          |
|-----------------------|----------------|----------------------------------|
| Components            | PascalCase     | `RegisterForm.tsx`               |
| Component files       | PascalCase     | `BookingCalendar.tsx`            |
| Utility/hook files    | kebab-case     | `date-helpers.ts`, `use-mobile.tsx` |
| Server action files   | kebab-case     | `service.actions.ts`             |
| Functions/variables   | camelCase      | `getUserForSettings`             |
| Types/interfaces      | PascalCase     | `ServiceInput`, `BookingStatus`  |
| Constants/enums       | UPPER_CASE     | `OWNER`, `PENDING`               |

### Components

- Add `"use client"` only when the component uses hooks or browser APIs. Server components are the default.
- Use shadcn/ui components from `@/components/ui/`. Do not modify files in `components/ui/` directly.
- Forms use `react-hook-form` + `zodResolver` + server actions via `useTransition` or `useFormState`.
- Loading states use skeleton components from `components/skeletons/`.

### Server Actions (`actions/*.actions.ts`)

Every server action file follows this pattern:

```typescript
"use server";

import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { SomeSchema } from "@/lib/schemas";

export async function doSomething(data: SomeInput) {
  // 1. Auth check — always first
  const user = await getUserForSettings();
  if (!user) return { error: "No autorizado." };

  // 2. Authorization — check role/ownership
  // 3. Validate input with Zod if not already validated client-side
  // 4. Database operation in try/catch
  try {
    await prisma.someModel.create({ data: { ... } });
    revalidatePath("/dashboard/...");
    return { success: "Operación exitosa." };
  } catch (error) {
    console.error("Error al hacer algo:", error);
    return { error: "No se pudo completar la operación." };
  }
}
```

Key rules:
- **Return type**: always `{ success: string } | { error: string }`. Never throw from server actions.
- **Auth**: call `getCurrentUser()` or `getUserForSettings()` from `lib/data.ts`.
- **Validation**: use Zod schemas from `lib/schemas.ts`.
- **Error messages**: in Spanish, user-friendly. Log technical details with `console.error()`.
- **Cache invalidation**: call `revalidatePath()` or `revalidateTag()` after mutations.

### Data Fetching

- Server components call cached functions from `lib/data.ts`.
- Data functions are wrapped in React `cache()` for request deduplication.
- Some use `unstable_cache` with tags for ISR-style caching.
- Public profile data uses `revalidateTag()` with pattern `barber-profile:{slug}`.

### State Management (Zustand)

- Stores live in `lib/stores/`. Use `devtools` middleware.
- Typed with separate `State` and `Actions` interfaces.
- Export named selectors (e.g., `useBookingDate`, not the raw store).

### Validation (Zod)

- All schemas live in `lib/schemas.ts`.
- Shared between client-side forms and server actions.
- Validation messages are in Spanish.

### Styling

- Tailwind CSS classes with `cn()` utility from `lib/utils.ts` for conditional classes.
- CSS variables for theming defined in `app/globals.css`.
- Fonts: Geist Sans and Geist Mono via `next/font` (configured in `app/fonts.ts`).

### Authentication

- NextAuth v5 beta with JWT strategy. Providers: Google OAuth + Credentials (bcryptjs).
- Roles: `OWNER` and `BARBER` (Prisma enum `Role`).
- Session extended with: `id`, `shopId`, `slug`, `role`, `onboardingComplete`, `subscriptionTier`.
- Middleware protects `/dashboard/*` routes — unauthenticated users are redirected to `/login`.

### Realtime

- Supabase Realtime for broadcasts (booking updates on public pages) and `postgres_changes`.
- Hooks: `use-broadcast.ts`, `use-realtime-subscription.ts`.

### Error Handling

- Server actions: try/catch, return `{ error: "..." }`, log with `console.error()`.
- Never throw errors from server actions — always return structured responses.
- Client-side: display errors via `sonner` toast notifications.

## Important Conventions

- All user-facing strings (errors, success messages, labels) must be in **Argentine Spanish**.
- Currency formatting uses `es-AR` locale and `ARS` currency (`lib/utils.ts:formatPrice`).
- Date handling uses `date-fns-tz` with the `America/Argentina/Buenos_Aires` timezone.
- The package manager is **npm** (not yarn/pnpm/bun). Use `npm install` for dependencies.
- Node.js >= 20 required (.nvmrc specifies v22).
- No explicit Prettier or ESLint config files — formatting relies on VSCode settings (2-space indent, format on save).
