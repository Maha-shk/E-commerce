# Netlify Deployment Guide for CENTO Backend

This guide explains how to deploy the NestJS backend to Netlify using serverless functions.

## Architecture Overview

The backend is adapted to run on Netlify Functions:
- **Traditional**: NestJS runs on a long-running server (e.g., Railway, Render)
- **Netlify**: NestJS runs in serverless functions that start per request

## Prerequisites

1. **Netlify Account**: Sign up at https://netlify.com
2. **GitHub Repository**: Your code should be on GitHub
3. **PostgreSQL Database**: Use a managed service like:
   - [Neon](https://neon.tech) (recommended, free tier)
   - [Supabase](https://supabase.com)
   - [PlanetScale](https://planetscale.com)

## Deployment Steps

### 1. Prepare Your Database

Get a PostgreSQL database URL:
```
postgresql://user:password@host:port/database?sslmode=require
```

### 2. Create Netlify Site

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. **Important**: Set these build settings:
   - **Build command**: `bash netlify/build.sh` (leave default)
   - **Base directory**: `backend` (important!)
   - **Functions directory**: `netlify/functions`
   - **Publish directory**: `dist`

### 3. Configure Environment Variables

In Netlify dashboard → Site Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NODE_ENV=production
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-different-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
ADMIN_EMAIL=admin@cento.local
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Super Admin
```

### 4. Deploy

Push your changes to GitHub, and Netlify will auto-deploy!

## Post-Deployment Steps

### 1. Run Database Migrations

Netlify runs migrations automatically during build. If you need to run them manually:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Run migrations
netlify functions:build
```

### 2. Seed Admin User

The admin user is created automatically, but you can verify it works by checking the database.

### 3. Update Frontend Environment Variable

In your Vercel frontend project, set:
```
NEXT_PUBLIC_API_URL=https://your-backend.netlify.app/api
```

## Testing Your Deployment

```bash
# Test health endpoint
curl https://your-backend.netlify.app/api/health

# Test API docs
# Open https://your-backend.netlify.app/api/docs in browser
```

## Troubleshooting

### "Module not found" errors
- Ensure `prisma generate` ran during build
- Check that all dependencies are in package.json

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure SSL is enabled: `?sslmode=require`
- Check database allows external connections

### CORS errors
- Add your frontend domain to CORS_ORIGIN environment variable
- Separate multiple domains with commas

### Functions timing out
- Netlify Functions timeout: 10 seconds (default), 60 seconds (pro)
- Optimize slow database queries
- Consider upgrading to Netlify Pro for longer timeouts

## Performance Notes

- **Cold starts**: First request after inactivity takes ~1-2 seconds
- **Subsequent requests**: ~100-500ms response time
- **Cost**: Free tier includes 125k function invocations/month

## Alternative Platforms

If Netlify Functions don't work for your use case, consider:
- **Railway**: https://railway.app (traditional server, easier setup)
- **Render**: https://render.com (traditional server, free tier)
- **DigitalOcean App Platform**: Full control, paid

## Local Development with Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally
cd backend
netlify dev
```

This simulates the Netlify environment locally.
