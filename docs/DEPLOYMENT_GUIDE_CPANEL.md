# 🚀 CENTO E-Commerce Platform - Complete cPanel Deployment Guide

## 📋 Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Frontend Deployment to cPanel](#frontend-deployment-to-cpanel)
6. [Backend Deployment Strategy](#backend-deployment-strategy)
7. [GitHub Actions Automation](#github-actions-automation)
8. [Domain & DNS Configuration](#domain--dns-configuration)
9. [Post-Deployment Setup](#post-deployment-setup)
10. [Troubleshooting & Monitoring](#troubleshooting--monitoring)

---

## 🎯 Deployment Overview

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│   cPanel        │    │   Railway       │    │   Railway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     admin.cento-          api.cento          
      servizi.it           servizi.it
```

### Deployment Strategy
- **Frontend**: Next.js static export → cPanel hosting
- **Backend**: NestJS → Railway/Render (Node.js hosting)
- **Database**: PostgreSQL → Railway/Render
- **Automation**: GitHub Actions for continuous deployment

---

## 📦 Prerequisites & Requirements

### Required Accounts & Services
- [x] cPanel access (✅ Provided by client)
- [ ] GitHub account
- [ ] Railway.app or Render.com account (free tier)
- [ ] Domain access for DNS configuration

### Technical Requirements
- Node.js 18+ and npm
- Git installed locally
- FTP client (FileZilla) - optional
- Text editor (VS Code recommended)

### Files to Prepare
- [ ] GitHub repository created
- [ ] Environment variables documented
- [ ] Database backup (if migrating existing data)

---

## 🔧 Environment Setup

### Step 1: Local Environment Preparation

#### 1.1 Install Dependencies
```bash
cd E-commerce

# Frontend dependencies
cd frontend
npm install

# Backend dependencies  
cd ../backend
npm install
```

#### 1.2 Create Environment Files
```bash
# Frontend environment
cd frontend
cp .env.example .env.production

# Backend environment
cd ../backend
cp .env.example .env.production
```

#### 1.3 Generate Production Secrets
```bash
# Generate JWT secrets (run these commands)
openssl rand -base64 48  # For JWT_ACCESS_SECRET
openssl rand -base64 48  # For JWT_REFRESH_SECRET
```

---

## 🗄️ Database Setup

### Option A: Railway PostgreSQL (Recommended)

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Add Database" → "PostgreSQL"

#### Step 2: Get Database Connection String
1. In Railway dashboard, click on your PostgreSQL database
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` variable
4. Format: `postgresql://postgres:password@host:5432/railway`

#### Step 3: Run Database Migrations
```bash
cd backend

# Set production database URL
export DATABASE_URL="your_railway_database_url"

# Run migrations
npx prisma migrate deploy

# Seed database (creates admin user)
npx prisma db seed
```

### Option B: Alternative Database Services

**Neon (serverless PostgreSQL):**
- Website: [neon.tech](https://neon.tech)
- Free tier: 0.5GB storage
- Get connection string from dashboard

**Supabase (PostgreSQL + more):**
- Website: [supabase.com](https://supabase.com)
- Free tier: 500MB database
- Get connection string from project settings

---

## 🌐 Frontend Deployment to cPanel

### Phase 1: Next.js Configuration for Static Export

#### Step 1: Update next.config.js
The `next.config.js` file should be configured for static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
  trailingSlash: true,
  
  // Environment variables for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
```

#### Step 2: Build Static Files
```bash
cd frontend

# Create production environment
echo "NEXT_PUBLIC_API_URL=https://api.cento-servizi.it/api" > .env.production

# Build for production
npm run build
```

This creates a `out` folder with all static files.

#### Step 3: Test Build Locally
```bash
# Install static server
npm install -g serve

# Test the build
serve out
```

Visit `http://localhost:3000` to verify the build works.

---

### Phase 2: Manual cPanel Upload

#### Step 1: Access cPanel File Manager
1. Login to cPanel: `https://webhosting3003.is.cc:2083/`
2. Username: `centoser`
3. Password: `s?Q%qN4q`
4. Click "File Manager" icon

#### Step 2: Navigate to Public Directory
1. Go to `public_html` (for main domain)
2. Or create subdirectory for subdomain
3. If using subdomain, navigate to the subdomain folder

#### Step 3: Upload Files
**Option A: File Manager Upload**
1. Click "Upload" button
2. Select all files from `frontend/out` directory
3. Upload and wait for completion

**Option B: FTP Upload**
1. Open FileZilla or FTP client
2. Host: `69.10.38.126`
3. Username: `centoser`
4. Password: `s?Q%qN4q`
5. Port: 21
6. Upload all files from `frontend/out` to `public_html`

---

### Phase 3: Configure .htaccess for Routing

Create `.htaccess` file in `public_html`:

```apache
# Enable Rewrite Engine
RewriteEngine On
RewriteBase /

# Handle Next.js static files directly
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Redirect all routes to index.html (SPA routing)
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

### Phase 4: Verify Frontend Deployment

1. Visit `https://admin.cento-servizi.it`
2. Check homepage loads correctly
3. Test navigation between pages
4. Verify all static assets load (images, CSS, JS)
5. Check browser console for errors

---

## 🔧 Backend Deployment Strategy

Since cPanel has limited Node.js support, we'll deploy the backend to Railway.

### Option A: Railway Deployment (Recommended)

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

#### Step 2: Deploy Backend from GitHub
1. Click "Deploy from GitHub repo"
2. Select your repository
3. Select `backend` folder as root directory
4. Railway will auto-detect NestJS

#### Step 3: Configure Environment Variables
In Railway dashboard, add these variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://... (from Railway PostgreSQL)
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://admin.cento-servizi.it
```

#### Step 4: Start Command
Add this in Railway settings:
```bash
npm run start:prod
```

#### Step 5: Get Backend URL
1. Railway will provide a URL like: `https://your-backend.railway.app`
2. This is your `NEXT_PUBLIC_API_URL`

---

### Option B: Alternative Node.js Hosting

**Render.com:**
- Free tier available
- Auto deploys from GitHub
- Built-in SSL
- [render.com](https://render.com)

**Heroku:**
- Free tier (limited)
- Easy deployment
- [heroku.com](https://heroku.com)

**DigitalOcean App Platform:**
- $5/month starting
- Good performance
- [digitalocean.com](https://digitalocean.com)

---

## 🤖 GitHub Actions Automation

### Automated Deployment Setup

#### Step 1: Create GitHub Repository
1. Create new repository on GitHub
2. Name it: `cento-ecommerce-platform`
3. Initialize with README

#### Step 2: Push Code to GitHub
```bash
cd E-commerce

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - E-commerce platform ready for deployment"

# Add remote
git remote add origin https://github.com/YOUR-USERNAME/cento-ecommerce-platform.git

# Push
git push -u origin main
```

#### Step 3: Configure GitHub Secrets
Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add these secrets:

```
FTP_SERVER = 69.10.38.126
FTP_USERNAME = centoser
FTP_PASSWORD = s?Q%qN4q
API_URL = https://your-backend.railway.app/api
```

#### Step 4: GitHub Actions Workflow
The `.github/workflows/deploy.yml` file is already created in your codebase. It will:
- Build the Next.js application
- Optimize files
- Deploy to cPanel via FTP
- Run automatically on every push to `main`

---

## 🌐 Domain & DNS Configuration

### Configure Custom Domains

#### Frontend Domain (admin.cento-servizi.it)
1. Login to cPanel
2. Go to "Domains" section
3. Click "Subdomains"
4. Create subdomain: `admin`
5. Document Root: `public_html`

#### Backend Domain (api.cento-servizi.app) - Optional
If using Railway:
1. Go to Railway project settings
2. Click "Domains"
3. Add custom domain: `api.cento-servizi.it`
4. Update DNS records (Railway will provide instructions)

### DNS Configuration
In your domain registrar (where cento-servizi.it is registered):

```
Type: A Record
Name: admin
Value: 69.10.38.126
TTL: 3600

Type: CNAME
Name: api
Value: your-backend-url.railway.app
TTL: 3600
```

---

## ✅ Post-Deployment Setup

### 1. SSL Certificate Configuration
1. In cPanel, go to "SSL/TLS Status"
2. Check for AutoSSL
3. If not available, use "Let's Encrypt" in cPanel
4. Ensure HTTPS redirect is enabled

### 2. Email Configuration
For backend email functionality, update backend environment:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=Cento Admin <no-reply@cento-servizi.it>
```

### 3. Admin Account Access
After database seeding, login with:
- Email: `admin@cento.local`
- Password: `ChangeMe123!`
⚠️ **IMPORTANT**: Change this immediately after first login!

### 4. Test All Functionality
- [ ] User registration
- [ ] Email verification
- [ ] Login/Logout
- [ ] Product management
- [ ] Order processing
- [ ] Admin panel access
- [ ] API endpoints

---

## 🔍 Troubleshooting & Monitoring

### Common Issues & Solutions

#### 1. Blank Page or 404 Errors
**Cause:** Missing .htaccess or incorrect routing
**Solution:** Ensure .htaccess is in public_html with correct content

#### 2. API Connection Errors
**Cause:** CORS or incorrect API URL
**Solution:** 
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS_ORIGIN in backend includes your domain
- Check backend is running and accessible

#### 3. Database Connection Errors
**Cause:** Incorrect DATABASE_URL or database not accessible
**Solution:**
- Verify DATABASE_URL format
- Check database service is running
- Test connection string manually

#### 4. Images Not Loading
**Cause:** Image optimization in static export
**Solution:** Already configured with `unoptimized: true` in next.config.js

#### 5. Deploy Not Updating
**Cause:** Browser cache or CDN cache
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Clear cPanel cache if enabled

### Monitoring Setup

#### Frontend Monitoring
1. Enable error tracking (Sentry optional)
2. Monitor page load times
3. Check Google Analytics

#### Backend Monitoring
1. Railway provides built-in metrics
2. Monitor database queries
3. Check API response times
4. Set up uptime monitoring (UptimeRobot free)

---

## 📚 Quick Reference Commands

### Build Commands
```bash
# Frontend build
cd frontend
npm install
npm run build

# Backend build
cd backend
npm install
npm run build
```

### Database Commands
```bash
# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Deployment Commands
```bash
# Manual FTP upload (use FileZilla)
# Server: 69.10.38.126
# Username: centoser
# Password: s?Q%qN4q

# Git push to trigger GitHub Actions
git add .
git commit -m "Deployment update"
git push
```

---

## 🎉 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database created and tested
- [ ] Frontend builds successfully
- [ ] Backend builds successfully
- [ ] GitHub repository created
- [ ] API endpoints tested locally

### Deployment Day
- [ ] Frontend uploaded to cPanel
- [ ] .htaccess file configured
- [ ] Backend deployed to Railway
- [ ] Database migrated and seeded
- [ ] DNS records configured
- [ ] SSL certificate enabled
- [ ] Email functionality tested
- [ ] Admin login working

### Post-Deployment
- [ ] All pages load correctly
- [ ] API calls working
- [ ] Database operations functional
- [ ] User registration/login works
- [ ] Email verification tested
- [ ] Admin panel accessible
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 📞 Support & Resources

### Helpful Links
- cPanel Documentation: [docs.cpanel.net](https://docs.cpanel.net)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- NestJS Documentation: [docs.nestjs.com](https://docs.nestjs.com)

### Emergency Contacts
- cPanel Support: Contact via hosting provider
- Railway Support: support@railway.app
- GitHub Issues: Check repository issues

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-27  
**Maintained By:** Development Team

---

## 🚀 Ready to Deploy?

Follow this guide step-by-step, and you'll have your CENTO E-commerce platform live in no time! If you encounter any issues, refer to the troubleshooting section or check the documentation links provided.

**Good luck with your deployment! 🎉**