#!/bin/bash

# Backend Deployment Script for cPanel
# This script prepares the backend for deployment to cPanel hosting

set -e  # Exit on error

echo "========================================="
echo "Cento Backend - cPanel Deployment Prep"
echo "========================================="

# Configuration
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
BUILD_DIR="$BACKEND_DIR/dist"
DEPLOY_DIR="$BACKEND_DIR/../deploy-backend"
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
cd "$BACKEND_DIR"
npm ci --production=false

echo -e "${YELLOW}Step 3: Building backend...${NC}"
npm run build

echo -e "${YELLOW}Step 4: Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}Step 5: Creating production package...${NC}"
mkdir -p "$TEMP_DIR"

# Copy essential files
cp -r "$BUILD_DIR" "$TEMP_DIR/"
cp "$BACKEND_DIR/package.json" "$TEMP_DIR/"
cp "$BACKEND_DIR/package-lock.json" "$TEMP_DIR/" 2>/dev/null || true
cp -r "$BACKEND_DIR/prisma" "$TEMP_DIR/"
cp "$BACKEND_DIR/node_modules/.prisma" "$TEMP_DIR/" 2>/dev/null || true
cp "$BACKEND_DIR/.env.example" "$TEMP_DIR/.env.production"

# Install production dependencies only
cd "$TEMP_DIR"
npm ci --production=only

# Create .htaccess for API routing
cat > "$TEMP_DIR/.htaccess" << 'EOF'
# Backend API .htaccess for cPanel
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On

  # Redirect all traffic to the Node.js app
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /api/$1 [L,QSA]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Deny access to sensitive files
<FilesMatch "\.(env|git|svn|log)$">
  Order allow,deny
  Deny from all
</FilesMatch>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/plain
</IfModule>
EOF

echo -e "${YELLOW}Step 6: Creating database migration script...${NC}"
cat > "$TEMP_DIR/deploy-migrate.sh" << 'EOFMIGRATE'
#!/bin/bash
# Database migration script for cPanel deployment
# Run this after uploading backend files

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database (creates admin user)..."
npm run db:seed

echo "Database setup complete!"
EOFMIGRATE

chmod +x "$TEMP_DIR/deploy-migrate.sh"

echo -e "${YELLOW}Step 7: Creating deployment package...${NC}"
cd "$DEPLOY_DIR"
tar -czf "backend-deploy-$(date +%Y%m%d-%H%M%S).tar.gz" -C temp .

echo -e "${GREEN}✅ Backend deployment package created successfully!${NC}"
echo -e "${GREEN}📦 Package location: $DEPLOY_DIR/backend-deploy-*.tar.gz${NC}"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload the contents of '$TEMP_DIR' to your cPanel backend directory"
echo "2. Set environment variables in cPanel Node.js app settings"
echo "3. Run './deploy-migrate.sh' to set up the database"
echo "4. Restart the Node.js application in cPanel"

echo ""
echo -e "${YELLOW}Required environment variables (set in cPanel):${NC}"
echo "NODE_ENV=production"
echo "DATABASE_URL=postgresql://username:password@localhost:5432/username_databasename"
echo "JWT_SECRET=your-super-secret-jwt-key"
echo "JWT_EXPIRES_IN=7d"
echo "ADMIN_EMAIL=admin@cento-servizi.it"
echo "ADMIN_PASSWORD=your-secure-password"
echo "FRONTEND_URL=https://admin.cento-servizi.it"