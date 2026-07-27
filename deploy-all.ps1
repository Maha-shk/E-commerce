# CENTO E-commerce - cPanel Deployment Script (PowerShell)
# This script prepares both frontend and backend for cPanel deployment

param(
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Invoke-BuildStep {
    param(
        [string]$StepName,
        [string]$Directory,
        [string[]$BuildCommands
    )

    Write-ColorOutput "`n[$StepName]" "Cyan"
    Write-ColorOutput "Working directory: $Directory" "Gray"

    $currentDir = Get-Location
    try {
        Set-Location $Directory

        foreach ($cmd in $BuildCommands) {
            Write-ColorOutput "▶ Running: $cmd" "Yellow"
            $parts = $cmd -split " "
            $exe = $parts[0]
            $args = $parts[1..($parts.Length - 1)] -join " "

            if ($Verbose) {
                Invoke-Expression "$cmd"
            } else {
                $output = Invoke-Expression "$cmd 2>&1" | Out-String
                if ($LASTEXITCODE -ne 0) {
                    Write-ColorOutput "❌ Command failed: $cmd" "Red"
                    Write-ColorOutput $output "Red"
                    throw "$StepName failed"
                }
            }
        }

        Write-ColorOutput "✅ $StepName completed!" "Green"
        Set-Location $currentDir
        return $true
    } catch {
        Write-ColorOutput "❌ $StepName failed!" "Red"
        Write-ColorOutput $_.Exception.Message "Red"
        Set-Location $currentDir
        return $false
    }
}

function New-DeploymentPackage {
    param(
        [string]$Name,
        [string]$SourcePath,
        [string[]]$IncludePaths,
        [string]$OutputPath
    )

    Write-ColorOutput "`n[Creating Deployment Package: $Name]" "Cyan"

    try {
        # Create temp directory for package
        $tempDir = Join-Path $OutputPath "temp"
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

        # Copy specified paths
        foreach ($path in $IncludePaths) {
            $source = Join-Path $SourcePath $path
            if (Test-Path $source) {
                Write-ColorOutput "  Copying: $path" "Gray"
                Copy-Item -Path $source -Destination (Join-Path $tempDir $path) -Recurse -Force
            } else {
                Write-ColorOutput "  ⚠ Warning: $path not found, skipping..." "Yellow"
            }
        }

        # Create .htaccess and other config files
        New-DeploymentConfig -Type $Name -Path $tempDir

        Write-ColorOutput "✅ Deployment package created: $tempDir" "Green"
        return $tempDir
    } catch {
        Write-ColorOutput "❌ Failed to create deployment package: $_" "Red"
        throw
    }
}

function New-DeploymentConfig {
    param(
        [string]$Type,
        [string]$Path
    )

    if ($Type -eq "backend") {
        $htaccess = @"
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
"@

        $htaccess | Out-File -FilePath (Join-Path $Path ".htaccess") -Encoding UTF8

        # Create migration script
        $migrateScript = @"
#!/bin/bash
echo "Running database migrations..."
npx prisma migrate deploy
echo "Generating Prisma client..."
npx prisma generate
echo "Seeding database..."
npm run db:seed
echo "Database setup complete!"
"@

        $migrateScript | Out-File -FilePath (Join-Path $Path "deploy-migrate.sh") -Encoding UTF8

    } elseif ($Type -eq "frontend") {
        # Create server.js for Next.js
        $serverJs = @"
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
"@

        $serverJs | Out-File -FilePath (Join-Path $Path "server.js") -Encoding UTF8

        $htaccess = @"
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
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
"@

        $htaccess | Out-File -FilePath (Join-Path $Path ".htaccess") -Encoding UTF8
    }
}

# Main deployment process
Write-ColorOutput "=========================================" "Cyan"
Write-ColorOutput "CENTO E-commerce - cPanel Deployment" "Cyan"
Write-ColorOutput "=========================================" "Cyan"

# Check prerequisites
Write-ColorOutput "`n[Checking Prerequisites]" "Cyan"
$hasNode = Test-Command "node"
$hasNpm = Test-Command "npm"

if (-not $hasNode -or -not $hasNpm) {
    Write-ColorOutput "❌ Node.js and npm are required!" "Red"
    Write-ColorOutput "Please install Node.js from https://nodejs.org/" "Yellow"
    exit 1
}

Write-ColorOutput "✅ Node.js version: $(node --version)" "Green"
Write-ColorOutput "✅ npm version: $(npm --version)" "Green"

# Backend deployment
if (-not $SkipBackend) {
    $backendDir = Join-Path $scriptDir "backend"
    $deployDir = Join-Path $scriptDir "deploy-backend"

    if (Invoke-BuildStep -StepName "Backend Deployment" -Directory $backendDir -BuildCommands @(
        "npm install",
        "npm run build",
        "npx prisma generate"
    )) {
        New-DeploymentPackage -Name "backend" -SourcePath $backendDir -IncludePaths @(
            "dist",
            "node_modules/.prisma",
            "prisma",
            "package.json",
            "package-lock.json"
        ) -OutputPath $deployDir
    }
}

# Frontend deployment
if (-not $SkipFrontend) {
    $frontendDir = Join-Path $scriptDir "frontend"
    $deployDir = Join-Path $scriptDir "deploy-frontend"

    if (Invoke-BuildStep -StepName "Frontend Deployment" -Directory $frontendDir -BuildCommands @(
        "npm install",
        "npm run build"
    )) {
        New-DeploymentPackage -Name "frontend" -SourcePath $frontendDir -IncludePaths @(
            ".next",
            "node_modules",
            "public",
            "package.json",
            "package-lock.json"
        ) -OutputPath $deployDir
    }
}

Write-ColorOutput "`n=========================================" "Cyan"
Write-ColorOutput "✅ BUILD COMPLETED SUCCESSFULLY!" "Green"
Write-ColorOutput "=========================================" "Cyan"

Write-ColorOutput "`n📁 Deployment packages created:" "Yellow"
if (Test-Path "deploy-backend\temp") {
    Write-ColorOutput "  Backend: deploy-backend\temp" "White"
}
if (Test-Path "deploy-frontend\temp") {
    Write-ColorOutput "  Frontend: deploy-frontend\temp" "White"
}

Write-ColorOutput "`n📋 NEXT STEPS:" "Cyan"
Write-ColorOutput "1. Follow DEPLOY-QUICKSTART.md for cPanel setup" "White"
Write-ColorOutput "2. Upload files from deploy-*\temp directories" "White"
Write-ColorOutput "3. Configure environment variables in cPanel" "White"
Write-ColorOutput "4. Run database migrations" "White"
Write-ColorOutput "5. Test your deployment" "White"

Write-ColorOutput "`nFor detailed instructions, see:" "Yellow"
Write-ColorOutput "- DEPLOY-QUICKSTART.md (quick guide)" "White"
Write-ColorOutput "- DEPLOYMENT.md (detailed guide)" "White"
Write-ColorOutput "- ENV-VARS.md (environment variables)" "White"