# Agent Guidelines for Turnix

This document provides instructions and guidelines for AI agents working on the Turnix codebase.

## 1. Build, Lint, and Test Commands

### Build
- **Development Server:** `npm run dev` (Starts Next.js dev server on port 3000)
- **Production Build:** `npm run build` (Runs `prisma generate` and `next build`)
- **Start Production:** `npm run start`

### Linting & Formatting
- **Lint Code:** `npm run lint` (Runs Next.js ESLint configuration)
- **Type Check:** `npx tsc --noEmit` (Run TypeScript compiler to check for type errors without emitting files)

### Testing (Playwright)
- **Run All Tests:** `npx playwright test`
- **Run Single Test File:** `npx playwright test tests/path/to/test.spec.ts`
- **Run Specific Test Case:** `npx playwright test -g "name of the test"`
- **Debug Tests:** `npx playwright test --debug`
- **Show Report:** `npx playwright show-report`

### Database (Prisma)
- **Generate Client:** `npx prisma generate` (Run after schema changes)
- **Migrate Database:** `npx prisma migrate dev`
- **Seed Database:** `npx prisma db seed` (Uses `prisma/seed.ts`)
- **Studio:** `npx prisma studio` (Open database GUI)

## 2. Code Style & Conventions

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (`@/components/ui`) + Radix UI
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js v5 (`auth.ts`, `auth.config.ts`)
- **State Management:** Zustand (if applicable, verify usage) or React Context
- **Forms:** React Hook Form + Zod validation

### File Structure
- `app/`: App Router pages, layouts, and loading states.
  - Use `page.tsx` for routes, `layout.tsx` for layouts.
  - Group related routes in folders (e.g., `(marketing)/`, `dashboard/`).
- `components/`:
  - `ui/`: Reusable Shadcn UI components.
  - Other folders for feature-specific components.
- `lib/`: Utility functions, Prisma client instance (`prisma.ts`), and shared logic.
- `actions/`: Server Actions for data mutations.
- `types/`: Global TypeScript type definitions.
- `tests/`: Playwright end-to-end tests.

### Coding Guidelines

#### TypeScript
- **Strict Mode:** Enabled. Avoid `any` types; use specific types or interfaces.
- **Interfaces:** Define interfaces for props and data structures. Prefix is not required (e.g., `UserProps`, not `IUserProps`).
- **Path Aliases:** Use `@/` for imports (e.g., `import { Button } from "@/components/ui/button"`).

#### Components
- **Functional Components:** Use React Functional Components with named exports.
- **Props:** Destructure props in the function signature.
- **Server vs. Client:**
  - Default to Server Components.
  - Add `'use client'` at the top of the file *only* when interactivity (hooks, event listeners) is needed.

#### Styling (Tailwind CSS)
- **Utility First:** Use Tailwind utility classes for styling.
- **CN Utility:** Use `cn()` from `@/lib/utils` for conditional class merging.
  ```tsx
  <div className={cn("bg-red-500", className)}>...</div>
  ```
- **Shadcn UI:** Use provided components from `@/components/ui` whenever possible to maintain consistency.

#### State Management & Data Fetching
- **Server Components:** Fetch data directly in Server Components using Prisma or API calls.
- **Server Actions:** Use Server Actions (`actions/` folder) for mutations (form submissions, updates).
- **Client State:** Use `useState` or `useReducer` for local state.

#### Error Handling
- **Server Actions:** Return objects with `error` or `success` properties.
- **UI Feedback:** Use `sonner` or `toast` for user notifications upon success/failure.
- **Validation:** Use Zod schemas for form and API input validation.

#### Imports
- **Order:**
  1. External libraries (React, Next.js, etc.)
  2. Internal components (`@/components/...`)
  3. Utilities and Hooks (`@/lib/...`, `@/hooks/...`)
  4. Types and Styles

### Example Component Structure

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email(),
});

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <Input {...form.register("email")} placeholder="Email" />
      <Button type="submit">Login</Button>
    </form>
  );
}
```
