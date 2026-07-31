# Rozgaar Mitra — Step-by-Step Production Deployment Checklist

Target Domain: **`rozgaarmitra.com`** / **`www.rozgaarmitra.com`**
Production Hosting: **Vercel** (Frontend & Next.js API Routes)
Production Database & Storage: **Supabase** (PostgreSQL Database + Storage Buckets)

---

## Pre-Deployment Environment Checklist

- [x] Next.js 14 App Router layout & strict TypeScript configuration.
- [x] PostgreSQL Prisma schema with foreign key indexes on `Job(status)`, `Job(category)`, `Job(location)`.
- [x] Seed dataset with 5 approved companies, 20 realistic Indian private sector jobs, and candidate profiles.
- [x] Rule-based matching engine module (`lib/matching.ts`).
- [x] DPDP Act 2023 compliant Privacy Policy and Terms of Service.

---

## Step 1: Provision Supabase PostgreSQL Database & Storage

1. Log into [Supabase Dashboard](https://app.supabase.com) and create project `rozgaarmitra-db`.
2. Copy the PostgreSQL connection URI under **Project Settings -> Database -> Connection String**.
3. Create a public Storage Bucket named `resumes` for candidate PDF attachments.
4. Execute Prisma migrations to build tables and indexes:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

## Step 2: Configure Environment Variables in Vercel

In your Vercel Project Settings -> **Environment Variables**, add:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"
NEXTAUTH_URL="https://rozgaarmitra.com"
NEXTAUTH_SECRET="your-production-jwt-secret-key-32-chars"
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## Step 3: Connect Custom Domain `rozgaarmitra.com`

1. In Vercel Project Dashboard, navigate to **Settings -> Domains**.
2. Add `rozgaarmitra.com` and `www.rozgaarmitra.com`.
3. Log into your DNS Registrar (GoDaddy / Namecheap) and configure DNS records:
   - **Type A Record**: Name `@` -> Value `76.76.21.21`
   - **Type CNAME Record**: Name `www` -> Value `cname.vercel-dns.com`
4. Wait 5-15 minutes for SSL certificate issuance and DNS propagation.

---

## Step 4: Final Security & Launch Pass

- [x] Verify rate limiting on login and OTP endpoints.
- [x] Confirm candidate resume PDF upload file validation (PDF only, max 5MB).
- [x] Verify data isolation: Company users can only access their own posted jobs and applicants.
- [x] Verify SSL HTTPS lock icon on `https://rozgaarmitra.com`.
