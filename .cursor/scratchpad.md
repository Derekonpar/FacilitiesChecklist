# Facilities Checklist — Product Plan

## Background and Motivation

A new facilities & maintenance lead starts **this week**. Staff across 16 venue departments need a fast way to report issues (comment + photo + auto timestamp). The lead needs a single queue: new issues appear immediately, he marks them done, completed work is stored, and he can **recall** past items to the top when they recur.

**Stack (agreed):**
- **Next.js** on Vercel (web, mobile-friendly)
- **Supabase** (Postgres + Storage + Realtime + optional Auth)
- **Future:** native iOS via **Xcode / TestFlight** (same Supabase backend)

**Design principles:** speed on the floor, minimal taps, clean UI, real-time updates, durable history, API-first so iOS reuses the same data layer.

---

## Key Challenges and Analysis

| Challenge | Approach |
|-----------|----------|
| Staff won’t install apps day one | Mobile-first web; optional “Add to Home Screen”; QR codes per department |
| Photos on slow Wi‑Fi | Compress client-side; upload to Supabase Storage; show upload progress |
| Lead must see issues instantly | Supabase Realtime on `issues` table |
| Recall = “back to top” | `recalled_at` + sort: open recalled first, then by priority, then `created_at` |
| Two roles, low friction | Simple PIN or magic link per role (not full SSO for v1) |
| iOS later without rewrite | All logic in Supabase RLS + shared schema; Swift uses `supabase-swift` |
| Week-one deadline | Ship **MVP in 3–4 days**, polish + extras in week 2 |

### User personas

1. **Floor staff** — Submit issue in &lt;30 seconds: pick department (often pre-filled), optional priority, comment, photo, submit. See “Submitted” confirmation only (no queue clutter).
2. **Facilities lead** — Live inbox: filter by department/status, complete with optional note, recall from history, see age (“2h ago”).
3. **Manager (optional v2)** — Read-only dashboard: open count, avg resolution time by department.

### Departments (fixed enum)

`bowling`, `karaoke`, `darts`, `mini_golf`, `shuffleboard`, `foosball`, `cleaning`, `beverage`, `outdoor`, `main_wall`, `kitchen`, `front_desk`, `break_room`, `dock`, `bathroom`, `vip`

Display labels: human-readable (“Mini Golf”, “Front Desk”, etc.).

---

## Product Vision

### Core flows

**Submit (employee)**
1. Land on `/submit` (or `/submit?dept=kitchen` from QR).
2. Department selected (dropdown or QR prefill).
3. Comment (required, min 3 chars).
4. Photo (optional, camera on mobile).
5. Auto `created_at` on insert.
6. Success toast + optional “Submit another”.

**Inbox (facilities lead)**
1. Land on `/lead` (protected).
2. Tabs or filters: **Open** | **Completed** | **All**.
3. Open list sorted: recalled → urgent → oldest first (or configurable).
4. Card shows: department, comment snippet, photo thumb, relative time, submitter label if provided.
5. Tap → detail: full comment, photo, complete button, optional completion note.
6. **Recall** on completed row → sets `recalled_at`, status back to `open`, appears at top.

**Realtime**
- New row INSERT → lead UI updates without refresh.
- UPDATE (complete/recall) → both lists stay in sync.

### Differentiators (impressive but scoped)

| Feature | Phase | Why it matters |
|---------|-------|----------------|
| QR per department | MVP+ | Zero navigation; scan at station → submit form pre-filled |
| Priority: Normal / Urgent | MVP | Lead sorts critical guest-impact first |
| Issue type tags | v1.1 | Broken, Supplies, Cleanliness, Safety — better routing & stats |
| Link related issues | v1.1 | Same broken pinsetter reported twice → merge context |
| Age badge + SLA hint | MVP | “4h” in red after threshold |
| Completion note + optional after photo | MVP | Audit trail for management |
| Push / email on urgent | v2 | Lead off-floor still notified |
| Weekly summary email | v2 | Prove value to ownership |
| Offline submit queue | v2 | PWA + IndexedDB retry when back online |
| Analytics page | v2 | Median time-to-close by department |

---

