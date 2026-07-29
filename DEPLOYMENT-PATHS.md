# cPanel Deployment Paths Configuration

## Current Deployment Paths (Based on Your Setup)

**Update these paths in your GitHub Secrets based on your actual cPanel structure:**

### Standard cPanel Paths
```
# If your username is "centouser"
/home/centouser/cento/backend      # Backend deployment
/home/centouser/cento/frontend     # Frontend deployment
/home/centouser/cento/shared       # Shared resources
```

### Alternative cPanel Paths
```
# Common alternatives
/var/www/html/cento/backend
/var/www/html/cento/frontend
/public_html/cento/backend
/public_html/cento/frontend
```

## How to Find Your Actual Paths

### Option 1: Check via SSH
```bash
# SSH into your cPanel server
ssh your-user@your-server-ip

# Check current directory
pwd
# Usually shows: /home/your-username

# List directories
ls -la
# Look for existing deployment directories
```

### Option 2: Check via cPanel File Manager
1. Log into cPanel
2. Go to **File Manager** 
3. Navigate to **Home Directory**
4. Look for or create your project directories

### Option 3: Check Existing PM2 Setup
```bash
# If PM2 is already configured
pm2 list
pm2 info cento-backend  # Shows the cwd path
pm2 info cento-frontend # Shows the cwd path
```

## Recommended Directory Structure

```
/home/centouser/cento/
├── backend/
│   ├── dist/           # Compiled NestJS backend
│   ├── node_modules/   # Backend dependencies
│   ├── logs/           # PM2 logs
│   └── .env            # Backend environment variables
├── frontend/
│   ├── .next/          # Next.js build output
│   ├── node_modules/   # Frontend dependencies
│   ├── logs/           # PM2 logs
│   └── .env.production # Frontend environment variables
└── shared/
    ├── uploads/        # User uploads
    └── static/         # Shared static files
```

## Setting Up Directories

```bash
# SSH into your server
ssh your-user@your-server-ip

# Create directory structure
mkdir -p ~/cento/backend
mkdir -p ~/cento/frontend
mkdir -p ~/cento/shared/uploads
mkdir -p ~/cento/shared/static

# Set permissions
chmod 755 ~/cento
chmod 755 ~/cento/backend
chmod 755 ~/cento/frontend
chmod -R 755 ~/cento/shared
```

## Update GitHub Secrets Accordingly

Once you know your actual paths, update these GitHub Secrets:
- `BACKEND_DEPLOY_PATH`: `/home/your-username/your-backend-path`
- `FRONTEND_DEPLOY_PATH`: `/home/your-username/your-frontend-path`
