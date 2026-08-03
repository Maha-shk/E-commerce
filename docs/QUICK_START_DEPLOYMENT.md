# 🚀 Quick Start Deployment Guide

## ⚡ Fast Track Deployment (5 Steps)

### Step 1: Build Your Frontend
```powershell
# Navigate to E-commerce folder
cd E-commerce

# Run the deployment helper
.\deploy.ps1 build
```

This will:
- ✅ Install all dependencies
- ✅ Build Next.js for production
- ✅ Create static files in `frontend/out`
- ✅ Configure .htaccess for cPanel

### Step 2: Access Your cPanel
1. **Login to cPanel**: https://webhosting3003.is.cc:2083/
   - Username: `centoser`
   - Password: `s?Q%qN4q`

### Step 3: Upload Files
**Option A: File Manager (Easiest)**
1. Click "File Manager" icon
2. Go to `public_html` folder
3. Click "Upload" button
4. Upload all files from `frontend/out`

**Option B: FTP Upload**
1. Open FileZilla or FTP client
2. Connect with:
   - Host: `69.10.38.126`
   - User: `centoser`
   - Password: `s?Q%qN4q`
   - Port: 21
3. Upload all files from `frontend/out` to `public_html`

### Step 4: Test Your Site
Visit: **https://admin.cento-servizi.it**

### Step 5: Setup Backend (Database + API)
See full guide for backend setup steps.

---

## 🎯 GitHub Setup (One-Time)

### Create GitHub Repository
```bash
cd E-commerce

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR-USERNAME/cento-ecommerce.git
git push -u origin main
```

### Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
FTP_SERVER = 69.10.38.126
FTP_USERNAME = centoser
FTP_PASSWORD = s?Q%qN4q
API_URL = https://api.cento-servizi.it/api
```

### Enable Auto-Deploy
Push to `main` branch → Automatic deployment to cPanel ✅

---

## 🔧 Manual Commands Reference

### Build Commands
```powershell
# Build only
.\deploy.ps1 build

# Check status
.\deploy.ps1 status

# Full build and prepare
.\deploy.ps1 all
```

### Environment Variables
Edit `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.cento-servizi.it/api
```

---

## ✅ Pre-Deployment Checklist

### Before You Start
- [ ] Node.js installed (v18+)
- [ ] Git installed
- [ ] cPanel login credentials ready
- [ ] GitHub account created
- [ ] Backend API URL decided

### Files Ready
- [ ] Frontend builds without errors
- [ ] .env.production configured
- [ ] Build output files exist
- [ ] .htaccess file created

---

## 🎨 Architecture Overview

```
Frontend (cPanel)           Backend (Railway)          Database (Railway)
    Next.js 16       ←→       NestJS           ←→       PostgreSQL
admin.cento-              api.cento-             
servizi.it                servizi.it
```

### Deployment Strategy
- **Frontend**: Static export → cPanel hosting
- **Backend**: Node.js app → Railway/Render
- **Database**: PostgreSQL → Railway/Render

---

## 🚨 Troubleshooting

### Build Fails
```powershell
# Clear cache and retry
cd frontend
rm -R node_modules .next
npm install
npm run build
```

### Upload Issues
- Use FileZilla instead of File Manager
- Check FTP credentials
- Verify internet connection

### Site Shows Blank Page
- Clear browser cache (Ctrl+Shift+R)
- Check .htaccess file exists
- Verify all files uploaded correctly

### API Connection Errors
- Check NEXT_PUBLIC_API_URL is correct
- Verify backend is running
- Check CORS settings in backend

---

## 📞 Next Steps

1. ✅ Deploy frontend to cPanel
2. ⏳ Setup backend on Railway
3. ⏳ Configure database
4. ⏳ Test full system
5. ⏳ Setup custom domain for backend

For complete details, see [DEPLOYMENT_GUIDE_CPANEL.md](./DEPLOYMENT_GUIDE_CPANEL.md)

---

**Need Help?** Check the full deployment guide or review the troubleshooting section.

**Good luck with your deployment! 🎉**