## Technical Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Staff Web/PWA  │     │  Lead Web/PWA    │     │  iOS (future)   │
│  /submit        │     │  /lead           │     │  SwiftUI +      │
└────────┬────────┘     └────────┬─────────┘     │  supabase-swift │
         │                       │               └────────┬────────┘
         └───────────────────────┼────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Supabase              │
                    │  • Postgres (issues)   │
                    │  • Storage (photos)    │
                    │  • Realtime            │
                    │  • Auth (optional PIN) │
                    └────────────────────────┘
                                 ▲
                    ┌────────────┴───────────┐
                    │  Next.js on Vercel     │
                    │  App Router, RSC where │
                    │  possible; client for  │
                    │  camera/realtime       │
                    └────────────────────────┘
```

### Recommended stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15+ App Router, TypeScript |
| UI | Tailwind + shadcn/ui (fast, accessible) |
| DB | Supabase Postgres |
| Files | Supabase Storage bucket `issue-photos` |
| Client | `@supabase/supabase-js` + `@supabase/ssr` |
| Deploy | Vercel; env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Auth v1 | Supabase Auth: email magic link for lead OR shared staff PIN in env + cookie; tighten RLS in v1.1 |
| Realtime | `supabase.channel('issues').on('postgres_changes', ...)` |

**Photo path:** `{issue_id}/{uuid}.jpg` — private bucket, signed URLs for display.

### iOS path (Phase 3 — TestFlight)

**Recommended:** Native **SwiftUI** app using [supabase-swift](https://github.com/supabase/supabase-swift), not wrapping the Next.js site.

- Reuse: same tables, Storage, Realtime, Auth.
- Lead-focused v1 iOS (inbox + complete + recall); staff can keep using web QR flow.
- Alternative (faster, weaker UX): Capacitor WebView — only if timeline forces it.

---

## Data Model

### Table: `issues`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `department` | text | check against enum |
| `comment` | text | required |
| `photo_path` | text nullable | Storage path |
| `priority` | text | `normal` \| `urgent`, default `normal` |
| `status` | text | `open` \| `completed`, default `open` |
| `issue_type` | text nullable | v1.1: broken, supplies, cleanliness, safety |
| `submitted_by` | text nullable | optional name/initials |
| `created_at` | timestamptz | default `now()` |
| `completed_at` | timestamptz nullable | set on complete |
| `completion_note` | text nullable | lead note |
| `completion_photo_path` | text nullable | optional after photo |
| `recalled_at` | timestamptz nullable | set on recall; clear on re-complete |
| `related_issue_id` | uuid nullable FK → issues | v1.1 |
| `updated_at` | timestamptz | trigger |

### Sort for lead open queue

```sql
ORDER BY
  recalled_at DESC NULLS LAST,
  CASE priority WHEN 'urgent' THEN 0 ELSE 1 END,
  created_at ASC
