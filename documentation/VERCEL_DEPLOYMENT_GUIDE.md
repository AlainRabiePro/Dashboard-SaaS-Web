# 🚀 Vercel Production Deployment Guide

## Prerequisites
- [ ] Vercel account (free tier OK)
- [ ] GitHub repository connected to Vercel
- [ ] Stripe account (live or test)
- [ ] IONOS account with API credentials
- [ ] Firebase project with API keys

---

## Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "feat: Add production-ready domain reselling system with logging and rate limiting"
git push origin main
```

---

## Step 2: Configure Environment Variables in Vercel

### 2.1 Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** → **Environment Variables**

### 2.2 Add Variables

Add each variable below with the **Production** environment selected:

#### Firebase Configuration (Public - can be client-side)
```
NEXT_PUBLIC_FIREBASE_API_KEY = <your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = <your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = <your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = <your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = <your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID = <your-app-id>
```

#### Stripe Configuration (Secrets - production keys)
```
STRIPE_PUBLIC_KEY = pk_live_... (or pk_test_... for testing)
STRIPE_SECRET_KEY = sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET = whsec_... (from webhook endpoint)
```

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API keys"
3. Copy "Publishable key" → Paste as `STRIPE_PUBLIC_KEY`
4. Click "Reveal test key" → Copy "Secret key" → Paste as `STRIPE_SECRET_KEY`

#### IONOS Configuration (Secrets)
```
IONOS_API_KEY = <your-client-id>
IONOS_API_SECRET = <your-client-secret>
```

**You already have these from setup.**

#### Registrar Selection
```
DOMAIN_REGISTRAR = ionos
```

#### Application Configuration
```
NEXT_PUBLIC_APP_URL = https://<your-domain>.com
NODE_ENV = production
```

### 2.3 Verify All Variables

Click each variable to confirm it's correct, then **Save**.

---

## Step 3: Deploy to Production

### Option A: Automatic Deployment (Recommended)
```bash
# Just push to main branch - Vercel auto-deploys
git push origin main
```

Your deployment will start automatically. Watch progress in Vercel Dashboard.

### Option B: Manual Deployment
1. Go to Vercel Dashboard
2. Click **Deployments**
3. Click **Deploy** button (if available)

### Option C: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## Step 4: Configure Stripe Webhooks for Production

### 4.1 Get Your Production URL

After deployment, Vercel shows your domain:
```
https://your-project-name.vercel.app
```
Or your custom domain if configured.

### 4.2 Add Webhook to Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Endpoint URL:
   ```
   https://your-domain.com/api/webhooks/domains
   ```
5. Events to send:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.payment_failed`
6. Click **Add endpoint**
7. Click your endpoint → **Reveal** signing secret
8. Copy signing secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

### 4.3 Test Webhook

```bash
# Once webhook is configured, test it
curl -X POST https://your-domain.com/api/webhooks/domains \
  -H "Content-Type: application/json" \
  -d '{"type": "ping"}'
```

Expected response:
```json
{"received": true}
```

---

## Step 5: Verify Production Deployment

### 5.1 Health Check

```bash
# Replace with your domain
curl https://your-domain.com/api/health
```

### 5.2 Test Domain Search

```bash
curl https://your-domain.com/api/domains/search?keyword=test \
  -H "x-user-id: test-user"
```

### 5.3 Test Authentication

```bash
# Should return 401 without x-user-id header
curl https://your-domain.com/api/domains/order
```

### 5.4 Monitor Logs

1. Go to Vercel Dashboard
2. Click your project
3. Click **Deployments**
4. Click latest deployment
5. Click **Logs** tab
6. Watch real-time logs

---

## Step 6: Set Up Monitoring & Alerts

### 6.1 Sentry Integration (Error Tracking)

