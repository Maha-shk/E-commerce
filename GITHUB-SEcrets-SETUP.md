# GitHub Secrets Setup for Automated Deployment

If you want to use the automated deployment workflow (`.github/workflows/deploy.yml`), you need to configure the following secrets in your GitHub repository.

## How to Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

## Required Secrets

### Frontend Deployment (Vercel)

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

**How to get these values:**

1. **VERCEL_TOKEN:**
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Create a new token
   - Copy and paste to GitHub secrets

2. **VERCEL_ORG_ID and VERCEL_PROJECT_ID:**
   - Install Vercel CLI: `npm install -g vercel`
   - Run: `vercel login`
   - Run: `vercel link` (in your frontend directory)
   - Open `.vercel/project.json` file
   - Copy the `orgId` and `projectId` values

3. **NEXT_PUBLIC_API_URL:**
   - After deploying your backend (see below)
   - Add the full URL with `/api` suffix

### Backend Deployment (Railway)

```
RAILWAY_SERVICE_ID=your_railway_service_id
RAILWAY_TOKEN=your_railway_token
```

**How to get these values:**

1. **RAILWAY_TOKEN:**
   - Go to [railway.app](https://railway.app)
   - Account settings → API Tokens
   - Create a new token
   - Copy and paste to GitHub secrets

2. **RAILWAY_SERVICE_ID:**
   - Go to your Railway project
   - Select your backend service
   - Copy the service ID from the URL or settings

### Health Check URLs (Optional)

```
BACKEND_URL=https://your-backend-url.com
FRONTEND_URL=https://your-frontend-url.com
```

## Alternative: Manual Deployment

If you prefer manual deployment or don't want to set up GitHub Actions:

1. **Frontend:** Use Vercel dashboard → Connect GitHub repo → Auto-deploy on push
2. **Backend:** Use Railway dashboard → Connect GitHub repo → Auto-deploy on push

This is actually simpler and requires less setup!

## Testing the Workflow

After setting up secrets:

1. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Enable automated deployment"
   git push origin main
   ```

2. Go to **Actions** tab in your GitHub repository
3. Watch the deployment workflow run
4. Check the logs if anything fails

## Troubleshooting

**Vercel deployment fails:**
- Verify VERCEL_TOKEN has correct permissions
- Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
- Ensure frontend builds successfully locally

**Railway deployment fails:**
- Verify RAILWAY_TOKEN is valid
- Check RAILWAY_SERVICE_ID matches your backend service
- Ensure backend builds successfully locally

**Health checks fail:**
- Verify BACKEND_URL and FRONTEND_URL are correct
- Check if services need time to start (increase sleep time)
- Manual testing: `curl https://your-backend-url/api/health`

## Security Notes

- Never commit `.env` files to Git
- Use different tokens for different environments
- Rotate tokens regularly
- Monitor GitHub Actions logs for secret exposure
- Use branch protection rules to control deployments

---

**Recommendation:** Start with manual deployment through Vercel/Railway dashboards. Their GitHub integration works perfectly and requires less configuration!
