# Frontend Design Guide

This guide defines the visual direction for the Real Estate frontend and keeps UI decisions consistent across pages.

## Design Direction

- Style: modern, clean, premium
- Mood: trustworthy, clear, professional
- Core concept: **Blue, Neutral, and Theme-Aware**

## Color Palette

Use these exact colors in all pages/components:

- Primary: `#0066FF`
- Primary hover: `#0052CC`
- Light background: `#F7F8FA`
- Light surface: `#FFFFFF`
- Light border: `#E4E8EF`
- Light text: `#0A1224`
- Light muted: `#64748B`
- Dark background: `#111111`
- Dark surface: `#171717`
- Dark border: `#2A2D33`
- Dark text: `#FFFFFF`
- Dark muted: `#AEB9CC`

Implementation source:

- `lib/design-tokens.ts`
- `app/globals.css` (CSS variables + Tailwind theme tokens)

## Typography System

### Primary stack (currently implemented)

- UI + body: **Inter**
- Luxury headings: **Playfair Display**

### Approved alternatives

#### Modern Sans-Serif (body/UI)

- Inter
- Montserrat
- Open Sans
- Lato
- Roboto
- Poppins

#### Elegant Serif (luxury headlines/content)

- Playfair Display
- Lora
- Georgia
- Cinzel

#### Bold/Display (hero headings/CTA emphasis)

- Raleway
- Oswald
- League Spartan

## UI Principles

- Keep layouts clean with generous spacing.
- Support both light and dark surfaces with semantic theme utilities.
- Use primary blue for actions, focus, selection, and key links.
- Favor readable body text and simple hierarchy.
- Keep component borders subtle and use the theme border tokens.
- Use `rounded-xl` for controls and `rounded-2xl` for cards and panels.
- Prefer theme shadows over arbitrary shadow values.

## Reusable Style Utilities

Defined in `app/globals.css`:

- `.page-shell`: responsive main content container
- `.card-surface`: reusable elevated card block
- `.headline-luxury`: premium serif heading style
- `.text-muted`: secondary text tone
- `.btn-primary`: primary gold CTA button

## Components and Structure

Current reusable files:

- `components/common/primary-button.tsx`
- `components/layout/page-container.tsx`
- `components/site-header.tsx`
- `components/site-footer.tsx`

Supporting frontend structure:

- `app/` (pages and routes)
- `components/` (shared UI)
- `routes/` (route constants)
- `services/` (API service helpers)
- `hooks/` (custom hooks)
- `context/` (global providers/state)
- `utils/` (constants/helpers)
- `lib/` (design tokens and core utilities)

## Page Design Rules

- Every new page should use `.page-shell` for layout consistency.
- Use `.card-surface` for content sections and listing blocks.
- Use `.btn-primary` for primary actions only.
- Keep 1 clear primary CTA per section where possible.
- Maintain mobile-first responsive behavior.

## Header and Footer Rules

- Header and footer must work in both light and dark themes.
- Navigation links use primary blue for active and hover states.
- Keep header content minimal and task-focused.

## Accessibility and Readability

- Maintain strong contrast between text and background.
- Use muted semantic text for secondary content.
- Use clear font sizes and spacing for property data-heavy screens.
- Ensure interactive elements are visibly focusable and clickable.

## Future Expansion Checklist

When adding new screens (listings, details, auth, dashboard), ensure:

- Theme palette tokens are reused (no random hex values).
- Typography roles are respected (body vs heading).
- Existing shared components are reused first.
- Spacing and card patterns remain consistent across modules.
