# Gearbox Fintech - Production Deployment Guide
**Last Updated:** 2026-01-06

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vercel/Netlify)                                  │
│  ├─ React + TypeScript                                      │
│  ├─ Vite build                                              │
│  ├─ PWA with Service Worker                                 │
│  └─ CDN distribution                                        │
│                                                              │
│  Backend (Railway/Render/Fly.io)                            │
│  ├─ Node.js + Express                                       │
│  ├─ tRPC API                                                │
│  ├─ Webhook handlers                                        │
│  └─ Background jobs                                         │
│                                                              │
│  Database (Turso/LibSQL)                                    │
│  ├─ Distributed SQLite                                      │
│  ├─ Edge replication                                        │
│  └─ Automatic backups                                       │
│                                                              │
│  Storage (Cloudflare R2)                                    │
│  ├─ DVI photos/videos                                       │
│  ├─ Invoice PDFs                                            │
│  └─ Part images                                             │
│                                                              │
│  External Services                                          │
│  ├─ Stripe (payments)                                       │
│  ├─ Xero (accounting)                                       │
│  ├─ Twilio (SMS)                                            │
│  ├─ SendGrid (email)                                        │
│  └─ Sentry (error tracking)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables
- [ ] All API keys obtained and tested
- [ ] Production database URL configured
- [ ] Encryption keys generated (32+ characters)
- [ ] JWT secret generated
- [ ] Webhook secrets configured
- [ ] CORS origins set correctly

### 2. Database
- [ ] Production database created (Turso recommended)
- [ ] Migrations run successfully
- [ ] Seed data loaded (optional)
- [ ] Backup strategy configured
- [ ] Connection pooling optimized

### 3. External Services
- [ ] Stripe account in production mode
- [ ] Xero app approved for production
- [ ] Twilio phone number verified
- [ ] SendGrid sender identity verified
- [ ] Cloudflare R2 bucket created

### 4. Security
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### 5. Performance
- [ ] Build optimized (code splitting)
- [ ] Images compressed
- [ ] CDN configured
- [ ] Caching headers set
- [ ] Database indexes created

### 6. Monitoring
- [ ] Sentry error tracking setup
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Log aggregation setup
- [ ] Alerts configured

---

## 🔧 DEPLOYMENT STEPS

### Option A: Vercel + Railway (RECOMMENDED)

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd c:/projects/Gearbox\ Fintech/rebuilt
vercel --prod
```

4. **Configure Environment Variables in Vercel Dashboard**
- Go to Project Settings → Environment Variables
- Add all frontend env vars:
  - `VITE_API_URL`
  - `VITE_STRIPE_PUBLIC_KEY`
  - etc.

5. **Configure Custom Domain**
- Add domain in Vercel dashboard
- Update DNS records
- Enable automatic HTTPS

#### Backend Deployment (Railway)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd c:/projects/Gearbox\ Fintech/rebuilt
railway init
```

4. **Add Environment Variables**
```bash
railway variables set DATABASE_URL="libsql://..."
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set TWILIO_ACCOUNT_SID="..."
# ... add all backend env vars
```

5. **Deploy**
```bash
railway up
```

6. **Configure Domain**
```bash
railway domain
```

---

### Option B: Netlify + Render

#### Frontend (Netlify)

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Deploy**
```bash
cd c:/projects/Gearbox\ Fintech/rebuilt
netlify deploy --prod
```

#### Backend (Render)

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repo
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment: Node
5. Add environment variables
6. Deploy

---

### Option C: Fly.io (Full Stack)

1. **Install Fly CLI**
```bash
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. **Login**
```bash
fly auth login
```

3. **Launch App**
```bash
cd c:/projects/Gearbox\ Fintech/rebuilt
fly launch
```

4. **Set Secrets**
```bash
fly secrets set DATABASE_URL="libsql://..."
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
# ... add all secrets
```

5. **Deploy**
```bash
fly deploy
```

---

## 🗄️ DATABASE SETUP (Turso)

### 1. Create Turso Account
```bash
# Install Turso CLI
powershell -Command "iwr https://get.tur.so/install.ps1 -useb | iex"

# Login
turso auth login

# Create database
turso db create gearbox-prod --location syd

# Get connection URL
turso db show gearbox-prod --url

# Create auth token
turso db tokens create gearbox-prod
```

### 2. Run Migrations
```bash
# Set DATABASE_URL
$env:DATABASE_URL = "libsql://gearbox-prod-xxx.turso.io?authToken=xxx"

