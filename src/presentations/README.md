# Presentations Folder Structure

This folder contains all marketing and presentation pages for DomainHub.

## Overview

- **landing-page.tsx** - Main landing page with all sections:
  - Hero section with CTA
  - Features showcase (6 main features + 18 advanced features)
  - How it works (4-step process)
  - Pricing section (3 tiers: Starter, Professional, Enterprise)
  - Revendeur/Seller program
  - FAQ section with interactive accordion
  - Newsletter subscription
  - Footer with links

## Future Structure

As the project grows, consider extracting components into smaller, reusable pieces:

```
presentations/
├── landing-page.tsx (main page importing components)
├── components/
│   ├── hero.tsx
│   ├── features.tsx
│   ├── pricing.tsx
│   ├── seller-program.tsx
│   ├── faq.tsx
│   ├── newsletter.tsx
│   └── footer.tsx
└── README.md (this file)
```

## Import Path

The landing page is imported in `src/app/page.tsx`:

```tsx
import LandingPage from "@/presentations/landing-page";
```

## Styling

All pages use:
- Tailwind CSS for styling
- Dark modern design (slate-950 to slate-900 gradient)
- Lucide React icons
- Responsive design (mobile-first approach)

## State Management

The landing page uses React hooks:
- `useState` for email input (newsletter)
- `useState` for expanded FAQ items

## Next Steps

1. Extract components as the landing page grows
2. Create separate presentation pages if needed
3. Add analytics tracking
4. Implement form submissions (email capture, seller signup)
