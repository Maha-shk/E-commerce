# PostgreSQL Setup for cPanel Deployment

## 🐘 PostgreSQL Database Setup for cPanel

Your CENTO e-commerce platform uses **PostgreSQL** (not MySQL). Here's how to set it up in cPanel:

### Step 1: Access PostgreSQL Databases in cPanel

1. Login to cPanel: https://webhosting3003.is.cc:2083
2. Navigate to **"Databases"** → **"PostgreSQL Databases"**

### Step 2: Create PostgreSQL Database

1. **Create New Database**:
   - Under "Create New Database"
   - Database name: `cento_prod` (or similar name)
   - Click **"Create Database"**
   - **Important**: Note the full database name - it will be prefixed: `centoser_cento_prod`

2. **Create Database User**:
   - Scroll down to "Create New User"
   - Username: `cento_admin` (or similar)
   - Generate a strong password (use cPanel password generator)
   - Click **"Create User"**

3. **Add User to Database**:
   - Scroll down to "Add User to Database"
   - Select the user you just created
   - Select the database you just created
   - Click **"Add"**
   - On the next screen, select **"ALL PRIVILEGES"**
   - Click **"Make Changes"**

### Step 3: Save Database Credentials

You'll need these for your environment variables:

```
Database Name: centoser_cento_prod
Username: centoser_centoadmin
Password: [YourGeneratedPassword]
Host: localhost
Port: 5432
```

### Step 4: Configure DATABASE_URL

For PostgreSQL, your connection string format is:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

Example with your credentials:
```
DATABASE_URL=postgresql://centoser_centoadmin:YourPassword@localhost:5432/centoser_cento_prod
```

### PostgreSQL vs MySQL Differences

| Aspect | PostgreSQL | MySQL |
|--------|-----------|-------|
| **Wizard in cPanel** | "PostgreSQL Databases" | "MySQL Database Wizard" |
| **Default Port** | 5432 | 3306 |
| **Connection String** | `postgresql://...` | `mysql://...` |
| **Database Extension** | Uses Prisma + pg | Uses Prisma + mysql2 |
| **Your Setup** | ✅ **This is what you use** | ❌ Not your setup |

### Environment Variables Configuration

In cPanel Node.js app settings, add these environment variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://centoser_centoadmin:YourPassword@localhost:5432/centoser_cento_prod
JWT_SECRET=your-super-secure-random-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@cento-servizi.it
ADMIN_PASSWORD=YourSecureAdminPassword123!
FRONTEND_URL=https://admin.cento-servizi.it
```

### Testing Database Connection

After deployment, test your PostgreSQL connection:

1. **Via cPanel Terminal**:
   ```bash
   cd backend_api
   npx prisma db push
   npx prisma studio
   ```

2. **Check Database Logs**:
   ```bash
   # In cPanel, check error logs
   tail -f /home/centoser/logs/backend_api/error.log
   ```

### PostgreSQL Management Tools

In cPanel, you can manage your PostgreSQL database via:

1. **phpPgAdmin**: Access via cPanel → "PostgreSQL Databases" → "phpPgAdmin"
2. **Terminal**: SSH access to run psql commands
3. **Prisma Studio**: Run `npx prisma studio` in your backend directory

### Common PostgreSQL Issues

**Connection refused**:
- Ensure PostgreSQL service is running in cPanel
- Verify port 5432 is not blocked
- Check database name format (includes username prefix)

**Authentication failed**:
- Verify username and password in DATABASE_URL
- Ensure user has ALL PRIVILEGES on the database
- Check that database exists in PostgreSQL Databases section

**Migration fails**:
- Ensure Prisma client is generated: `npx prisma generate`
- Check database connection string format
- Verify PostgreSQL user has CREATE TABLE permissions

### Backup and Restore

**Backup via cPanel**:
1. Navigate to "PostgreSQL Databases"
2. Click "Backup" next to your database
3. Download the backup file

**Restore via cPanel**:
1. Navigate to "PostgreSQL Databases"  
2. Click "Restore" next to your database
3. Upload your backup file

### Prisma + PostgreSQL Specifics

Your backend uses **Prisma ORM** with PostgreSQL:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Run migrations (PostgreSQL)
npx prisma migrate deploy

# Seed database (creates admin user)
npm run db:seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

### PostgreSQL Advantages for E-commerce

Your choice of PostgreSQL is excellent for e-commerce:

- **Complex Queries**: Better for inventory analytics
- **Data Integrity**: ACID compliance for order processing  
- **Scalability**: Handles large product catalogs efficiently
- **JSON Support**: Flexible product attribute storage
- **Full-text Search**: Better product search capabilities

---

**🎯 Quick Reference**:
- **Your Database Type**: PostgreSQL (not MySQL!)
- **cPanel Location**: Databases → PostgreSQL Databases
- **Default Port**: 5432
- **Connection Prefix**: `postgresql://`
- **Management Tool**: phpPgAdmin