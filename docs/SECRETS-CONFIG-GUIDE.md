# 🔐 GitHub Secrets Configuration - Step-by-Step Guide

Follow these exact steps to configure all required GitHub secrets for auto-deployment.

## 📍 Step 1: Access GitHub Secrets Settings

1. Open your browser and go to: `https://github.com/Maha-shk/E-commerce`
2. Click on **Settings** tab (top of the repository)
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. You'll see a button **"New repository secret"** - click it

You'll need to repeat this process for each of the 9 secrets below.

---

## 🔑 Step 2: Configure Each Secret

### Secret 1: SERVER_HOST
**Name (exact)**: `SERVER_HOST`  
**Value**: Your server's IP address or domain name

**Examples**:
```
123.45.67.89
your-server.com
vps.yourdomain.com
```

**How to find**: 
- If using VPS: Check your hosting provider's control panel
- If using dedicated server: Use the server's public IP
- If using domain: Use the domain name pointing to your server

---

### Secret 2: SERVER_USER  
**Name (exact)**: `SERVER_USER`  
**Value**: Your SSH username for server access

**Examples**:
```
root
ubuntu  
deploy-user
cento-user
```

**How to find**:
- Check your hosting provider's access credentials
- Common defaults: `root`, `ubuntu`, `admin`
- Create a new deploy user: `adduser deploy-user`

---

### Secret 3: SSH_PRIVATE_KEY
**Name (exact)**: `SSH_PRIVATE_KEY`  
**Value**: Your complete SSH private key content

**Format**: Must include the BEGIN and END lines!

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...entire key content...
-----END OPENSSH PRIVATE KEY-----
```

**🚨 VERY IMPORTANT - Copy the ENTIRE key including these lines!**

---

## 🔑 Step 3: Generate SSH Key Pair (if needed)

If you don't have an SSH key yet, generate one now:

### Option A: Generate new SSH key
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# This creates:
# Private key: ~/.ssh/github_actions_deploy  <-- Use this for SSH_PRIVATE_KEY
# Public key: ~/.ssh/github_actions_deploy.pub <-- Add this to server
```

### Option B: Copy existing SSH key
If you already have an SSH key you use:
```bash
# Copy your existing private key
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```

---

## 🔑 Step 4: Add Public Key to Server

Before adding the private key to GitHub, add the public key to your server:

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-server.com

# Or manually add to server
cat ~/.ssh/github_actions_deploy.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Test the connection**:
```bash
ssh -i ~/.ssh/github_actions_deploy user@your-server.com
```

If you can login without password, the key is working!

---

## 🔑 Step 5: Get Your Private Key Content

Copy the ENTIRE private key (including BEGIN/END lines):

```bash
# Display the private key (copy everything!)
cat ~/.ssh/github_actions_deploy
```

**Copy this entire output** and paste it into the `SSH_PRIVATE_KEY` secret value in GitHub.

---

### Secret 4: SSH_PORT
**Name (exact)**: `SSH_PORT`  
**Value**: Your SSH port number

**Default**: `22` (most servers use default SSH port)

**Examples**:
```
22
2222
22222
```

**How to find**:
- Most servers use port 22
- Check your SSH config: `cat /etc/ssh/sshd_config | grep Port`
- If you changed it for security, use your custom port

---

### Secret 5: BACKEND_DEPLOY_PATH
**Name (exact)**: `BACKEND_DEPLOY_PATH`  
**Value**: Full path where backend should be deployed

**Recommended**:
```
/var/www/cento-backend
```

**Alternative examples**:
```
/home/ubuntu/cento-backend
/opt/cento/backend
/var/www/html/api
```

**You'll need to create this directory on your server**:
```bash
sudo mkdir -p /var/www/cento-backend
sudo chown -R $USER:$USER /var/www/cento-backend
```

---

### Secret 6: FRONTEND_DEPLOY_PATH
**Name (exact)**: `FRONTEND_DEPLOY_PATH`  
**Value**: Full path where frontend should be deployed

**Recommended**:
```
/var/www/cento-frontend
```

**Alternative examples**:
```
/home/ubuntu/cento-frontend
/opt/cento/frontend
/var/www/html/app
```

**You'll need to create this directory on your server**:
```bash
sudo mkdir -p /var/www/cento-frontend
sudo chown -R $USER:$USER /var/www/cento-frontend
```

---

