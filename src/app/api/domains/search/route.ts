import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour vérifier la disponibilité d'un domaine
 * Utilise plusieurs méthodes : WHOIS, DNS, et vérification registrar
 */

// Cache simple pour éviter les requêtes répétées (5 minutes)
const domainCache = new Map<string, { available: boolean; error?: string; timestamp: number }>();

// Vérifier via RapidAPI WHOIS (meilleure solution)
async function checkDomainViaRapidAPI(domain: string): Promise<{ available: boolean; error?: string }> {
  try {
    const response = await fetch(`https://whois-api.whoisxmlapi.com/api/v1?domain=${domain}&apiKey=${process.env.WHOIS_API_KEY || ''}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return checkDomainViaDns(domain);
    }

    const data = await response.json();
    
    // Si la réponse contient un registrant, le domaine est pris
    if (data.registrant || data.registrarName) {
      return { available: false, error: 'Le domaine est déjà enregistré' };
    }

    return { available: true };
  } catch (error) {
    console.log('RapidAPI WHOIS non disponible, essai DNS...');
    return checkDomainViaDns(domain);
  }
}

// Vérification via DNS résolution
async function checkDomainViaDns(domain: string): Promise<{ available: boolean; error?: string }> {
  try {
    const dns = require('dns').promises;
    
    try {
      // Tenter de résoudre le domaine
      const addresses = await dns.lookup(domain);
      // Si on arrive ici, le domaine existe
      return { available: false, error: 'Le domaine est déjà enregistré' };
    } catch (dnsError: any) {
      // Si erreur ENOTFOUND, le domaine n'existe pas
      if (dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA' || dnsError.errno === -3001) {
        return { available: true };
      }
      // Autres erreurs DNS (timeouts, etc) - considérer comme disponible
      console.log(`DNS error for ${domain}: ${dnsError.code}`);
      return { available: true };
    }
  } catch (error: any) {
    console.error('Erreur DNS:', error.message);
    // En cas d'erreur, on retourne comme disponible
    return { available: true };
  }
}

// Vérification via requête HTTP (registrar check)
async function checkDomainViaRegistrar(domain: string): Promise<{ available: boolean; error?: string }> {
  try {
    // Vérifier les registrars courants
    const registrars = [
      `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${domain}`,
      `https://www.namecheap.com/?domain=${domain}`,
    ];

    for (const url of registrars) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        
        if (response.ok) {
          const text = await response.text();
          // Patterns simples pour détecter la disponibilité
          if (text.includes('available') || text.includes('Disponible')) {
            return { available: true };
          }
          if (text.includes('already taken') || text.includes('not available')) {
            return { available: false, error: 'Le domaine est déjà enregistré' };
          }
        }
      } catch (e) {
        continue; // Essai suivant
      }
    }

    // Fallback DNS
    return checkDomainViaDns(domain);
  } catch (error: any) {
    console.error('Erreur vérification registrar:', error.message);
    return { available: true };
  }
}

// Vérification complète avec cache
async function checkDomainAvailability(domain: string): Promise<{ available: boolean; error?: string }> {
  try {
    // Normaliser le domaine
    const cleanDomain = domain.toLowerCase().trim();
    
    // Vérifier le format du domaine
    if (!cleanDomain.includes('.')) {
      return { available: false, error: 'Format de domaine invalide' };
    }

    // Vérifier le cache
    const cached = domainCache.get(cleanDomain);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log(`✅ Cache hit pour ${cleanDomain}`);
      return { available: cached.available, error: cached.error };
    }

    console.log(`🔍 Vérification complète de ${cleanDomain}...`);

    // Essayer plusieurs méthodes
    let result = await checkDomainViaRapidAPI(cleanDomain);
    
    if (!result.available) {
      // Domaine pris confirmé, pas besoin de vérifier plus
      domainCache.set(cleanDomain, { ...result, timestamp: Date.now() });
      return result;
    }

    // Le domaine semble disponible, confirmer via DNS
    result = await checkDomainViaDns(cleanDomain);
    
    // Mettre en cache
    domainCache.set(cleanDomain, { ...result, timestamp: Date.now() });
    
    return result;
  } catch (error: any) {
    console.error('Erreur lors de la vérification du domaine:', error.message);
    return { available: false, error: 'Impossible de vérifier la disponibilité du domaine' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Paramètre "domain" requis' },
        { status: 400 }
      );
    }

    // Valider le format basique du domaine
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Format de domaine invalide (ex: example.com)', domain, available: false },
        { status: 400 }
      );
    }

    // Vérifier la disponibilité
    console.log(`🔍 Vérification de la disponibilité de ${domain}...`);
    const availability = await checkDomainAvailability(domain);

    // Réponse avec cache headers
    return NextResponse.json(
      {
        domain,
        available: availability.available,
        error: availability.error,
        checked_at: new Date().toISOString(),
        message: availability.available 
          ? '✅ Domaine disponible!' 
          : '❌ Domaine non disponible',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache 5 minutes
        },
      }
    );
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la vérification',
        available: null,
      },
      { status: 500 }
    );
  }
}
