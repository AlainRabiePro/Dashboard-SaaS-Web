# **App Name**: SaasFlow Dashboard

## Core Features:

- User Authentication: Secure user login with email/password and Google Sign-In options. Implements protected routes, redirecting unauthenticated users to the login page.
- Dashboard Overview: Displays a personalized welcome message, key summaries (active sites, storage usage, next invoice), and a feed of recent account activity, fetching data from Firestore.
- Site Management: View a list of user's active/suspended sites, their URLs, and creation dates. Allows users to add new sites via a modal.
- Domain Management: Lists linked domain names with their expiry dates and status. Includes a DNS status badge (propagated/not propagated) and a 'Manage DNS' action for each domain.
- Storage Visualization: Shows current storage usage with a visual progress bar, detailed breakdown by site, and a clear call-to-action for upgrading storage.
- Billing & Invoices: Provides an overview of invoices with status and PDF download options. Displays current plan details, renewal date, and buttons for upgrading or canceling subscriptions.
- Mock Data Seeding: Populates Firestore with realistic mock data upon first user login to facilitate immediate testing and demonstration.

## Style Guidelines:

- Primary accent color: A deep, professional blue (#1E40AF) to convey trust and stability, aligning with a modern SaaS aesthetic.
- Background color: A very light, subtle blue-white (#F8FAFC) providing a clean canvas, derived from the primary hue but heavily desaturated to blend with the 'white background' requirement.
- Accent color: A vibrant, analogous aqua blue (#47CFFF) providing contrast and highlights for interactive elements and call-to-actions, located approximately 30 degrees to the 'left' of the primary on the color wheel.
- Main font: 'Inter' (sans-serif) for both headlines and body text, chosen for its modern, clean, and objective appearance suitable for a SaaS dashboard, reflecting styles seen in platforms like Vercel or Netlify.
- Utilize a comprehensive set of clean, vector-based icons from 'Lucide React' for all navigational elements and interactive components, ensuring clarity and modern aesthetic.
- Implement a clear sidebar navigation for intuitive access to all dashboard sections. The layout should be fully responsive, ensuring optimal user experience on both desktop and mobile devices. Full dark mode support will also be provided.
- Incorporate subtle and smooth animations for transitions, hover states, and data loading indicators to enhance the user experience without being distracting.