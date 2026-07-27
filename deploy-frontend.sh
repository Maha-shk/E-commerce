#!/bin/bash

# Frontend Deployment Script for cPanel
# This script prepares the frontend for deployment to cPanel hosting

set -e  # Exit on error

echo "==========================================="
echo "Cento Frontend - cPanel Deployment Prep"
echo "==========================================="

# Configuration
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
BUILD_DIR="$FRONTEND_DIR/.next"
DEPLOY_DIR="$FRONTEND_DIR/../deploy-frontend"
TEMP_DIR="$DEPLOY_DIR/temp"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
rm -rf "$DEPLOY_DIR"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
cd "$FRONTEND_DIR"
npm ci

echo -e "${YELLOW}Step 3: Building frontend...${NC}"
npm run build

echo -e "${YELLOW}Step 4: Creating production server file...${NC}"
cat > "$TEMP_DIR/server.js" << 'EOF'
// Production server for Next.js on cPanel
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false // Production mode
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
EOF

echo -e "${YELLOW}Step 5: Copying build files...${NC}"
mkdir -p "$TEMP_DIR"

# Copy essential directories and files
cp -r "$FRONTEND_DIR/.next" "$TEMP_DIR/"
cp -r "$FRONTEND_DIR/public" "$TEMP_DIR/" 2>/dev/null || mkdir -p "$TEMP_DIR/public"
cp "$FRONTEND_DIR/package.json" "$TEMP_DIR/"
cp "$FRONTEND_DIR/package-lock.json" "$TEMP_DIR/" 2>/dev/null || true
cp "$FRONTEND_DIR/next.config.js" "$TEMP_DIR/" 2>/dev/null || cp "$FRONTEND_DIR/next.config.ts" "$TEMP_DIR/" 2>/dev/null || true

# Copy environment file template
cp "$FRONTEND_DIR/.env.example" "$TEMP_DIR/.env.production"

echo -e "${YELLOW}Step 6: Installing production dependencies...${NC}"
cd "$TEMP_DIR"
npm ci --production

# Create .htaccess for Next.js routing
cat > "$TEMP_DIR/.htaccess" << 'EOF'
# Frontend .htaccess for Next.js on cPanel
Options -MultiViews

<IfModule mod_rewrite.c>
  RewriteEngine On

  # Redirect HTTP to HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Serve static files directly
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Serve Next.js static files
  RewriteRule ^_next/static/(.*)$ - [L]

  # Proxy all other requests to Next.js app
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L,QSA]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
  AddOutputFilterByType DEFLATE application/x-font
  AddOutputFilterByType DEFLATE application/x-font-opentype
  AddOutputFilterByType DEFLATE application/x-font-otf
  AddOutputFilterByType DEFLATE application/x-font-truetype
  AddOutputFilterByType DEFLATE application/x-font-ttf
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE font/opentype
  AddOutputFilterByType DEFLATE font/otf
  AddOutputFilterByType DEFLATE font/ttf
  AddOutputFilterByType DEFLATE image/svg+xml
  AddOutputFilterByType DEFLATE image/x-icon
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/xml
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOF

echo -e "${YELLOW}Step 7: Creating deployment package...${NC}"
cd "$DEPLOY_DIR"
tar -czf "frontend-deploy-$(date +%Y%m%d-%H%M%S).tar.gz" -C temp .

echo -e "${GREEN}✅ Frontend deployment package created successfully!${NC}"
echo -e "${GREEN}📦 Package location: $DEPLOY_DIR/frontend-deploy-*.tar.gz${NC}"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload the contents of '$TEMP_DIR' to your cPanel frontend directory"
echo "2. Set environment variables in cPanel Node.js app settings"
echo "3. Restart the Node.js application in cPanel"

echo ""
echo -e "${YELLOW}Required environment variables (set in cPanel):${NC}"
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_API_URL=https://api.cento-servizi.it"
echo "NEXT_PUBLIC_APP_URL=https://admin.cento-servizi.it"