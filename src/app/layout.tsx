import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'DomainHub - Enregistrez vos domaines en 30 secondes | #1 des registraires en France',
  description: 'La plateforme la plus simple pour enregistrer et gérer vos domaines. Recherche ultra-rapide, paiement sécurisé, support 24/7. Rejoignez 10,000+ clients satisfaits.',
  keywords: 'enregistrement domaine, registraire domaine, .com, .fr, .app, domaine internet, gestion domaines, revendeur domaines',
  authors: [{ name: 'DomainHub Team' }],
  openGraph: {
    title: 'DomainHub - Enregistrez vos domaines en 30 secondes',
    description: 'La plateforme la plus simple et la plus sûre pour enregistrer et gérer vos domaines',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DomainHub - Enregistrez vos domaines rapidement',
    description: 'Recherche rapide, paiement sécurisé, support 24/7'
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Meta Tags pour SEO */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}

        {/* PayPal Script */}
        {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
          <Script
            src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&locale=fr_FR`}
            strategy="afterInteractive"
          />
        )}
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}

        {/* Structured Data - JSON-LD */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              'name': 'DomainHub',
              'description': 'Plateforme d\'enregistrement et gestion de domaines',
              'url': 'https://domainub.com',
              'applicationCategory': 'BusinessApplication',
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.9',
                'ratingCount': '2400'
              }
            })
          }}
        />
      </head>
      <body className="font-body antialiased bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
