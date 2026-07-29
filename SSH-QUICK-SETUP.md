# 🔑 SSH Key Quick Setup for cPanel Auto-Deployment

## Quick Copy-Paste Commands

### 1. Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "github-actions-cpanel" -f ~/.ssh/cpanel_deploy_key -N ""
```

### 2. Display Public Key (Add to cPanel)
```bash
cat ~/.ssh/cpanel_deploy_key.pub
```
**Copy this output and add to:**
- cPanel → Security → SSH Access → Import Key
- OR: `~/.ssh/authorized_keys` on server

### 3. Display Private Key (Add to GitHub Secrets)
```bash
cat ~/.ssh/cpanel_deploy_key
```
**Copy everything including BEGIN/END lines and add to GitHub Secret:**
- Secret Name: `SSH_PRIVATE_KEY`

### 4. Test Connection
```bash
# Replace with your actual server details
ssh -i ~/.ssh/cpanel_deploy_key your-user@your-server-ip

# Test Git operations
ssh -i ~/.ssh/cpanel_deploy_key your-user@your-server-ip "git --version"
```

## GitHub Secrets Checklist

Go to: GitHub Repository → Settings → Secrets and variables → Actions

### Connection Secrets ✅
- [ ] `SERVER_HOST` = `your-server-ip-or-domain`
- [ ] `SERVER_USER` = `your-cpanel-username`  
- [ ] `SSH_PRIVATE_KEY` = (paste entire private key)
- [ ] `SSH_PORT` = `22`

### Deployment Secrets ✅
- [ ] `BACKEND_DEPLOY_PATH` = `/home/your-user/cento/backend`
- [ ] `FRONTEND_DEPLOY_PATH` = `/home/your-user/cento/frontend`

### Repository Secrets ✅
- [ ] `REPO_URL` = `https://github.com/YOUR_USERNAME/E-commerce.git`
- [ ] `API_URL` = `https://api.cento-servizi.it`
- [ ] `APP_URL` = `https://admin.cento-servizi.it`

## Common Issues & Fixes

### Issue: "Permission denied (publickey)"
**Fix:** 
- Verify public key is in server's `~/.ssh/authorized_keys`
- Check private key in GitHub Secrets is complete (including BEGIN/END lines)
- Ensure SERVER_USER and SERVER_HOST are correct

### Issue: "pm2: command not found"  
**Fix:**
```bash
# Install PM2 on server
npm install -g pm2
# OR via cPanel Node.js setup
```

### Issue: "Cannot find module"
**Fix:**
```bash
# Navigate to project directory and install dependencies
cd ~/cento/backend && npm install
cd ~/cento/frontend && npm install
```

## Post-Setup Verification

### 1. Manual SSH Test
```bash
ssh -i ~/.ssh/cpanel_deploy_key your-user@your-server-ip "pm2 status"
```

### 2. GitHub Actions Test
- Make a small change to README.md
- Push to main branch
- Check Actions tab for workflow execution
- Verify deployment completed successfully

### 3. Live Site Test
```bash
# Test backend health
curl https://api.cento-servizi.it/health

# Test frontend
curl https://admin.cento-servizi.it

# Check PM2 status on server
ssh your-user@your-server-ip "pm2 status"
```

## Success Indicators ✅

When setup is complete, you should see:
- ✅ GitHub Actions workflow runs successfully
- ✅ Both backend and frontend are deployed
- ✅ PM2 shows both apps as "online" 
- ✅ Health endpoints return 200 status
- ✅ Frontend loads in browser without errors

## Need Help?

Check the detailed guides:
- `GITHUB-ACTIONS-SETUP.md` - Full GitHub Actions configuration
- `DEPLOYMENT-PATHS.md` - Finding correct deployment paths
- `DEPLOYMENT_GUIDE_CPANEL.md` - Complete cPanel deployment guide
