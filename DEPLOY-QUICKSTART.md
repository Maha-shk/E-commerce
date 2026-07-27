# Quick Start Deployment Guide

## 🚀 5-Minute Deployment to cPanel

### What You Need to Do (Your Part)

#### Step 1: cPanel Database Setup (2 minutes)
1. **Login to cPanel**: https://webhosting3003.is.cc:2083
   - Username: `centoser`
   - Password: `s?Q%qN4q`

2. **Create PostgreSQL Database**:
   - Go to **"Databases"** → **"PostgreSQL Databases"**
   - Create database name: `cento_prod` (note: will become `centoser_cento_prod`)
   - Create user: `cento_admin` with strong password
   - Grant all privileges
   - **SAVE THESE CREDENTIALS!**

#### Step 2: Build Applications (3 minutes)
1. **Run the deployment script**:
   ```bash
   # On Windows, run:
   deploy-all.bat
   
   # Or on Git Bash/WSL:
   bash deploy-all.sh
   ```

2. **Wait for build to complete** - you'll see success messages

#### Step 3: Create Node.js Apps in cPanel (3 minutes)
1. **Backend API Setup**:
   - Go to **"Software"** → **"Setup Node.js App"**
   - Click **"Create Application"**
   - Configure:
     - **Node.js version**: `20.x`
     - **Application mode**: `Production`
     - **Application root**: `backend_api`
     - **Application URL**: `api.cento-servizi.it`
     - **Application startup file**: `dist/main.js`
   - Add environment variables (see below)
   - Click **"Create"**

2. **Frontend Setup**:
   - Click **"Create Application"** again
   - Configure:
     - **Node.js version**: `20.x`
     - **Application mode**: `Production`
     - **Application root**: `frontend_app`
     - **Application URL**: `admin.cento-servizi.it`
     - **Application startup file**: `server.js`
   - Add environment variables (see below)
   - Click **"Create"**

#### Step 4: Set Environment Variables
**Backend variables**:
```
NODE_ENV=production
DATABASE_URL=postgresql://centoser_dbuser:YourPassword@localhost:5432/centoser_cento_prod
JWT_SECRET=generate-a-64-char-random-string
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@cento-servizi.it
ADMIN_PASSWORD=YourSecurePassword123!
FRONTEND_URL=https://admin.cento-servizi.it
```

**Frontend variables**:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.cento-servizi.it
NEXT_PUBLIC_APP_URL=https://admin.cento-servizi.it
```

#### Step 5: Upload Files (5 minutes)
1. **Backend Files**:
   - Go to **"File Manager"**
   - Navigate to `backend_api` directory
   - Upload these folders from your local `backend/`:
     - `dist/` folder
     - `node_modules/` folder
     - `prisma/` folder
     - `package.json`, `package-lock.json`
     - `.env.production` file (rename to `.env`)

2. **Frontend Files**:
   - Navigate to `frontend_app` directory
   - Upload these folders from your local `frontend/`:
     - `.next/` folder
     - `node_modules/` folder
     - `public/` folder
     - `server.js` file
     - `package.json`, `package-lock.json`
     - `.env.production` file (rename to `.env`)

#### Step 6: Run Database Migrations
1. In cPanel, go to **"Advanced"** → **"Terminal"**
2. Navigate to backend directory:
   ```bash
   cd backend_api
   ```
3. Run migrations:
   ```bash
   npm run prisma:deploy
   npm run db:seed
   ```

#### Step 7: Test Deployment
1. **Check API**: Visit `https://api.cento-servizi.it/api/health`
2. **Check Frontend**: Visit `https://admin.cento-servizi.it`
3. **Test Login**: Use `admin@cento-servizi.it` with your admin password

## 🎯 What the Automated Scripts Do

The deployment scripts automatically:
- ✅ Install all dependencies
- ✅ Build backend for production
- ✅ Build frontend for production
- ✅ Generate Prisma client
- ✅ Create deployment packages
- ✅ Generate `.htaccess` files
- ✅ Create migration scripts

## 📋 Troubleshooting

### Build Fails
```bash
# Clean and retry
cd backend
rmdir /s /q node_modules
npm install
npm run build
```

### Can't Access API
- Check cPanel Node.js app is running
- Verify port in environment variables
- Check error logs in cPanel

### Database Connection Error
- Verify `DATABASE_URL` format
- Check database credentials
- Ensure database exists in cPanel

### Frontend Shows Blank Page
- Clear browser cache
- Check `.htaccess` file exists
- Verify `server.js` is uploaded

## 🔧 Post-Deployment Setup

### SSL Certificate (Recommended)
1. Go to **"Security"** → **"Let's Encrypt SSL"**
2. Install for:
   - `cento-servizi.it`
   - `admin.cento-servizi.it`
   - `api.cento-servizi.it`

### Automated Backups
1. Go to **"Files"** → **"Backup"**
2. Set up automated database backups

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- See `ENV-VARS.md` for environment variable reference
- Review cPanel error logs for issues

## ⏱️ Time Estimate

- Database setup: 2 minutes
- Building: 3 minutes
- cPanel configuration: 8 minutes
- File upload: 5 minutes
- Testing: 2 minutes

**Total: ~20 minutes**