```

### RLS (sketch)

- **Insert:** anon/authenticated allowed for `status = 'open'` only (staff submit).
- **Select open:** lead role only (or service role on server actions initially).
- **Update:** lead role only (complete, recall).
- **Select completed:** lead role; staff no access to history in v1.

Start with **Server Actions + service role** for lead routes if RLS setup is tight on deadline; migrate to RLS before production hardening.

### Table: `departments` (optional seed)

Static seed data for labels + QR slug; or hardcode in app enum for MVP.

---

## UI / UX Outline

### Staff `/submit`
- Large department grid (icons/colors per zone) OR compact dropdown if preferred.
- Comment textarea, prominent.
- Photo: “Take photo” / “Choose file” — preview before submit.
- Big **Submit issue** button; disabled until valid.
- Footer: “Your report is sent to Facilities” — no login required if using PIN-at-venue model.

### Lead `/lead`
- Header: open count badge, last updated indicator (realtime dot).
- Filter chips: All departments + multi-select.
- Issue cards: left color strip by department, urgent pill, time ago.
- Swipe or button: **Complete** (modal: optional note).
- Completed tab: search + **Recall to top** action.
- Empty states with friendly copy.

### Branding
- Venue name in header; high contrast for floor lighting; min 44px touch targets.

### MaintainX-inspired UI (2026-06-01)

Reference: MaintainX Work Orders — list + detail split, filter bar, status pills, priority dots, photo thumbnails.

**Manager `/lead` layout:**
- Left icon sidebar (Issues, Calendar, Submit link, settings placeholder)
- Top bar: title, view toggle **List | Calendar**, search, filters
- **List view:** To Do / Done tabs; scrollable issue cards (thumb, dept, submitter, status, priority); right detail pane with Open / On Hold / In Progress / Done status row, metadata (reported time, department, priority, ID), description, attachments
- **Calendar view:** Month / Week toggle; issues on `created_at` date; color by department; click opens detail drawer/modal
- Filters: Department, Priority, Status, Submitted by (+ search)

**Staff `/submit`:** Simpler full-page form (same brand colors), no split view.

**Schema add (v1.1 UI):** `workflow_status` (`open` | `on_hold` | `in_progress`) while `status = open`; `done` → `status = completed`.

---

## High-level Task Breakdown

### Phase 0 — Setup (Day 0)
- [ ] **0.1** Create Next.js app + Tailwind + shadcn — *Success: `npm run dev` loads home*
- [ ] **0.2** Create Supabase project, bucket, run migration SQL — *Success: `issues` table exists*
- [ ] **0.3** Vercel project + env vars — *Success: preview deploy connects to Supabase*

### Phase 1 — MVP (Days 1–3) — **Target before lead’s first shift**
- [ ] **1.1** Department enum + types shared in `lib/constants.ts`
- [ ] **1.2** Staff submit page: form, client photo upload, insert issue — *Success: row in DB with `created_at`*
- [ ] **1.3** Lead inbox: list open issues, realtime subscription — *Success: new submit appears without refresh*
- [ ] **1.4** Complete flow: set `completed_at`, `status`, optional note — *Success: moves to completed tab*
- [ ] **1.5** Completed history + Recall (`recalled_at`, status `open`) — *Success: recalled issue at top of open queue*
- [ ] **1.6** Basic auth gate on `/lead` (env password or Supabase user) — *Success: staff cannot access lead URL*
- [ ] **1.7** Deploy production URL + test on phone — *Success: end-to-end on cellular*

### Phase 2 — Polish (Days 4–7)
- [ ] **2.1** QR codes page `/qr` printing one per department
- [ ] **2.2** Priority urgent + visual SLA aging
- [ ] **2.3** Signed URLs for photos; image compression
- [ ] **2.4** PWA manifest + icons (home screen install)
- [ ] **2.5** Optional `submitted_by` field on submit form

### Phase 3 — iOS TestFlight (Week 2+)
- [ ] **3.1** Xcode SwiftUI project + Supabase Swift SDK
- [ ] **3.2** Lead inbox parity (list, detail, complete, recall, realtime)
- [ ] **3.3** TestFlight internal testing

### Phase 4 — Intelligence (Later)
- [ ] **4.1** Issue types + related issues
- [ ] **4.2** Analytics dashboard
- [ ] **4.3** Notifications (urgent)

---

## Project Status Board

- [x] Planner review approved by human (config answers 2026-06-01)
- [ ] Phase 0 — Setup (0.1 in progress)
- [ ] Phase 1 — MVP
- [ ] Phase 2 — Polish
- [ ] Phase 3 — iOS

---

## Current Status / Progress Tracking

**2026-06-01 — Planner:** Greenfield repo. Full product plan documented.

**2026-06-01 — Config locked:** On Par Entertainment; manager shared PIN; staff name required; staff can set urgent.

**2026-06-01 — Executor:** Phase 0.1 — Next.js scaffold restored; `constants.ts`, Supabase migration SQL, `.env.example`, branded home page added. Awaiting Supabase project + `MANAGER_PIN` for 0.2–0.3.

**2026-06-01 — Executor:** MaintainX-style manager UI at `/lead` — list split view (To Do / Done, cards, detail pane), status row (Open / On Hold / In Progress / Done), filters, search, calendar tab (month/week). Staff `/submit` form styled to match. Mock data until Supabase wired.

**2026-06-01 — Executor:** Supabase submit + Realtime dashboard wired. Pushed to https://github.com/Derekonpar/FacilitiesChecklist. User must run SQL migrations + set Vercel env vars for production.

---

## Executor's Feedback or Assistance Requests

**Decisions locked (2026-06-01):**

1. **Venue name:** On Par Entertainment
2. **Auth:** Shared PIN for **Managers only** — only managers can access complete/recall (`/lead`)
3. **Staff submit:** **Name required** on each issue
4. **Departments:** No changes to the 16-department list
5. **Urgent:** Staff **can** mark issues urgent on submit

**Auth model (v1):**
- `/submit` — public (no PIN); name + department + comment + optional photo + optional urgent
- `/lead` — manager PIN gate (cookie/session); complete + recall + realtime inbox
- Facilities lead uses same manager PIN flow unless we add a separate role later

---

## Lessons

_(Empty — populate during implementation.)_

- Include useful debug info in dev only; never expose service keys client-side.
- Read files before editing.
- Run `npm audit` if vulnerabilities appear in terminal output.
