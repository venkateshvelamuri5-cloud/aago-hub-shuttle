# AAGO Hub - Setup & Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm installed
- Razorpay account (https://razorpay.com)
- Firebase project configured
- Git for version control

---

## 📝 Step 1: Environment Configuration

### Create `.env.local` file

Create a new file `.env.local` in the project root:

```env
# ============================================
# RAZORPAY CONFIGURATION (from Razorpay Dashboard)
# ============================================

# This is your PUBLIC key - safe to expose to frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID_HERE

# This is your SECRET key - NEVER expose to frontend
# Keep this secure and only in .env.local (never commit to git)
RAZORPAY_KEY_SECRET=your_secret_key_here

# ============================================
# FIREBASE CONFIGURATION (from Firebase Console)
# ============================================

NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef1234567890

# ============================================
# APPLICATION ENVIRONMENT
# ============================================

NODE_ENV=development
```

### Get Your Razorpay Keys

1. Go to **Razorpay Dashboard**: https://dashboard.razorpay.com
2. Navigate to **Settings > API Keys**
3. Copy your **Key ID** and **Key Secret**
4. For testing, use **Test Mode** keys first

### Get Your Firebase Credentials

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project
3. Go to **Project Settings** (⚙️ icon)
4. Scroll to **Your apps** section
5. Copy the Firebase config object
6. Fill in the NEXT_PUBLIC_FIREBASE_* variables

---

## 🔐 Step 2: Security Setup

### Add to `.gitignore`

Make sure these lines are in your `.gitignore` file:

```gitignore
# Environment variables (NEVER commit these)
.env
.env.local
.env.*.local
.env.production.local

# Avoid accidentally committing secrets
!.env.example
```

### Verify `.env.local` is ignored

```bash
# Check if .env.local is properly ignored
git check-ignore .env.local
# Should output: .env.local
```

---

## 🛠️ Step 3: Installation & Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Test Razorpay Integration

1. Go to the **Student Dashboard**: http://localhost:3000/student
2. Try to book a ride
3. Complete the booking and proceed to payment
4. You should see the Razorpay payment modal
5. Use **test card numbers** for testing:
   - Visa: `4111 1111 1111 1111`
   - Mastercard: `5555 5555 5555 4444`
   - Any future expiry and any CVV

### Verify Payment Flow

```bash
# Test order creation
curl -X POST http://localhost:3000/api/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "INR",
    "receipt": "test_receipt"
  }'

# Expected response (order created successfully):
{
  "id": "order_XXX",
  "entity": "order",
  "amount": 5000,
  "currency": "INR",
  "status": "created",
  "keyId": "rzp_live_YOUR_KEY"
}
```

---

## 📦 Step 4: Build for Production

### Type Check

```bash
npm run typecheck
```

### Build Application

```bash
npm run build
```

This will:
- Check for TypeScript errors
- Optimize all components
- Build static assets
- Verify environment variables are set

### Run Production Build Locally

```bash
npm run build
npm start
```

The app will run at `http://localhost:3000`

---

## 🚀 Step 5: Deploy to Production

### Deploy to Vercel (Recommended)

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
4. Vercel auto-deploys on git push

### Deploy to Other Platforms

#### Firebase Hosting

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

#### AWS Amplify

```bash
# Install Amplify CLI
npm i -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify push
```

#### Docker (Self-hosted)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🔍 Step 6: Post-Deployment Verification

### Health Checks

```bash
# Test homepage loads
curl https://your-domain.com/

# Test API endpoints
curl https://your-domain.com/api/create-order \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'

# Check environment (should not expose secrets)
# Never access /api/create-order from browser dev tools
```

### Monitor Payment Processing

1. Go to **Razorpay Dashboard**
2. Check **Transactions > Payments**
3. Verify test payments appear there
4. Switch to **Live Mode** when ready for real transactions

### Set Up Alerts

- **Payment Failures**: Enable email alerts in Razorpay Dashboard
- **Application Errors**: Set up error tracking (Sentry, LogRocket)
- **Payment Analytics**: Use Razorpay Reports dashboard

---

## 🔄 Step 7: Continuous Integration/Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Typecheck
        run: npm run typecheck
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: ${{ github.ref == 'refs/heads/main' }}
```

---

## 🐛 Troubleshooting

### Issue: "RAZORPAY_KEY_SECRET is not defined"

**Solution**:
```bash
# Make sure .env.local exists and is set
echo "RAZORPAY_KEY_SECRET=your_key" > .env.local

# Restart dev server
npm run dev
```

### Issue: "Razorpay payment modal doesn't appear"

**Checklist**:
- [ ] Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set in `.env.local`
- [ ] Check browser console for errors (F12 > Console)
- [ ] Ensure order creation returned successfully (check Network tab)
- [ ] Verify you're not in production mode with test keys

### Issue: "Payment verification fails"

**Debug**:
```bash
# Check if secret key matches
echo $RAZORPAY_KEY_SECRET

# Verify order was created correctly
curl http://localhost:3000/api/create-order \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'
```

### Issue: Deployment fails with "Build error"

**Solution**:
```bash
# Check for TypeScript errors
npm run typecheck

# Check all env vars are set
vercel env pull  # For Vercel

# Try build locally
npm run build
```

---

## 📊 Monitoring & Maintenance

### Regular Tasks

- **Weekly**: Check Razorpay dashboard for failed payments
- **Monthly**: Review application logs and error reports
- **Quarterly**: Update dependencies (`npm update`)
- **Yearly**: Security audit and penetration testing

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update to latest major versions (use with caution)
npm upgrade
```

### Database Backups

- **Firebase**: Automatic (enable Point-in-Time Recovery)
- **Firestore**: Export regularly (`firebase firestore:export`)

---

## 📞 Support & Resources

### Documentation
- **Razorpay API**: https://razorpay.com/docs/api/
- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Guide**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Community
- **Razorpay Community**: https://community.razorpay.com
- **Firebase Community**: https://firebase.community
- **Next.js Discord**: https://nextjs.org/discord

### Emergency Support
- **Razorpay Support**: https://support.razorpay.com
- **Firebase Support**: https://firebase.google.com/support
- **Application Issues**: Check GitHub Issues

---

## ✅ Deployment Checklist

- [ ] `.env.local` created with all required variables
- [ ] `.env.local` is in `.gitignore`
- [ ] Razorpay keys are regenerated (old ones deactivated)
- [ ] Firebase credentials verified
- [ ] `npm run build` succeeds locally
- [ ] Payment flow tested in development
- [ ] All environment variables set in production platform
- [ ] SSL/HTTPS enabled on production domain
- [ ] Error logging configured
- [ ] Payment alerts enabled in Razorpay
- [ ] Backup strategy implemented
- [ ] Monitoring and analytics enabled

---

**Last Updated**: May 3, 2026  
**Version**: 1.0  
**Status**: Ready for Production