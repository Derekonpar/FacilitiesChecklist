# On Par Entertainment — Facilities Checklist

Maintenance issue reporting for floor staff and a MaintainX-style manager dashboard with **real-time** updates.

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run in order:
   - `supabase/migrations/001_issues.sql`
   - `supabase/migrations/002_realtime_rls_storage.sql`
3. In **Database → Replication**, confirm `issues` is enabled for Realtime (the migration adds it to `supabase_realtime`).
4. Copy **Project URL**, **anon key**, and **service_role key** from Settings → API.

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (submit + live dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (manager complete/recall) |
| `MANAGER_PIN` | Shared PIN for `/lead` |

Add the same variables in **Vercel** → Project → Settings → Environment Variables.

### 3. Run locally

```bash
npm install
npm run dev
```

- **Report issue:** http://localhost:3000/submit  
- **Manager dashboard:** http://localhost:3000/lead (enter `MANAGER_PIN`)

New submissions appear on the dashboard **immediately** via Supabase Realtime.

## Deploy (Vercel)

```bash
npx vercel --prod
```

Link the GitHub repo and set all env vars above for Production.

## iOS / TestFlight

See **[ios/TESTFLIGHT.md](ios/TESTFLIGHT.md)**. Open `ios/FacilitiesChecklist.xcodeproj`, set your Apple Team, update `ios/Config/Release.xcconfig` with your Vercel URL, then **Product → Archive** → upload to TestFlight.

## GitHub

```bash
git remote add origin https://github.com/Derekonpar/FacilitiesChecklist.git
git push -u origin main
```
