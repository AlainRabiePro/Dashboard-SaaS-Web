# 🎯 Configuration pour la Revente de Domaines

## 1️⃣ Configuration Stripe

### Créer les webhooks
1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. **Add endpoint** avec l'URL:
   ```
   https://votresite.com/api/webhooks/domains
   ```
4. Sélectionnez les événements:
   - `checkout.session.completed` ✅
   - `payment_intent.payment_failed` ✅

5. Copiez le **Signing Secret** et mettez-le dans `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## 2️⃣ Choisir un Registrar de Domaines

### Options recommandées:

#### **Namecheap** (Recommandé - API simple)
- Site: https://namecheap.com
- API Docs: https://www.namecheap.com/support/api/
- Configuration:
  ```bash
  NAMECHEAP_API_KEY=xxxxx
  NAMECHEAP_USER=xxxxx
  NAMECHEAP_IP_WHITELIST=your_server_ip
  ```

#### **Gandi** (Plus cher mais fiable)
- Site: https://www.gandi.net
- API Docs: https://doc.livedns.gandi.net/
- Configuration:
  ```bash
  GANDI_API_KEY=xxxxx
  ```

#### **ResellerClub** (API avancée)
- Site: https://www.resellerclub.com
- API Docs: https://kb.resellerclub.com/
- Configuration:
  ```bash
  RESELLERCLUB_API_KEY=xxxxx
  RESELLERCLUB_USER_ID=xxxxx
  ```

## 3️⃣ Intégrer l'API du Registrar

### Exemple avec Namecheap (dans `src/lib/domain-registrar.ts`):

```typescript
import axios from 'axios';

export async function registerDomainNamecheap(
  domain: string,
  userId: string,
  userEmail: string
) {
  const params = {
    ApiUser: process.env.NAMECHEAP_API_USER,
    ApiKey: process.env.NAMECHEAP_API_KEY,
    UserName: process.env.NAMECHEAP_USERNAME,
    Command: 'namecheap.domains.create',
    Domain: domain,
    Years: '1',
    RegistrantFirstName: 'User',
    RegistrantLastName: 'Account',
    RegistrantOrganizationName: 'User',
    RegistrantAddress1: '123 Main St',
    RegistrantCity: 'City',
    RegistrantStateProvince: 'State',
    RegistrantPostalCode: '12345',
    RegistrantCountry: 'US',
    RegistrantPhone: '+1.1234567890',
    RegistrantEmailAddress: userEmail,
    RegistrantFax: '+1.1234567890',
  };

  try {
    const response = await axios.get(
      'https://api.namecheap.com/api/xml',
      { params }
    );
    
    // Parser le XML et extraire l'OrderID
    const orderId = response.data.ApiResponse.CommandResponse[0]?.OrderID[0];
    
    return { success: true, registrarOrderId: orderId };
  } catch (error) {
    console.error('Namecheap API error:', error);
    return { success: false, error: error.message };
  }
}
```

## 4️⃣ Mettre à jour le Webhook

Dans `src/app/api/webhooks/domains/route.ts`, remplacez `registerDomainWithRegistrar()`:

```typescript
async function registerDomainWithRegistrar(
  userId: string,
  domain: string,
  userEmail: string
) {
  // Importer et appeler votre API de registrar
  // return await registerDomainNamecheap(domain, userId, userEmail);
}
```

## 5️⃣ Variables d'Environnement

Ajoutez à votre `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Registrar (Namecheap exemple)
NAMECHEAP_API_KEY=xxxxx
NAMECHEAP_API_USER=xxxxx
NAMECHEAP_USERNAME=xxxxx
NAMECHEAP_IP_WHITELIST=your_server_ip
```

## 6️⃣ Tests

### Test 1: Créer une commande
```bash
curl -X POST http://localhost:3000/api/domains/order \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"domain": "test.com", "price": 8.99}'
```

### Test 2: Créer une session de paiement
```bash
curl -X POST http://localhost:3000/api/domains/checkout \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -H "x-user-email: user@example.com" \
  -d '{"orderId": "xxx", "domain": "test.com", "price": 8.99}'
```

### Test 3: Simuler un webhook Stripe
Utiliser [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/domains
stripe trigger checkout.session.completed
```

## ✅ Checklist

- [ ] Compte Stripe créé et configuré
- [ ] Webhook Stripe configuré
- [ ] Registrar choisi
- [ ] API du registrar intégrée
- [ ] Variables d'environnement configurées
- [ ] Tests effectués
- [ ] Domaines testés en production
