# 🚀 Deployment Guide - Quick Reference

## Current Status

✅ **Frontend (Vercel)**: Ready to deploy
✅ **Backend Options**: Railway (recommended), Render, or Vercel
⚠️ **Netlify**: NOT suitable for NestJS backend

## Recommended Deployment Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (Next.js)     │ ──────▶ │   (NestJS)      │
│   Vercel        │         │   Railway       │
│   ✅ Ready      │         │   ✅ Configured │
└─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │  PostgreSQL DB  │
                            │  (Railway)      │
                            └─────────────────┘
```

## Quick Deploy Steps

### 1. Frontend to Vercel (5 minutes)

```bash
# 1. Push code to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Go to vercel.com → New Project → Import repo
# 3. Select "frontend" as root directory
# 4. Click "Deploy"
# 5. Set environment variable: NEXT_PUBLIC_API_URL (update later)
```

### 2. Backend to Railway (10 minutes)

```bash
# 1. Go to railway.app → New Project
# 2. Import from GitHub → Auto-detects NestJS
# 3. Add PostgreSQL database service
# 4. Set environment variables (see below)
# 5. Click "Deploy"
```

### 3. Connect Frontend to Backend

```bash
# 1. Copy Railway backend URL (e.g., https://cento-backend.up.railway.app)
# 2. Go to Vercel project → Settings → Environment Variables
# 3. Update NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
# 4. Redeploy Vercel frontend
```

## Environment Variables Quick Reference

### Backend (Railway/Render):

```bash
# Required
DATABASE_URL=(auto-provided by Railway)
JWT_ACCESS_SECRET=(generate: openssl rand -base64 48)
JWT_REFRESH_SECRET=(generate different one)
CORS_ORIGIN=https://your-vercel-app.vercel.app
ADMIN_EMAIL=admin@cento.local
ADMIN_PASSWORD=(choose strong password)

# Optional - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (Vercel):

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

## File Structure

```
E-commerce/
├── frontend/
│   ├── vercel.json ✅ (created)
│   ├── .env.production.example ✅ (created)
│   └── next.config.ts ✅ (updated)
├── backend/
│   ├── railway.json ✅ (created)
│   ├── render.yaml ✅ (created)
│   └── .env.example (existing)
└── DEPLOYMENT.md ✅ (updated with full guide)
```

## Next Steps

1. **Choose backend platform**: Railway (recommended) or Render
2. **Create accounts** on vercel.com and railway.app
3. **Push code** to GitHub/GitLab
4. **Follow deployment steps** above
5. **Test deployment**: Health check, login, API calls

## Troubleshooting

**Backend won't start:**
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran

**Frontend can't connect to API:**
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check CORS_ORIGIN on backend
- Ensure backend is deployed and accessible

**Need help?**
- Full guide: `DEPLOYMENT.md`
- Backend logs: Railway dashboard
- Frontend logs: Vercel dashboard

## What About Netlify?

❌ **Netlify is NOT recommended** for this backend because:
- NestJS is a long-running server, not a static site
- Prisma needs persistent database connections
- Netlify is designed for JAMstack (static + serverless functions)

✅ **Use Railway, Render, or keep backend on Vercel** instead

---

**Questions? Check the full `DEPLOYMENT.md` for detailed instructions!**
