# Environment Variables Reference

## Backend Environment Variables

### Required Variables
```env
# Application Environment
NODE_ENV=production

# Server Configuration
PORT=4000

# Database Connection
DATABASE_URL=postgresql://centoser_dbuser:SecurePassword123@localhost:5432/centoser_centodb

# JWT Authentication
JWT_SECRET=your-super-secure-random-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Admin Account
ADMIN_EMAIL=admin@cento-servizi.it
ADMIN_PASSWORD=YourSecureAdminPassword123!

# CORS Configuration
FRONTEND_URL=https://admin.cento-servizi.it
```

### Optional Variables
```env
# Email Configuration (for order confirmations, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@cento-servizi.it

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# File Upload Limits
MAX_FILE_SIZE=10485760
```

## Frontend Environment Variables

### Required Variables
```env
# Application Environment
NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.cento-servizi.it
NEXT_PUBLIC_APP_URL=https://admin.cento-servizi.it
```

### Optional Variables
```env
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## How to Set These in cPanel

### For Node.js Applications
1. Go to **Software** → **Setup Node.js App**
2. Click **"Edit"** next to your application
3. Scroll to **"Environment variables"** section
4. Add each variable with its value
5. Click **"Save"**

### Security Tips
1. **Generate strong JWT_SECRET**: Use a random string generator
   ```bash
   # Generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Database credentials**: Use strong passwords with special characters
3. **Admin password**: Use a unique, strong password
4. **Never commit** `.env` files to version control

## Environment-Specific Values

### Development (Local)
```env
NODE_ENV=development
DATABASE_URL=postgresql://root:password@localhost:5432/cento_dev
FRONTEND_URL=http://localhost:3000
```

### Production (cPanel)
```env
NODE_ENV=production
DATABASE_URL=postgresql://centoser_user:password@localhost:5432/centoser_prod
FRONTEND_URL=https://admin.cento-servizi.it
```

## Pre-deployment Checklist

Before deploying, ensure you have:
- [ ] Created PostgreSQL database in cPanel
- [ ] Generated strong JWT secret
- [ ] Set admin email and password
- [ ] Configured API URL for frontend
- [ ] Tested all environment variables locally
- [ ] Backed up current environment variables