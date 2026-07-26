#!/bin/bash
# =============================================================================
# CENTO E-Commerce - Deployment Helper Script
# =============================================================================
# This script helps with the deployment process to cPanel
# Usage: ./deploy.sh [build|test|upload]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
BUILD_DIR="$FRONTEND_DIR/out"
FTP_SERVER="69.10.38.126"
FTP_USER="centoser"
FTP_PASSWORD="s?Q%qN4q"
FTP_PATH="/public_html"

# Functions
print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
    exit 1
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

# Check if required directories exist
check_directories() {
    print_step "Checking project structure..."

    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
    fi

    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
    fi

    print_success "Project structure verified"
}

# Install dependencies
install_dependencies() {
    print_step "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    print_success "Dependencies installed"
}

# Build frontend for production
build_frontend() {
    print_step "Building frontend for production..."

    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found, creating from template..."
        echo "NEXT_PUBLIC_API_URL=https://api.cento-servizi.it/api" > .env.production
    fi

    # Build the application
    npm run build

    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build failed - output directory not found"
    fi

    print_success "Frontend built successfully"
    print_step "Build output: $(du -sh $BUILD_DIR | cut -f1)"
}

# Test the build locally
test_build() {
    print_step "Testing build locally..."

    cd "$FRONTEND_DIR"

    if command -v serve &> /dev/null; then
        print_step "Starting local server on http://localhost:5000"
        print_step "Press Ctrl+C to stop testing"
        serve "$BUILD_DIR"
    else
        print_warning "serve command not found. Install with: npm install -g serve"
        print_step "You can manually test by opening: file://$(pwd)/$BUILD_DIR/index.html"
    fi
}

# Deploy via FTP
deploy_ftp() {
    print_step "Deploying to cPanel via FTP..."

    # Check if build exists
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found. Run 'npm run build' first."
    fi

    print_warning "This will upload files to cPanel"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
    fi

    # Check if lftp is installed
    if command -v lftp &> /dev/null; then
        print_step "Using lftp for FTP upload..."
        lftp -c "
            set ftp:ssl-protect-data true;
            set ftp:ssl-force true;
            set ssl:verify-certificate off;
            open -u $FTP_USER,$FTP_PASSWORD $FTP_SERVER;
            mirror -R $BUILD_DIR $FTP_PATH;
            exit
        "
    elif command -v ncftp &> /dev/null; then
        print_step "Using ncftpput for FTP upload..."
        ncftpput -R -v -u "$FTP_USER" -p "$FTP_PASSWORD" "$FTP_SERVER" "$FTP_PATH" "$BUILD_DIR"/*
    else
        print_warning "No FTP client found. Please install lftp or ncftp"
        print_step "Or use FileZilla manually:"
        print_step "  Host: $FTP_SERVER"
        print_step "  User: $FTP_USER"
        print_step "  Password: $FTP_PASSWORD"
        print_step "  Path: $FTP_PATH"
        return
    fi

    print_success "Deployment completed successfully!"
    print_step "Visit your site at: https://admin.cento-servizi.it"
}

# Create .htaccess file
create_htaccess() {
    print_step "Creating .htaccess file..."

    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found. Run build first."
    fi

    cat > "$BUILD_DIR/.htaccess" << 'EOF'
# Enable Rewrite Engine for SPA routing
RewriteEngine On
RewriteBase /

# Handle static files directly
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOF

    print_success ".htaccess file created"
}

# Show deployment status
show_status() {
    print_step "Deployment Status Check"

    echo "Frontend Build:"
    if [ -d "$BUILD_DIR" ]; then
        print_success "Build directory exists"
        print_step "Size: $(du -sh $BUILD_DIR | cut -f1)"
        print_step "Files: $(find $BUILD_DIR -type f | wc -l)"
    else
        print_warning "Build directory not found"
    fi

    echo ""
    echo "Environment Files:"
    if [ -f "$FRONTEND_DIR/.env.production" ]; then
        print_success ".env.production exists"
    else
        print_warning ".env.production missing"
    fi

    echo ""
    echo "FTP Configuration:"
    print_step "Server: $FTP_SERVER"
    print_step "User: $FTP_USER"
    print_step "Path: $FTP_PATH"
}

# Main menu
case "${1:-}" in
    "build")
        check_directories
        install_dependencies
        build_frontend
        create_htaccess
        print_success "Build completed! Run './deploy.sh deploy' to upload"
        ;;

    "test")
        test_build
        ;;

    "deploy")
        deploy_ftp
        ;;

    "status")
        show_status
        ;;

    "all")
        check_directories
        install_dependencies
        build_frontend
        create_htaccess
        deploy_ftp
        ;;

    *)
        echo "CENTO E-Commerce Deployment Helper"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build     - Build frontend for production"
        echo "  test      - Test build locally"
        echo "  deploy    - Deploy to cPanel via FTP"
        echo "  status    - Show deployment status"
        echo "  all       - Build and deploy"
        echo ""
        echo "Example:"
        echo "  $0 build     # Build the application"
        echo "  $0 deploy    # Deploy to cPanel"
        echo "  $0 all       # Build and deploy in one step"
        exit 0
        ;;
esac