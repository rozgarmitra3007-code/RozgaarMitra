# Rozgaar Mitra (rozgaarmitra.com) — Phase 1 (MVP) Job Consultancy Platform

**Domain:** `rozgaarmitra.com` | **Business Model:** Private Sector Job Consultancy (Single Admin / Consultancy Model)

---

## 🚀 Phase 1 (MVP) Highlights & Features

- **Business Model**: Consultancy Model (Rozgaar Mitra admin posts all jobs; Job seekers build profiles and apply).
- **Design System & Palette**: Handcrafted enterprise aesthetic (`#1E40AF` primary blue, `#F8FAFC` slate background, `#E2E8F0` border, 10px rounded corners, professional typography).
- **Bilingual i18n**: English default with dynamic Hindi language switcher (`messages/en.ts`, `messages/hi.ts`).
- **Auth System**: Email + Password OR Mobile OTP alternate login verification.
- **Saved Jobs Wishlist**: Candidates can bookmark/save jobs to apply later.
- **Candidate Profile Builder & Resume View**: Tag-based skills selector, education levels, location, and resume previewer.
- **Indian Legal Compliance**: Privacy Policy compliant with India's **DPDP Act 2023** (Digital Personal Data Protection Act) and Terms of Service.
- **Admin Consultant Suite**: Job lifecycle management (`DRAFT`, `PUBLISHED`, `ARCHIVED`, `EXPIRED`), applicant status tracking (**Applied**, **Shortlisted**, **Rejected**, **Selected**), and candidate database search.
- **15 Realistic Indian Job Seeds**: Real titles, companies, cities (Delhi NCR, Lucknow, Patna, Jaipur, Mumbai, Bengaluru, WFH), and INR salary ranges.

---

## 📁 Project Structure

```
RozgaarMitra/
├── index.html              # Main web client with i18n, OTP modal, saved jobs & legal views
├── styles.css              # Enterprise design system (colors, 10px radius, clean typography)
├── app.js                  # Reactive state engine, i18n translator, OTP simulator, saved jobs
├── lib/
│   ├── constants.ts        # Taxonomies (Qualifications, Categories, Cities, Job Types)
│   └── i18n.ts             # English & Hindi translation dictionaries
├── prisma/
│   └── schema.prisma       # Prisma ORM schema (User, Profile, Job, Application, SavedJob)
├── database/
│   ├── schema.sql          # PostgreSQL DDL setup script
│   └── seed.sql            # 15 detailed Indian private sector job seeds
├── .env.example            # Environment variables template
└── README.md               # Setup & Vercel/Supabase deployment documentation
```

---

## 🌐 Deploying to `rozgaarmitra.com`

### 1. Database (PostgreSQL on Supabase / Railway)
```bash
npx prisma db push
npx prisma db seed
```

### 2. Vercel Domain Connection
1. Import repository on [Vercel](https://vercel.com).
2. Go to **Settings -> Domains** and add `rozgaarmitra.com` and `www.rozgaarmitra.com`.
3. Set DNS Records in GoDaddy / Namecheap:
   - **A Record**: `@` -> `76.76.21.21`
   - **CNAME**: `www` -> `cname.vercel-dns.com`
