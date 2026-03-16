import { NextRequest, NextResponse } from 'next/server';

interface AuditResult {
  score: number;
  issues: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    suggestion: string;
    impact: string;
  }>;
  metrics: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    imagesWithoutAlt: number;
    totalImages: number;
    hasSSL: boolean;
    hasMetaViewport: boolean;
    hasStructuredData: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL required' },
        { status: 400 }
      );
    }

    // Valider l'URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Fetch la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to fetch website' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Parser le HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';

    const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)">/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];

    const imgMatches = html.match(/<img[^>]+>/gi) || [];
    const imagesWithoutAlt = imgMatches.filter(img => !img.match(/alt="[^"]*"/i)).length;

    const hasSSL = parsedUrl.protocol === 'https:';
    const hasMetaViewport = /<meta\s+name="viewport"/i.test(html);
    const hasStructuredData = /<script\s+type="application\/ld\+json"/i.test(html);

    const issues: AuditResult['issues'] = [];
    let score = 100;

    // Check Title
    if (!title) {
      issues.push({
        type: 'critical',
        title: 'Titre manquant',
        description: 'Votre page n\'a pas de titre (balise <title>)',
        suggestion: 'Ajoutez un titre de 30-60 caractères qui décrit votre page et contient vos mots-clés principaux',
        impact: 'Critique pour le SEO et l\'UX',
      });
      score -= 15;
    } else if (title.length < 30) {
      issues.push({
        type: 'warning',
        title: 'Titre trop court',
        description: `Votre titre a ${title.length} caractères. Idéal: 30-60.`,
        suggestion: `Ajoutez des détails: "${title} - [Description courte]"`,
        impact: 'Réduit l\'impact SEO et le CTR Google',
      });
      score -= 8;
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        title: 'Titre trop long',
        description: `Votre titre a ${title.length} caractères. Idéal: 30-60.`,
        suggestion: 'Raccourcissez en gardant les éléments essentiels',
        impact: 'Peut être coupé dans les résultats Google',
      });
      score -= 5;
    }

    // Check Meta Description
    if (!description) {
      issues.push({
        type: 'critical',
        title: 'Métadescription manquante',
        description: 'Vous n\'avez pas de métadescription',
        suggestion: 'Créez une description de 120-160 caractères qui invite au clic',
        impact: 'Critique pour le CTR Google',
      });
      score -= 12;
    } else if (description.length < 120) {
      issues.push({
        type: 'warning',
        title: 'Métadescription trop courte',
        description: `${description.length} caractères. Idéal: 120-160.`,
        suggestion: 'Développez avec des détails et un CTA',
        impact: 'Moins impactant sur le CTR',
      });
      score -= 6;
    } else if (description.length > 160) {
      issues.push({
        type: 'warning',
        title: 'Métadescription trop longue',
        description: `${description.length} caractères. Idéal: 120-160.`,
        suggestion: 'Raccourcissez pour éviter la coupure',
        impact: 'Peut être coupée dans Google',
      });
      score -= 4;
    }

    // Check H1
    if (h1Matches.length === 0) {
      issues.push({
        type: 'critical',
        title: 'H1 manquant',
        description: 'Votre page n\'a pas de titre H1',
        suggestion: 'Ajoutez 1 H1 principal au début de votre contenu',
        impact: 'Structure importante pour le SEO',
      });
      score -= 10;
    } else if (h1Matches.length > 1) {
      issues.push({
        type: 'warning',
        title: 'Plusieurs H1 détectés',
        description: `${h1Matches.length} H1 trouvés. Idéal: 1 seul.`,
        suggestion: 'Gardez 1 H1 principal, utilisez H2 pour les sections',
        impact: 'Confond les moteurs de recherche',
      });
      score -= 5;
    }

    // Check Images Alt Text
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'warning',
        title: `${imagesWithoutAlt} images sans alt text`,
        description: `${imagesWithoutAlt} sur ${imgMatches.length} images n'ont pas d'alt text`,
        suggestion: 'Décrivez chaque image avec un alt text pertinent et contenant des mots-clés',
        impact: 'Améliore l\'accessibilité et le SEO images',
      });
      score -= Math.min(8, imagesWithoutAlt);
    }

    // Check SSL
    if (!hasSSL) {
      issues.push({
        type: 'critical',
        title: 'Pas de HTTPS',
        description: 'Votre site n\'utilise pas HTTPS (SSL)',
        suggestion: 'Activez SSL/HTTPS (gratuit avec Let\'s Encrypt)',
        impact: 'Facteur de ranking important, sécurité',
      });
      score -= 10;
    }

    // Check Viewport Meta
    if (!hasMetaViewport) {
      issues.push({
        type: 'warning',
        title: 'Viewport meta manquante',
        description: 'Pas de meta viewport pour mobile',
        suggestion: 'Ajoutez: <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        impact: 'Nécessaire pour mobile-friendly',
      });
      score -= 8;
    }

    // Check Structured Data
    if (!hasStructuredData) {
      issues.push({
        type: 'info',
        title: 'Pas de schema.org',
        description: 'Aucun structured data (JSON-LD)',
        suggestion: 'Ajoutez du structured data pour améliorer les rich snippets (avis, prix, etc)',
        impact: 'Améliore l\'affichage dans les résultats',
      });
      score -= 3;
    }

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      score,
      url,
      title,
      description,
      issues,
      metrics: {
        titleLength: title.length,
        descriptionLength: description.length,
        h1Count: h1Matches.length,
        h2Count: h2Matches.length,
        imagesWithoutAlt,
        totalImages: imgMatches.length,
        hasSSL,
        hasMetaViewport,
        hasStructuredData,
      },
    } as AuditResult & { url: string; title: string; description: string });
  } catch (error) {
    console.error('Error auditing URL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any).message },
      { status: 500 }
    );
  }
}
