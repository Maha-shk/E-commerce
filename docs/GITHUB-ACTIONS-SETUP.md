# GitHub Actions Secrets Setup Guide

This guide walks you through configuring the required GitHub Actions secrets for the automated deployment workflow.

## 🚀 Quick Start

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret below

## 🔑 Required Secrets

### Server Connection Secrets
These secrets allow GitHub Actions to connect to your deployment server via SSH.

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Your server's IP address or domain name | `123.45.67.89` or `yourserver.com` |
| `SERVER_USER` | SSH username for server access | `root` or `ubuntu` or `deploy-user` |
| `SSH_PRIVATE_KEY` | Private SSH key for authentication | Your `.pem` or private key content |
| `SSH_PORT` | SSH port (optional, defaults to 22) | `22` or `2222` |

### Deployment Path Secrets
Where the application should be deployed on your server.

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `BACKEND_DEPLOY_PATH` | Full path to backend deployment directory | `/var/www/cento-backend` |
| `FRONTEND_DEPLOY_PATH` | Full path to frontend deployment directory | `/var/www/cento-frontend` |

### Repository & URL Secrets
Repository information and public URLs for your deployed application.

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `REPO_URL` | Git repository URL (for fresh clones) | `https://github.com/Maha-shk/E-commerce.git` |
| `API_URL` | Public URL where backend API will be accessible | `https://api.yourdomain.com` |
| `APP_URL` | Public URL where frontend will be accessible | `https://yourdomain.com` |

## 📝 Detailed Instructions

### Step 1: Generate SSH Key Pair

If you don't have an SSH key pair yet, generate one:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# This creates:
# Private key: ~/.ssh/github_actions_deploy (use for SSH_PRIVATE_KEY)
# Public key: ~/.ssh/github_actions_deploy.pub (add to server)
```

### Step 2: Add Public Key to Server

Copy the public key to your server:

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-server.com

# Or manually add to server's authorized_keys
cat ~/.ssh/github_actions_deploy.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Copy Private Key for Secret

Get the private key content (copy the entire output including BEGIN/END lines):

```bash
cat ~/.ssh/github_actions_deploy
```

**Important**: Copy the entire key including the `-----BEGIN` and `-----END` lines!

### Step 4: Configure GitHub Secrets

Go to your repository: **Settings** → **Secrets and variables** → **Actions**

Add each secret with the appropriate value:

#### 1. SERVER_HOST
```
123.45.67.89  # Your server IP or domain
```

#### 2. SERVER_USER  
```
ubuntu  # Your SSH username
```

#### 3. SSH_PRIVATE_KEY
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (entire key content) ...
-----END OPENSSH PRIVATE KEY-----
```

#### 4. SSH_PORT (optional)
```
22  # Default SSH port, or your custom port like 2222
```

#### 5. BACKEND_DEPLOY_PATH
```
/var/www/cento-backend
```

#### 6. FRONTEND_DEPLOY_PATH
```
/var/www/cento-frontend
```

#### 7. REPO_URL
```
https://github.com/Maha-shk/E-commerce.git
```

#### 8. API_URL
```
https://api.cento.com  # Your backend API URL
```

#### 9. APP_URL
```
https://cento.com  # Your frontend URL
```

## 🔧 Server Preparation

Before deployment works, ensure your server has:

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install PostgreSQL (if using local database)
sudo apt install -y postgresql postgresql-contrib
```

### 2. Create Deployment Directories

```bash
# Create deployment directories
sudo mkdir -p /var/www/cento-backend
sudo mkdir -p /var/www/cento-frontend

# Set ownership
sudo chown -R $USER:$USER /var/www/cento-backend
sudo chown -R $USER:$USER /var/www/cento-frontend
```

### 3. Setup Database (if using local PostgreSQL)

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE cento_db;
CREATE USER cento_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cento_db TO cento_user;
\q
```

## ✅ Verification

After configuring secrets, verify the setup:

### 1. Test SSH Connection
```bash
ssh -i ~/.ssh/github_actions_deploy ubuntu@your-server-ip
```

### 2. Test GitHub Actions Access
The next push to main branch will trigger the workflow. Check:
- **Actions tab** in your GitHub repository
- Look for **"Auto-Deploy to Server"** workflow run
- Verify all steps complete successfully

### 3. Check Deployed Application
```bash
# SSH into server and check PM2 status
ssh ubuntu@your-server-ip "pm2 status"

# Check application health
curl https://api.cento.com/health
curl https://cento.com
```

## 🐛 Troubleshooting

### Common Issues

#### 1. SSH Authentication Failed
**Error**: `Permission denied (publickey)`
**Solution**: 
- Verify SSH_PRIVATE_KEY is complete (including BEGIN/END lines)
- Ensure public key is in server's `~/.ssh/authorized_keys`
- Check SERVER_USER and SERVER_HOST are correct

#### 2. Permission Denied on Deploy Path
**Error**: `Permission denied` when creating directories
**Solution**:
```bash
# Fix directory permissions on server
sudo chown -R $USER:$USER /var/www/cento-*
sudo chmod -R 755 /var/www/cento-*
```

#### 3. Database Connection Failed
**Error**: `Can't reach database server`
**Solution**:
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL environment variable on server
- Ensure database user has correct permissions

#### 4. PM2 Commands Not Found
**Error**: `pm2: command not found`
**Solution**:
```bash
# Install PM2 globally on server
sudo npm install -g pm2
```

## 🔒 Security Best Practices

1. **Use Deploy-Specific SSH Keys**: Don't use your personal SSH keys
2. **Rotate Keys Regularly**: Update SSH keys every few months
3. **Limit SSH User Permissions**: Create a deploy user with minimal required permissions
4. **Never Commit Secrets**: Never put secrets in `.env` files or code
5. **Monitor Workflow Runs**: Regularly check GitHub Actions for suspicious activity
6. **Use Branch Protection**: Require PR reviews before merging to main

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [NestJS Deployment](https://docs.nestjs.com/faq/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Need Help?** Check the deployment logs in GitHub Actions or refer to the main deployment documentation.