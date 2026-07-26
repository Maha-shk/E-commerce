# =============================================================================
# CENTO E-Commerce - Deployment Helper Script (PowerShell)
# =============================================================================
# This script helps with the deployment process to cPanel
# Usage: .\deploy.ps1 [command]
# =============================================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("build", "test", "deploy", "status", "all", "help")]
    [string]$Command = "help"
)

# Configuration
$FRONTEND_DIR = "frontend"
$BACKEND_DIR = "backend"
$BUILD_DIR = "$FRONTEND_DIR\out"
$FTP_SERVER = "69.10.38.126"
$FTP_USER = "centoser"
$FTP_PASSWORD = "s?Q%qN4q"
$FTP_PATH = "/public_html"

# Functions
function Print-Step {
    param([string]$Message)
    Write-Host "==>" -ForegroundColor Green -NoNewline
    Write-Host " $Message"
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️" -ForegroundColor Yellow -NoNewline
    Write-Host " $Message"
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌" -ForegroundColor Red -NoNewline
    Write-Host " $Message"
    exit 1
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅" -ForegroundColor Green -NoNewline
    Write-Host " $Message"
}

# Check if required directories exist
function Test-ProjectStructure {
    Print-Step "Checking project structure..."

    if (-not (Test-Path $FRONTEND_DIR)) {
        Print-Error "Frontend directory not found: $FRONTEND_DIR"
    }

    if (-not (Test-Path $BACKEND_DIR)) {
        Print-Error "Backend directory not found: $BACKEND_DIR"
    }

    Print-Success "Project structure verified"
}

# Install dependencies
function Install-Dependencies {
    Print-Step "Installing frontend dependencies..."
    Push-Location $FRONTEND_DIR
    try {
        npm install
        Print-Success "Dependencies installed"
    }
    finally {
        Pop-Location
    }
}

# Build frontend for production
function Build-Frontend {
    Print-Step "Building frontend for production..."

    Push-Location $FRONTEND_DIR

    try {
        # Check if .env.production exists
        if (-not (Test-Path ".env.production")) {
            Print-Warning ".env.production not found, creating from template..."
            "NEXT_PUBLIC_API_URL=https://api.cento-servizi.it/api" | Out-File -FilePath ".env.production"
        }

        # Build the application
        npm run build

        if (-not (Test-Path $BUILD_DIR)) {
            Print-Error "Build failed - output directory not found"
        }

        Print-Success "Frontend built successfully"

        # Get build size
        $size = (Get-ChildItem -Path $BUILD_DIR -Recurse |
                 Measure-Object -Property Length -Sum).Sum / 1MB
        Print-Step "Build output: $([math]::Round($size, 2)) MB"
    }
    finally {
        Pop-Location
    }
}

# Test the build locally
function Test-Build {
    Print-Step "Testing build locally..."
    Print-Warning "Testing requires manual verification"
    Print-Step "Open: file://$((Get-Location).Path)\$BUILD_DIR\index.html"
    Print-Step "Or install and run: npx serve $BUILD_DIR"
}

# Deploy via FTP
function Deploy-FTP {
    Print-Step "Deployment to cPanel requires manual FTP upload"
    Print-Warning "Please use FileZilla or similar FTP client:"
    Print-Step "  Host: $FTP_SERVER"
    Print-Step "  User: $FTP_USER"
    Print-Step "  Password: $FTP_PASSWORD"
    Print-Step "  Path: $FTP_PATH"
    Print-Step "  Local: $BUILD_DIR"
    Print-Step ""
    Print-Step "Alternatively, set up GitHub Actions for automatic deployment"
}

# Create .htaccess file
function Create-Htaccess {
    Print-Step "Creating .htaccess file..."

    if (-not (Test-Path $BUILD_DIR)) {
        Print-Error "Build directory not found. Run build first."
    }

    $htaccessContent = @"
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
"@

    $htaccessContent | Out-File -FilePath "$BUILD_DIR\.htaccess" -Encoding UTF8
    Print-Success ".htaccess file created"
}

# Show deployment status
function Show-Status {
    Print-Step "Deployment Status Check"

    Write-Host "`nFrontend Build:" -ForegroundColor Cyan
    if (Test-Path $BUILD_DIR) {
        Print-Success "Build directory exists"
        $size = (Get-ChildItem -Path $BUILD_DIR -Recurse |
                 Measure-Object -Property Length -Sum).Sum / 1MB
        Print-Step "Size: $([math]::Round($size, 2)) MB"
        $files = (Get-ChildItem -Path $BUILD_DIR -Recurse -File).Count
        Print-Step "Files: $files"
    } else {
        Print-Warning "Build directory not found"
    }

    Write-Host "`nEnvironment Files:" -ForegroundColor Cyan
    if (Test-Path "$FRONTEND_DIR\.env.production") {
        Print-Success ".env.production exists"
    } else {
        Print-Warning ".env.production missing"
    }

    Write-Host "`nFTP Configuration:" -ForegroundColor Cyan
    Print-Step "Server: $FTP_SERVER"
    Print-Step "User: $FTP_USER"
    Print-Step "Path: $FTP_PATH"
}

# Show help
function Show-Help {
    Write-Host "CENTO E-Commerce Deployment Helper (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  build     - Build frontend for production"
    Write-Host "  test      - Test build locally"
    Write-Host "  deploy    - Show FTP deployment instructions"
    Write-Host "  status    - Show deployment status"
    Write-Host "  all       - Build and prepare for deployment"
    Write-Host "  help      - Show this help message"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\deploy.ps1 build     # Build the application"
    Write-Host "  .\deploy.ps1 status    # Check deployment status"
    Write-Host "  .\deploy.ps1 all       # Prepare everything for deployment"
}

# Main execution
switch ($Command) {
    "build" {
        Test-ProjectStructure
        Install-Dependencies
        Build-Frontend
        Create-Htaccess
        Print-Success "Build completed! Run '.\deploy.ps1 deploy' for upload instructions"
    }

    "test" {
        Test-Build
    }

    "deploy" {
        Deploy-FTP
    }

    "status" {
        Show-Status
    }

    "all" {
        Test-ProjectStructure
        Install-Dependencies
        Build-Frontend
        Create-Htaccess
        Deploy-FTP
    }

    "help" {
        Show-Help
    }
}