# Run migrations
npm run db:push
```

### 3. Configure Backups
```bash
# Enable automatic backups (daily)
turso db backup gearbox-prod --schedule daily
```

---

## 📦 CLOUDFLARE R2 SETUP

### 1. Create R2 Bucket
1. Go to Cloudflare Dashboard
2. Navigate to R2
3. Create bucket: `gearbox-media`
4. Configure CORS:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Generate API Tokens
1. Go to R2 → Manage R2 API Tokens
2. Create token with:
   - Permissions: Read & Write
   - Bucket: gearbox-media
3. Save Access Key ID and Secret Access Key

### 3. Configure Environment
```bash
S3_ACCESS_KEY_ID=your_r2_access_key
S3_SECRET_ACCESS_KEY=your_r2_secret_key
S3_BUCKET_NAME=gearbox-media
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_REGION=auto
```

---

## 🔔 WEBHOOK CONFIGURATION

### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret
5. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Xero Webhooks

1. Go to Xero Developer Portal
2. Navigate to your app → Webhooks
3. Add webhook URL: `https://api.yourdomain.com/api/webhooks/xero`
4. Generate webhook key
5. Add to environment: `XERO_WEBHOOK_KEY=...`
6. Subscribe to events:
   - `INVOICE` (create, update)
   - `PAYMENT` (create)

---

## 🔐 SSL/TLS CERTIFICATES

### Automatic (Recommended)
- Vercel/Netlify: Automatic Let's Encrypt
- Railway: Automatic SSL
- Fly.io: Automatic SSL

### Manual (if needed)
```bash
# Using Certbot
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

---

## 📊 MONITORING SETUP

### 1. Sentry (Error Tracking)

```bash
npm install @sentry/react @sentry/node
```

**Frontend (src/main.tsx)**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

**Backend (src/server/index.ts)**
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: "production",
});
```

### 2. Uptime Monitoring

**UptimeRobot (Free)**
1. Go to https://uptimerobot.com
2. Add monitors:
   - Frontend: https://yourdomain.com
   - Backend: https://api.yourdomain.com/health
   - Interval: 5 minutes
3. Configure alerts (email, SMS)

### 3. Performance Monitoring

**Vercel Analytics (Built-in)**
- Automatically enabled on Vercel
- View in Vercel Dashboard

**Custom (optional)**
```typescript
// Add to src/lib/analytics.ts
export function trackPageView(url: string) {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
}
```

---

## 🧪 TESTING BEFORE LAUNCH

### 1. Smoke Tests
```bash
# Test frontend build
npm run build
npm run preview

# Test backend
npm run start

# Test database connection
npm run db:test
```

### 2. Integration Tests
- [ ] Booking widget creates booking in DB
- [ ] DVI approval updates status
- [ ] Invoice syncs to Xero
- [ ] Payment webhook updates invoice
- [ ] Email/SMS notifications sent
- [ ] File upload to R2 works
- [ ] Offline mode syncs when online

### 3. Load Testing
```bash
# Install k6
choco install k6

# Run load test
k6 run loadtest.js
```

---

## 🚦 GO-LIVE CHECKLIST

### Day Before Launch
- [ ] Final backup of database
- [ ] Test all critical paths
- [ ] Verify all webhooks
- [ ] Check error monitoring
- [ ] Prepare rollback plan
- [ ] Notify team

### Launch Day
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Run smoke tests
- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Test critical workflows
- [ ] Announce launch

### Post-Launch (First 24h)
- [ ] Monitor error rates
- [ ] Check webhook delivery
- [ ] Verify email/SMS sending
- [ ] Monitor database performance
- [ ] Check payment processing
- [ ] Collect user feedback

---

## 🔄 ROLLBACK PROCEDURE

### If Critical Issue Found

1. **Revert Frontend**
```bash
vercel rollback
```

2. **Revert Backend**
```bash
railway rollback
```

3. **Restore Database** (if needed)
```bash
turso db restore gearbox-prod --from backup-timestamp
```

4. **Notify Users**
- Post status update
- Send email to active users
- Update social media

---

## 📈 SCALING STRATEGY

### When to Scale

**Frontend**
- Automatic scaling on Vercel/Netlify
- No action needed

**Backend**
- Scale when CPU > 70% sustained
- Scale when memory > 80%
- Scale when response time > 500ms

**Database**
- Turso scales automatically
- Monitor connection pool usage
- Add read replicas if needed

### How to Scale

**Railway**
```bash
railway scale --replicas 3
```

**Fly.io**
```bash
fly scale count 3
```

---

## 💰 ESTIMATED COSTS (Monthly)

| Service | Tier | Cost |
|:---|:---|---:|
| Vercel (Frontend) | Pro | $20 |
| Railway (Backend) | Hobby | $5 |
| Turso (Database) | Starter | $29 |
| Cloudflare R2 (Storage) | Pay-as-you-go | ~$5 |
| Stripe | Transaction fees | 2.9% + 30¢ |
| Twilio (SMS) | Pay-as-you-go | ~$50 |
| SendGrid (Email) | Essentials | $20 |
| Sentry (Monitoring) | Team | $26 |
| **TOTAL** | | **~$155/month** |

*Scales with usage. Estimate for 50 active workshops.*

---

## ✅ DEPLOYMENT COMPLETE!

Your Gearbox Fintech platform is now live at:
- **Frontend:** https://yourdomain.com
- **Backend:** https://api.yourdomain.com
- **Status:** https://status.yourdomain.com

**Next Steps:**
1. Monitor for 24 hours
2. Collect user feedback
3. Iterate and improve
4. Scale as needed

🎉 **Congratulations on launching!**
