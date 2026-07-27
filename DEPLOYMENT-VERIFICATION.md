# Deployment Infrastructure Verification Checklist

Use this checklist to verify that your auto-deployment infrastructure is properly configured and ready to deploy.

## ✅ Phase 1: Git & GitHub Actions Setup

### Repository Configuration
- [ ] Repository is properly initialized on GitHub
- [ ] Main branch is protected (require PR reviews, status checks)
- [ ] GitHub Actions are enabled for the repository
- [ ] All deployment files are committed to the repository

### GitHub Actions Workflow
- [ ] `.github/workflows/auto-deploy.yml` exists and is committed
- [ ] Workflow triggers on push to `main` branch
- [ ] Workflow can be manually triggered (`workflow_dispatch`)
- [ ] All three jobs are present: `deploy-backend`, `deploy-frontend`, `health-check`

## 🔐 Phase 2: GitHub Secrets Configuration

### Required Secrets (9 total)
- [ ] `SERVER_HOST` - Server IP address or domain name
- [ ] `SERVER_USER` - SSH username for server access
- [ ] `SSH_PRIVATE_KEY` - Complete SSH private key content
- [ ] `SSH_PORT` - SSH port number (22 if using default)
- [ ] `BACKEND_DEPLOY_PATH` - Backend deployment directory path
- [ ] `FRONTEND_DEPLOY_PATH` - Frontend deployment directory path  
- [ ] `REPO_URL` - Git repository URL for cloning
- [ ] `API_URL` - Public API endpoint URL
- [ ] `APP_URL` - Public frontend application URL

### SSH Key Verification
- [ ] SSH key pair generated for GitHub Actions
- [ ] Public key added to server's `authorized_keys`
- [ ] Private key copied completely (including BEGIN/END markers)
- [ ] SSH connection tested successfully from local machine

## 🖥️ Phase 3: Server Preparation

### System Requirements
- [ ] Server is accessible via SSH
- [ ] Node.js v20+ is installed
- [ ] npm is installed and working
- [ ] PM2 is installed globally (`npm install -g pm2`)
- [ ] Git is installed and configured
- [ ] PostgreSQL is installed (if using local database)

### Directory Structure
- [ ] Backend deployment directory exists (`/var/www/cento-backend`)
- [ ] Frontend deployment directory exists (`/var/www/cento-frontend`)
- [ ] Directories have proper permissions (user:group ownership)
- [ ] Sufficient disk space available (> 5GB recommended)

### Database Setup
- [ ] Database created (`cento_db`)
- [ ] Database user created with strong password
- [ ] Database user has proper privileges
- [ ] Database connection string is ready
- [ ] Database backups are configured

## 📦 Phase 4: Application Configuration

### Backend Configuration
- [ ] `.env` file template prepared with all required variables:
  - [ ] `DATABASE_URL` (PostgreSQL connection string)
  - [ ] `JWT_SECRET` (random secure string)
  - [ ] `JWT_EXPIRATION` (token expiration time)
  - [ ] `ADMIN_EMAIL` (super admin email)
  - [ ] `ADMIN_PASSWORD` (strong password)
  - [ ] `PORT` (backend port, default 4000)
  - [ ] `CORS_ORIGIN` (frontend URL)

### Frontend Configuration  
- [ ] `.env.production` file prepared with:
  - [ ] `NEXT_PUBLIC_API_URL` (backend API URL)
  - [ ] `NEXT_PUBLIC_APP_URL` (frontend URL)

### PM2 Configuration
- [ ] `backend-ecosystem.config.js` created and committed
- [ ] `frontend-ecosystem.config.js` created and committed
- [ ] PM2 startup script configured (`pm2 startup`)
- [ ] PM2 save configured (`pm2 save`)

## 🧪 Phase 5: Testing & Verification

### Local Testing
- [ ] Backend builds successfully (`npm run build`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Database migrations run without errors
- [ ] Application starts locally without issues

### GitHub Actions Testing
- [ ] Test workflow run has completed successfully
- [ ] All three workflow jobs completed:
  - [ ] `deploy-backend` job succeeded
  - [ ] `deploy-frontend` job succeeded  
  - [ ] `health-check` job succeeded
- [ ] No errors or warnings in workflow logs

### Server Testing
- [ ] Backend service running (`pm2 status cento-backend`)
- [ ] Frontend service running (`pm2 status cento-frontend`)
- [ ] Backend API is accessible (`curl https://api.yourdomain.com/health`)
- [ ] Frontend is accessible (`curl https://yourdomain.com`)
- [ ] Database connectivity working
- [ ] Admin dashboard is accessible

## 🔍 Phase 6: Post-Deployment Verification

### Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works with created credentials
- [ ] Database operations working (CRUD)
- [ ] File uploads working (if applicable)
- [ ] Email sending configured (if using notifications)

### Monitoring & Logging
- [ ] PM2 monitoring is working (`pm2 monit`)
- [ ] Application logs are accessible (`pm2 logs`)
- [ ] Error handling is working
- [ ] Request logging is functional

### Performance & Security
- [ ] Response times are acceptable (< 2s for API calls)
- [ ] SSL/HTTPS is properly configured
- [ ] Security headers are set (XSS protection, CORS, etc.)
- [ ] Rate limiting is working
- [ ] Environment variables are not exposed

## 🚨 Common Issues & Solutions

### SSH Connection Issues
**Problem**: GitHub Actions can't connect to server
**Solutions**:
- Verify SSH private key is complete (include BEGIN/END lines)
- Check public key is in server's `~/.ssh/authorized_keys`
- Ensure SERVER_USER and SERVER_HOST are correct
- Verify SSH port is not blocked by firewall

### Build Failures
**Problem**: Application builds fail during deployment
**Solutions**:
- Check Node.js version compatibility (requires v20+)
- Verify all dependencies are in package.json
- Ensure sufficient disk space on server
- Check build logs for specific errors

### Database Connection Issues
**Problem**: Application can't connect to database
**Solutions**:
- Verify DATABASE_URL is correct
- Check PostgreSQL service is running
- Ensure database user has proper privileges
- Test connection manually from server

### PM2 Process Issues
**Problem**: PM2 processes don't start or crash
**Solutions**:
- Check PM2 logs (`pm2 logs`)
- Verify Node.js version compatibility
- Ensure PORT environment variables are set
- Check for missing environment variables

## 📞 Support & Troubleshooting

If you encounter issues:

1. **Check GitHub Actions logs** - Detailed error messages in workflow runs
2. **Check server logs** - PM2 logs (`pm2 logs`) and system logs (`/var/log/`)
3. **Test SSH connection** - Manual SSH test to server
4. **Verify all secrets** - Ensure all 9 GitHub secrets are configured
5. **Review documentation** - Check other deployment guides:
   - `GITHUB-ACTIONS-SETUP.md` - GitHub secrets configuration
   - `DEPLOYMENT.md` - Detailed deployment guide
   - `DEPLOY-QUICKSTART.md` - Quick start guide
   - `ENV-VARS.md` - Environment variables reference

## 🎯 Success Criteria

Your deployment infrastructure is ready when:

✅ All GitHub secrets are configured (9/9)
✅ GitHub Actions workflow runs successfully
✅ Both backend and frontend deploy without errors
✅ PM2 processes are running and stable
✅ Health checks return 200 OK
✅ Application is accessible from public URLs
✅ Core functionality works (login, CRUD operations)

---

**Next Steps**: Once all items are checked, you're ready for production deployment! 🚀