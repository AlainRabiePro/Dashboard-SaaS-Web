/**
 * Gestion de l'enregistrement de domaines auprès de registrars
 * 
 * Implémentations supports:
 * - Namecheap (recommandé)
 * - Gandi
 * - ResellerClub
 */

export interface DomainRegistrationResult {
  success: boolean;
  registrarOrderId?: string;
  registrarName?: string;
  registrarResponse?: any;
  error?: string;
}

/**
 * Enregistrement auprès de Namecheap
 * 
 * @see https://www.namecheap.com/support/api/
 */
export async function registerDomainNamecheap(
  domain: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<DomainRegistrationResult> {
  try {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const apiUser = process.env.NAMECHEAP_API_USER;
    const username = process.env.NAMECHEAP_USERNAME;
    const clientIP = process.env.NAMECHEAP_CLIENT_IP || 'localhost';

    if (!apiKey || !apiUser || !username) {
      throw new Error('Namecheap API credentials missing');
    }

    // Exemple de requête - ajuster selon les champs requis par votre registrar
    const params = new URLSearchParams({
      ApiUser: apiUser,
      ApiKey: apiKey,
      UserName: username,
      Command: 'namecheap.domains.create',
      Domain: domain,
      Years: '1',
      RegistrantFirstName: userName?.split(' ')[0] || 'User',
      RegistrantLastName: userName?.split(' ')[1] || 'Account',
      RegistrantOrganizationName: 'User',
      RegistrantAddress1: '123 Main St',
      RegistrantCity: 'City',
      RegistrantStateProvince: 'State',
      RegistrantPostalCode: '12345',
      RegistrantCountry: 'US',
      RegistrantPhone: '+1.1234567890',
      RegistrantEmailAddress: userEmail,
      AdminFirstName: userName?.split(' ')[0] || 'User',
      AdminLastName: userName?.split(' ')[1] || 'Account',
      AdminOrganizationName: 'User',
      AdminAddress1: '123 Main St',
      AdminCity: 'City',
      AdminStateProvince: 'State',
      AdminPostalCode: '12345',
      AdminCountry: 'US',
      AdminPhone: '+1.1234567890',
      AdminEmailAddress: userEmail,
      TechFirstName: userName?.split(' ')[0] || 'User',
      TechLastName: userName?.split(' ')[1] || 'Account',
      TechOrganizationName: 'User',
      TechAddress1: '123 Main St',
      TechCity: 'City',
      TechStateProvince: 'State',
      TechPostalCode: '12345',
      TechCountry: 'US',
      TechPhone: '+1.1234567890',
      TechEmailAddress: userEmail,
      BillingFirstName: userName?.split(' ')[0] || 'User',
      BillingLastName: userName?.split(' ')[1] || 'Account',
      BillingOrganizationName: 'User',
      BillingAddress1: '123 Main St',
      BillingCity: 'City',
      BillingStateProvince: 'State',
      BillingPostalCode: '12345',
      BillingCountry: 'US',
      BillingPhone: '+1.1234567890',
      BillingEmailAddress: userEmail,
      ClientIP: clientIP,
    });

    const response = await fetch(`https://api.namecheap.com/api/xml?${params}`);
    const text = await response.text();

    console.log(`📝 Namecheap response for ${domain}:`, text.substring(0, 500));

    // Vérifier si successful
    if (text.includes('true') && text.includes('OrderID')) {
      // Parser le XML pour extraire l'OrderID
      const orderIdMatch = text.match(/<OrderID>(\d+)<\/OrderID>/);
      const orderId = orderIdMatch ? orderIdMatch[1] : `NC-${Date.now()}`;

      return {
        success: true,
        registrarOrderId: orderId,
        registrarName: 'Namecheap',
        registrarResponse: text,
      };
    }

    return {
      success: false,
      error: 'Namecheap registration failed - check response',
      registrarResponse: text,
    };
  } catch (error: any) {
    console.error('Namecheap registration error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enregistrement auprès de Gandi
 * 
 * @see https://doc.livedns.gandi.net/
 */
export async function registerDomainGandi(
  domain: string,
  userId: string,
  userEmail: string
): Promise<DomainRegistrationResult> {
  try {
    const apiKey = process.env.GANDI_API_KEY;

    if (!apiKey) {
      throw new Error('Gandi API key missing');
    }

    const [name, ext] = domain.split('.');
    const tld = ext;

    // Créer une commande de domaine
    const response = await fetch('https://api.gandi.net/v5/organization/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            product_name: `domain_registration_${tld}_1_year`,
            quantity: 1,
            params: {
              domain: {
                name: name,
                tld: tld,
              },
              owner: {
                given_name: 'User',
                family_name: 'Account',
                email: userEmail,
                country: 'US',
                addr: '123 Main St',
                city: 'City',
                state: 'State',
                zip: '12345',
              },
              admin: {},
              tech: {},
              billing: {},
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return {
        success: true,
        registrarOrderId: data.id.toString(),
        registrarName: 'Gandi',
        registrarResponse: data,
      };
    }

    return {
      success: false,
      error: data.message || 'Gandi registration failed',
      registrarResponse: data,
    };
  } catch (error: any) {
    console.error('Gandi registration error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enregistrement auprès de IONOS
 * 
 * @see https://api.ionos.com/domains
 */
export async function registerDomainIonos(
  domain: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<DomainRegistrationResult> {
  try {
    const apiKey = process.env.IONOS_API_KEY;
    const apiSecret = process.env.IONOS_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('IONOS API credentials missing');
    }

    // Obtenir le token d'accès
    const authResponse = await fetch('https://api.hosting.ionos.fr/auth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    if (!authResponse.ok) {
      throw new Error('IONOS authentication failed');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Diviser le domaine en nom et TLD
    const parts = domain.split('.');
    const name = parts.slice(0, -1).join('.');
    const tld = parts[parts.length - 1];

    // Créer la commande de domaine
    const orderResponse = await fetch('https://api.hosting.ionos.fr/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            domainName: domain,
            quantity: 1,
            duration: 12, // 1 an
          },
        ],
        owner: {
          firstName: userName?.split(' ')[0] || 'User',
          lastName: userName?.split(' ')[1] || 'Account',
          email: userEmail,
          address: '123 Main St',
          postalCode: '75001',
          city: 'Paris',
          countryCode: 'FR',
        },
        admin: {
          firstName: userName?.split(' ')[0] || 'User',
          lastName: userName?.split(' ')[1] || 'Account',
          email: userEmail,
          address: '123 Main St',
          postalCode: '75001',
          city: 'Paris',
          countryCode: 'FR',
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (orderResponse.ok && orderData.orderId) {
      return {
        success: true,
        registrarOrderId: orderData.orderId.toString(),
        registrarName: 'IONOS',
        registrarResponse: orderData,
      };
    }

    return {
      success: false,
      error: orderData.message || 'IONOS registration failed',
      registrarResponse: orderData,
    };
  } catch (error: any) {
    console.error('IONOS registration error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fonction générique pour enregistrer un domaine
 * Utilise le registrar configuré dans les variables d'environnement
 */
export async function registerDomain(
  domain: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<DomainRegistrationResult> {
  const registrar = process.env.DOMAIN_REGISTRAR || 'ionos';

  console.log(`📝 Registering domain ${domain} with ${registrar}`);

  switch (registrar.toLowerCase()) {
    case 'ionos':
      return registerDomainIonos(domain, userId, userEmail, userName);

    case 'gandi':
      return registerDomainGandi(domain, userId, userEmail);

    case 'namecheap':
      return registerDomainNamecheap(domain, userId, userEmail, userName);

    case 'mock':
      // Mode test - simule l'enregistrement
      return {
        success: true,
        registrarOrderId: `MOCK-${Date.now()}`,
        registrarName: 'Mock (Test)',
      };

    default:
      return {
        success: false,
        error: `Unknown registrar: ${registrar}`,
      };
  }
}
