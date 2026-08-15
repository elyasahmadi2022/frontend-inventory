<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:frontend-design-rules -->

# Frontend design rules

Follow these rules for every UI change:

- Use the color tokens defined in `app/globals.css`. Prefer semantic utilities
  such as `bg-light-bg`, `bg-light-surface`, `text-light-text`,
  `text-light-muted`, and their `dark:` counterparts.
- Use `primary-500` for primary actions and selected states, `primary-600` for
  hover states, and `primary-50`/`primary-100` for subtle accents.
- Do not introduce new brand colors or arbitrary hex values in components.
- Inputs, selects, and buttons use `rounded-none`, a one-pixel semantic border,
  and a visible `primary-500` focus ring.
- Cards, panels, dropdowns, and modals use `rounded-none`, semantic surface and
  border colors, and restrained theme shadows.
- Use `rounded-none` for compact internal elements such as option rows, chips,
  badges, and icon buttons.
- Keep borders subtle: `border-light-border dark:border-dark-border`.
- Default page surfaces must work in both light and dark themes.
- Reuse components from `components/common` before creating page-specific form
  controls.
- Preserve accessible labels, keyboard navigation, disabled states, and focus
  visibility.

<!-- END:frontend-design-rules -->

# Development

## Setup
```bash
pnpm install
```

## Commands
- `pnpm dev` — Start dev server (Next.js 16 App Router)
- `pnpm build` — Build for production
- `pnpm lint` — Run ESLint
- `pnpm format` — Format with Prettier
- `pnpm format:check` — Check formatting

## API Configuration
- Backend proxy: `/api/v1/*` rewrites to `http://localhost:5000` (or `NEXT_PUBLIC_API_URL`)
- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` or `API_PROXY_TARGET`
- Google OAuth: set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

# Architecture

## App Structure
- **`app/(public)/`** — Public pages (login, register, verify-email, forgot-password)
- **`app/(dashboard)/dashboard/`** — Owner/user dashboard (protected, requires auth)
- **`app/(admin)/admin/`** — Admin panel (protected, requires `admin` role)

## Auth Roles
- `admin` — Full admin access
- `manager` — Owner dashboard access  
- `user` — User dashboard access

## Key Files
- Routes: `routes/app-routes.ts` — URL builders for all pages
- Auth: `context/AuthContext.tsx` — Auth state + providers; `lib/auth/roles.ts` — role helpers
- API: `lib/api.ts` — Base fetch with Bearer token auth; `services/auth.service.ts` — auth endpoints
- Common components: `components/common/index.ts` — re-exported UI primitives
- Layout: `components/layout/dashboard-layout.tsx`, `components/layout/admin-layout.tsx`

## Design Tokens
Color tokens in `app/globals.css`: `primary-500`, `primary-600`, `light-bg`, `light-surface`,
`light-text`, `light-muted`, `dark-bg`, `dark-surface`, `dark-text`, `dark-muted`.
All use `rounded-none` (0 radius).