### Secret 7: REPO_URL
**Name (exact)**: `REPO_URL`  
**Value**: Your Git repository URL

**For this repository**:
```
https://github.com/Maha-shk/E-commerce.git
```

**Alternative formats**:
```
git@github.com:Maha-shk/E-commerce.git
https://github.com/your-username/your-repo.git
```

---

### Secret 8: API_URL
**Name (exact)**: `API_URL`  
**Value**: Public URL where your backend API will be accessible

**Examples**:
```
https://api.cento.com
https://cento.com/api
https://api.yourdomain.com
```

**Important notes**:
- Use `https://` for production
- This is where your frontend will connect for API calls
- Make sure this domain/URL is configured to point to your server

---

### Secret 9: APP_URL
**Name (exact)**: `APP_URL`  
**Value**: Public URL where your frontend will be accessible

**Examples**:
```
https://cento.com
https://www.cento.com
https://shop.yourdomain.com
```

**Important notes**:
- Use `https://` for production
- This is your main application URL
- Make sure this domain/URL is configured to point to your server

---

## ✅ Step 6: Verify All Secrets Are Configured

After adding all 9 secrets, verify them:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all 9 secrets listed:
   - ✅ SERVER_HOST
   - ✅ SERVER_USER
   - ✅ SSH_PRIVATE_KEY
   - ✅ SSH_PORT
   - ✅ BACKEND_DEPLOY_PATH
   - ✅ FRONTEND_DEPLOY_PATH
   - ✅ REPO_URL
   - ✅ API_URL
   - ✅ APP_URL

---

## 🧪 Step 7: Test Your Configuration

### Option A: Trigger Manual Deployment
1. Go to **Actions** tab in your repository
2. Select **"Auto-Deploy to Server"** workflow
3. Click **"Run workflow"** button
4. Select branch and click **"Run workflow"**

### Option B: Push a Test Commit
```bash
# Make a small test change
echo "# Test auto-deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger auto-deployment"
git push origin main
```

---

## 🔍 Step 8: Monitor Deployment

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Monitor each job:
   - `deploy-backend` (should run first)
   - `deploy-frontend` (runs after backend)
   - `health-check` (runs after both deployments)

**If successful**: You'll see green checkmarks ✅
**If failed**: Click on the job to see error logs

---

## 🚨 Common Configuration Errors

### Error: "Permission denied (publickey)"
**Cause**: SSH_PRIVATE_KEY is incorrect or public key not on server
**Fix**: 
- Verify you copied the ENTIRE private key (including BEGIN/END lines)
- Make sure public key is in server's `~/.ssh/authorized_keys`

### Error: "Could not resolve hostname"
**Cause**: SERVER_HOST is incorrect
**Fix**: Verify the server IP/domain is correct

### Error: "Connection refused"
**Cause**: SSH_PORT is incorrect or SSH is not running
**Fix**: 
- Verify SSH port number
- Check SSH is running: `sudo systemctl status ssh`

### Error: "Permission denied" during deployment
**Cause**: Deploy user doesn't have permissions for deploy paths
**Fix**: 
```bash
sudo chown -R $USER:$USER /var/www/cento-*
sudo chmod -R 755 /var/www/cento-*
```

---

## 📋 Quick Reference Card

| Secret | Example Value | Your Value |
|-------|--------------|------------|
| SERVER_HOST | `123.45.67.89` | `____________` |
| SERVER_USER | `ubuntu` | `____________` |
| SSH_PRIVATE_KEY | `-----BEGIN...END-----` | `____________` |
| SSH_PORT | `22` | `____________` |
| BACKEND_DEPLOY_PATH | `/var/www/cento-backend` | `____________` |
| FRONTEND_DEPLOY_PATH | `/var/www/cento-frontend` | `____________` |
| REPO_URL | `https://github.com/Maha-shk/E-commerce.git` | `____________` |
| API_URL | `https://api.cento.com` | `____________` |
| APP_URL | `https://cento.com` | `____________` |

---

## 🎯 Next Steps After Configuration

1. **Test SSH connection**: `ssh -i ~/.ssh/github_actions_deploy user@your-server`
2. **Prepare server**: Install Node.js, PM2, create directories
3. **Trigger deployment**: Push to main or run workflow manually
4. **Monitor logs**: Check GitHub Actions and server logs
5. **Verify deployment**: Test both frontend and backend URLs

---

**🚀 Once all secrets are configured, your auto-deployment will work automatically on every push to main!**