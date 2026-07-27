@echo off
REM Main Deployment Script for CENTO E-commerce Platform
REM This script prepares both frontend and backend for cPanel deployment

echo =========================================
echo CENTO E-commerce - cPanel Deployment
echo =========================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set DEPLOY_DIR=%SCRIPT_DIR%deploy-all

echo [1/3] Creating deployment directories...
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"

echo [2/3] Building backend...
cd "%SCRIPT_DIR%backend"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed!
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed!
    pause
    exit /b 1
)

call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma client generation failed!
    pause
    exit /b 1
)

echo Backend build completed successfully!
echo.

echo [3/3] Building frontend...
cd "%SCRIPT_DIR%frontend"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed!
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    pause
b 1
)

echo Frontend build completed successfully!
echo.

echo =========================================
echo ✅ BUILD COMPLETED SUCCESSFULLY!
echo =========================================
echo.
echo The following builds are ready:
echo 📁 Backend: %SCRIPT_DIR%backend\dist
echo 📁 Frontend: %SCRIPT_DIR%frontend\.next
echo.
echo =========================================
echo 📋 NEXT STEPS FOR CPANEL DEPLOYMENT
echo =========================================
echo.
echo 1. SET UP CPANEL DATABASE:
echo    - Login to cPanel: https://webhosting3003.is.cc:2083
echo    - Go to MySQL Database Wizard
echo    - Create database and save credentials
echo.
echo 2. CREATE NODE.JS APPLICATIONS:
echo    - Go to "Setup Node.js App" in cPanel
echo    - Create backend app (api.cento-servizi.it)
echo    - Create frontend app (admin.cento-servizi.it)
echo.
echo 3. UPLOAD FILES:
echo    - Use cPanel File Manager or FTP
echo    - Upload backend files to your backend directory
echo    - Upload frontend files to your frontend directory
echo.
echo 4. CONFIGURE ENVIRONMENT VARIABLES:
echo    - See ENV-VARS.md for required variables
echo    - Set them in cPanel Node.js app settings
echo.
echo 5. RUN MIGRATIONS:
echo    - Execute database migrations via SSH or cPanel terminal
echo.
echo 6. TEST DEPLOYMENT:
echo    - Check API health: https://api.cento-servizi.it/api/health
echo    - Check frontend: https://admin.cento-servizi.it
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.
pause