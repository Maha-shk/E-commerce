# cPanel Deployment Guide for CENTO E-commerce Platform

## Prerequisites
- cPanel hosting access
- Domain configured: cento-servizi.it
- Subdomain for admin: admin.cento-servizi.it

## Manual Setup Required (Your Actions)

### 1. cPanel Database Setup
1. Log in to cPanel: https://webhosting3003.is.cc:2083
2. Navigate to **Databases** → **PostgreSQL Databases**
3. Create a new database:
   - Database name: `cento_prod` (or similar)
   - Note the full database name (format: `username_databasename`)
4. Create a new database user:
   - Username: `cento_admin` (or similar)
   - Generate a strong password (save this!)
5. Grant all privileges to the user for the created database
6. **Save these credentials** - you'll need them for environment variables

### 2. Node.js Application Setup in cPanel
1. In cPanel, navigate to **Software** → **Setup Node.js App**
2. Click **"Create Application"**
3. Configure **Backend API**:
   - Node.js version: `20.x` (or latest available)
   - Application mode: `Production`
   - Application root: `backend_api` (this creates a folder in your home directory)
   - Application URL: `api.cento-servizi.it` (or similar subdomain)
   - Application startup file: `dist/main.js`
   - Environment variables: (see Backend Environment Variables below)
4. Configure **Frontend** (separate application):
   - Node.js version: `20.x` (or latest available)
   - Application mode: `Production`  
   - Application root: `frontend_app`
   - Application URL: `cento-servizi.it` (main domain) or `admin.cento-servizi.it`
   - Application startup file: `server.js` (we'll create this)
   - Environment variables: (see Frontend Environment Variables below)

### 3. Environment Variables Configuration

#### Backend Environment Variables (in cPanel Node.js setup)
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/username_databasename
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@cento-servizi.it
ADMIN_PASSWORD=your-secure-admin-password
FRONTEND_URL=https://admin.cento-servizi.it
```

#### Frontend Environment Variables (in cPanel Node.js setup)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.cento-servizi.it
NEXT_PUBLIC_APP_URL=https://admin.cento-servizi.it
```

### 4. Subdomain Configuration
1. In cPanel, navigate to **Domains** → **Subdomains**
2. Create these subdomains if they don't exist:
   - `api.cento-servizi.it` → points to `backend_api` directory
   - `admin.cento-servizi.it` → points to `frontend_app` directory
3. Ensure DNS is propagated (may take up to 24 hours)

### 5. File Upload (After automated setup)
Once you run the deployment scripts locally, you'll need to:
1. Upload files via cPanel **File Manager** or FTP
2. Backend files: Upload `backend/` directory contents to `backend_api/`
3. Frontend files: Upload `frontend/` directory contents to `frontend_app/`

### 6. SSL Certificate (Recommended but Optional)
1. In cPanel, navigate to **Security** → **Let's Encrypt SSL**
2. Install SSL certificates for:
   - cento-servizi.it
   - admin.cento-servizi.it  
   - api.cento-servizi.it

### 7. Database Migration
After backend deployment:
1. Access your backend application via cPanel SSH or terminal
2. Navigate to the backend directory and run:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   ```

## Automated Setup (What We'll Configure)

I'll create deployment scripts that will:
1. Build your backend for production
2. Build your frontend for production
3. Generate `.htaccess` files for proper routing
4. Create deployment packages ready for upload
5. Generate environment variable templates
6. Create database backup/restore scripts

## Post-Deployment Checklist

After deployment, verify:
- [ ] Backend API is accessible at `https://api.cento-servizi.it/api/health`
- [ ] Frontend loads at `https://admin.cento-servizi.it`
- [ ] Admin login works (admin@cento-servizi.it with your password)
- [ ] Database connection is working
- [ ] All static assets are loading correctly

## Troubleshooting

### Backend Issues
- **500 errors**: Check cPanel error logs in `/home/centoser/logs/backend_api/`
- **Database connection**: Verify DATABASE_URL in cPanel Node.js app settings
- **Port conflicts**: Ensure PORT in environment matches cPanel assigned port

### Frontend Issues  
- **Blank pages**: Check build completed successfully locally
- **API errors**: Verify NEXT_PUBLIC_API_URL is correct and HTTPS
- **Routing issues**: Ensure `.htaccess` file is present and correct

### Common Fixes
1. Restart Node.js applications in cPanel
2. Clear browser cache and cookies
3. Regenerate Prisma client: `npx prisma generate`
4. Re-run migrations: `npx prisma migrate deploy`

## Security Notes

1. **Change default admin password immediately** after first login
2. **Keep JWT_SECRET secure and random** - use a strong random string
3. **Enable SSL/HTTPS** for all endpoints
4. **Regular database backups** - set up automated backups in cPanel
5. **Monitor logs** for suspicious activity

## Maintenance Commands

### Update Backend
```bash
# Locally build and test
cd backend
npm run build
# Then upload and restart in cPanel
```

### Update Frontend  
```bash
# Locally build and test
cd frontend  
npm run build
# Then upload and restart in cPanel
```

### Database Backup
Use cPanel backup tools or access phpMyAdmin for manual backups