1. Create [Sentry account](https://sentry.io)
2. Create new project → Select Node.js
3. Copy Sentry DSN
4. Add to Vercel:
   ```
   SENTRY_DSN = https://...@sentry.io/...
   ```
5. Update [src/lib/logger.ts](../src/lib/logger.ts) to integrate Sentry:

```typescript
import * as Sentry from "@sentry/nextjs";

const logger = createLogger('domains/order');

// In catch blocks:
catch (error: any) {
  logger.error('Error message', { error: error.message });
  Sentry.captureException(error);
}
```

### 6.2 Stripe Monitoring

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Events** → View webhook deliveries
3. Set up [Stripe email alerts](https://dashboard.stripe.com/settings/notifications)

### 6.3 Firebase Monitoring

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click your project
3. **Analytics** → Monitor reads/writes
4. **Firestore** → Check database size

---

## Step 7: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard
2. Click your project → **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS setup instructions
5. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your custom domain

---

## Step 8: Enable HTTPS & Security

Vercel automatically provides:
- ✅ HTTPS with Let's Encrypt (free)
- ✅ DDoS protection
- ✅ Web Application Firewall

No additional configuration needed.

---

## Step 9: Performance Optimization

### Enable Caching
Create `vercel.json` at project root:
```json
{
  "headers": [
    {
      "source": "/api/domains/search",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300"
        }
      ]
    }
  ]
}
```

### Monitor Build Performance
1. Vercel Dashboard → **Deployments**
2. Click deployment → **Output**
3. Check build time and bundle size

---

## Step 10: Daily Operations Checklist

### Every Morning
- [ ] Check Vercel deployment status
- [ ] Review error logs in Sentry
- [ ] Check Stripe dashboard for failed payments
- [ ] Monitor Firestore usage

### Every Week
- [ ] Review Firebase cost estimate
- [ ] Check IONOS registrations (if applicable)
- [ ] Test payment flow with test card
- [ ] Monitor rate limiting metrics

### Every Month
- [ ] Review production logs for patterns
- [ ] Backup Firestore data
- [ ] Check Stripe fraud reports
- [ ] Update dependencies

---

## Troubleshooting

### Issue: "NEXT_PUBLIC_APP_URL is invalid"

**Solution:** Add `NEXT_PUBLIC_APP_URL` to Vercel env vars:
```
NEXT_PUBLIC_APP_URL = https://your-domain.com
```

Make sure it doesn't include `localhost` or `http://` protocol issues.

### Issue: Stripe webhook not triggering

**Solution:** 
1. Verify webhook URL in Stripe dashboard is correct
2. Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
3. View webhook deliveries in Stripe dashboard
4. Check Vercel logs for webhook handler errors

### Issue: IONOS domain registration failing

**Solution:**
1. Verify `IONOS_API_KEY` and `IONOS_API_SECRET` in Vercel
2. Check IONOS API quota/limits
3. Verify domain is available and allowed by IONOS
4. Check Vercel logs for IONOS API errors

### Issue: Rate limiting too strict

**Solution:** Adjust limits in API routes:
```typescript
checkRateLimit(identifier, {
  windowMs: 60 * 1000,
  maxRequests: 20  // Increase this number
});
```

### Issue: Build failing in Vercel

**Solution:**
1. Go to Vercel → **Deployments**
2. Click failed deployment → **Output**
3. Check error message
4. Common fixes:
   - Missing environment variables
   - TypeScript errors
   - Import errors

---

## Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] Firebase API keys added
- [ ] Stripe keys added (live keys for production)
- [ ] IONOS credentials added
- [ ] Stripe webhooks configured for production domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Custom domain configured (optional)
- [ ] Sentry integration set up
- [ ] Monitoring alerts enabled
- [ ] Backup strategy configured
- [ ] Runbook created for common issues
- [ ] Team has access to Vercel dashboard
- [ ] Documentation updated

---

## Contact Support

- **Vercel Issues:** [Vercel Support](https://vercel.com/support)
- **Stripe Issues:** [Stripe Support](https://support.stripe.com)
- **Firebase Issues:** [Firebase Support](https://firebase.google.com/support)
- **IONOS Issues:** IONOS Support Portal

---

**Last Updated:** March 5, 2026
**Status:** ✅ Production Ready
