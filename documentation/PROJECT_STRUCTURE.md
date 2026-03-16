# Project Structure Guide

## Overview

DomainHub est organisé selon une architecture claire séparant les pages de présentation du dashboard authentifié.

## Folder Structure

```
src/
├── app/                      # Next.js App Router routes
│   ├── (dashboard)/          # Authenticated dashboard routes
│   │   ├── analytics/
│   │   ├── api/
│   │   ├── api-keys/
│   │   ├── audit/
│   │   ├── billing/
│   │   ├── changelog/
│   │   ├── collaborators/
│   │   ├── console/
│   │   ├── dashboard/
│   │   ├── database/
│   │   ├── deployments/
│   │   ├── docs/
│   │   ├── domains/
│   │   ├── health/
│   │   ├── invoices/
│   │   ├── monitoring/
│   │   ├── projects/
│   │   ├── settings/
│   │   ├── team/
│   │   ├── tests/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                  # Next.js API routes
│   ├── login/               # Authentication pages
│   ├── signup/
│   ├── select-plan/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page (routing logic)
│   ├── favicon.ico
│   └── next-env.d.ts
│
├── presentations/           # Marketing & presentation pages
│   ├── landing-page.tsx     # Main landing page with all sections
│   └── README.md            # Presentations folder documentation
│
├── components/              # Reusable UI components
│   ├── auth/
│   ├── dashboard/
│   ├── ui/
│   ├── audit-log-item.tsx
│   ├── audit-logs-stats.tsx
│   ├── DashboardProtection.tsx
│   ├── DashboardSidebar.tsx
│   ├── data-provider.tsx
│   └── ... (more components)
│
├── context/                 # React Context (Auth, etc)
│   └── AuthContext.tsx
│
├── firebase/                # Firebase configuration & utilities
│   ├── client-provider.tsx
│   ├── config.ts
│   ├── auth/
│   ├── firestore/
│   └── ... (more firebase files)
│
├── hooks/                   # Custom React hooks
│   ├── use-auth.tsx
│   ├── use-collaborators.ts
│   ├── use-projects.ts
│   └── ... (more hooks)
│
└── lib/                     # Utility functions & services
    ├── auth-middleware.ts
    ├── encryption.ts
    ├── firebase.ts
    ├── firestore-service.ts
    ├── types.ts
    └── ... (more utilities)

```

## Key Distinctions

### Public Pages (src/app)
- `page.tsx` - Home page routing logic
  - Shows landing page if not authenticated
  - Redirects to dashboard if authenticated
- `login/` - Login page
- `signup/` - Signup page
- `select-plan/` - Plan selection

### Presentation Pages (src/presentations)
- `landing-page.tsx` - Marketing landing page with:
  - Hero section
  - Features showcase
  - How it works
  - Pricing tiers
  - Revendeur program
  - FAQ
  - Newsletter
  - Footer

### Authenticated Routes (src/app/(dashboard))
- Analytics, API Keys, Audit logs, Billing, etc.
- Only accessible to authenticated users

## Routing Flow

```
User Visit
    ↓
src/app/page.tsx (routing logic)
    ├─ If not authenticated → Show LandingPage from src/presentations/landing-page.tsx
    └─ If authenticated → Redirect to /dashboard
```

## Future Component Extraction

When the landing page grows, extract components:

```
presentations/
├── landing-page.tsx (import & compose components)
├── components/
│   ├── hero.tsx
│   ├── features.tsx
│   ├── pricing.tsx
│   ├── seller-program.tsx
│   ├── faq.tsx
│   ├── newsletter.tsx
│   └── footer.tsx
└── README.md
```

## Technology Stack

- **Next.js 15.5.9** - App Router, Server Components, API Routes
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Styling (dark theme)
- **Lucide React** - Icons
- **Firebase** - Authentication & Backend
- **Stripe** - Payments
- **IONOS** - Domain Registration

## Import Paths

Configured in `tsconfig.json`:
- `@/` points to `src/` directory
- Examples:
  - `@/presentations/landing-page`
  - `@/components/ui/button`
  - `@/lib/auth-middleware`

## Environment Setup

Ensure these are configured in `.env.local`:
- Firebase credentials
- Stripe API keys
- IONOS API keys
- Other third-party integrations

---

Last Updated: 2024
