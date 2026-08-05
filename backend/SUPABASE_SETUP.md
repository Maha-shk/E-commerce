# Supabase PostgreSQL Setup Guide

Complete guide to connect your e-commerce project with Supabase PostgreSQL database.

## Prerequisites

- Node.js and npm installed
- Supabase account (free tier works perfectly)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project" 
3. Fill in project details:
   - **Name**: Your project name (e.g., "cento-ecommerce")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project provisioning (~2 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is ready, get your credentials:

### Database Connection String
1. Go to **Settings → Database**
2. Find "Connection string" section
3. Select "URI" format
4. Copy the string (it looks like):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

### API Keys
1. Go to **Project Settings → API**
2. Copy these values:
   - **Project URL** (https://your-project.supabase.co)
   - **anon/public key** 
   - **service_role key** (keep this secret!)

## Step 3: Update Your `.env` File

Replace the placeholder values in your `.env` file:

```env
# Update DATABASE_URL with your Supabase connection string
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=public

# Add Supabase configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: 
- Replace `YOUR_SUPABASE_PASSWORD` with your database password
- Replace connection string parts with your actual values
- Keep service_role key secret - never commit to git

## Step 4: Run Database Migrations

Push your Prisma schema to Supabase:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Or if you want to use migrations:
```bash
npx prisma migrate deploy
```

## Step 5: Seed the Database

Create the initial admin user and sample data:

```bash
npm run db:seed
```

This will create:
- Super admin user (credentials from your `.env`)
- Sample categories, products, and other data

## Step 6: Test the Connection

Start your development server:

```bash
npm run start:dev
```

Test the API:
```bash
# Health check
curl http://localhost:4000/

# Test auth endpoint
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cento.local","password":"ChangeMe123!"}'
```

## Step 7: Verify in Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. You should see all your tables:
   - User, Product, Order, Category, etc.
   - Browse data to verify seeded data

## Optional: Enable Supabase Features

### Row Level Security (RLS)
Enable RLS policies in Supabase Table Editor:

```sql
-- Enable RLS
ALTER TABLE user ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own profile" 
ON user FOR SELECT 
USING (auth.uid()::text = id);
```

### Storage for Product Images
1. Go to **Storage** in Supabase
2. Create bucket `products`
3. Make it public
4. Update your code to use Supabase storage

### Real-time Features
Enable real-time for specific tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE product;
ALTER PUBLICATION supabase_realtime ADD TABLE order;
```

## Troubleshooting

### Connection Issues
- **SSL Certificate Error**: Add `?sslmode=require` to DATABASE_URL
- **Timeout**: Check your network and Supabase status
- **Password Wrong**: Reset in Supabase dashboard

### Migration Issues
```bash
# Reset and try again
npx prisma migrate reset --force
npm run db:seed
```

### Permission Issues
- Ensure your database user has proper permissions
- Check Supabase logs: **Database → Logs**

## Next Steps

1. **Set up production environment**: Create separate Supabase project for prod
2. **Configure backups**: Supabase auto-backups are included
3. **Enable monitoring**: Use Supabase dashboard for insights
4. **Set up CI/CD**: Use environment variables for deployment

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/platform/prisma)
- [NestJS with Supabase](https://supabase.com/docs/guides/backend/integrations/integrating-with-frameworks)

## Environment Variables Reference

```env
# Required
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Optional but recommended
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Security Note**: Never commit `.env` to git. Use `.env.example` with placeholders.
