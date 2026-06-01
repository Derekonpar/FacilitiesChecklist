# TestFlight — FacilitiesChecklist iOS

Native shell app that loads your **Vercel** web app (submit issues + manager dashboard).

## Before you archive

### 1. Deploy the web app to Vercel

From the repo root:

```bash
npx vercel --prod
```

In Vercel → **Settings → Environment Variables**, add the same values as `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key)
- `SUPABASE_SERVICE_ROLE_KEY`
- `MANAGER_PIN`

Copy your production URL (e.g. `https://facilities-checklist-xxx.vercel.app`).

### 2. Point the iOS app at production

Edit **`ios/Config/Release.xcconfig`**:

```
WEB_APP_URL = https:/$()/YOUR-ACTUAL-VERCEL-URL.vercel.app
```

(No trailing slash. Keep the `/$()/` — it escapes `//` in xcconfig files.)

### 3. App icon (required for App Store Connect)

In Xcode: **FacilitiesChecklist → Assets → AppIcon** → drag a **1024×1024** PNG.

---

## Xcode setup (one time)

1. Open **`ios/FacilitiesChecklist.xcodeproj`** in Xcode.
2. Select the **FacilitiesChecklist** target → **Signing & Capabilities**.
3. Set **Team** to your Apple Developer team.
4. Confirm **Bundle Identifier**: `com.onparentertainment.facilitieschecklist`  
   (Change it if this ID is already taken in your account.)
5. Run on a **physical iPhone** once to verify it loads your Vercel URL.

> If you already created a separate Xcode project named FacilitiesChecklist, you can delete it and use this one in the repo, or drag the Swift files from `ios/FacilitiesChecklist/` into your project.

---

## App Store Connect (one time)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → **New App**.
2. **Platform:** iOS  
3. **Name:** On Par Facilities (or Facilities Checklist)  
4. **Bundle ID:** same as Xcode (`com.onparentertainment.facilitieschecklist`)  
5. **SKU:** `facilities-checklist` (any unique string)

---

## Upload to TestFlight

### In Xcode (recommended)

1. Select destination **Any iOS Device (arm64)** (not Simulator).
2. **Product → Archive**.
3. When Organizer opens: **Distribute App** → **App Store Connect** → **Upload**.
4. Answer export compliance: **No** (we set `ITSAppUsesNonExemptEncryption = false` in Info.plist).

### Wait for processing

App Store Connect → your app → **TestFlight**. Processing usually takes **5–30 minutes**.

---

## Invite coworkers

### Internal testing (fastest, up to 100 people)

1. TestFlight → **Internal Testing** → create a group.
2. Add testers by Apple ID email (they must be in your App Store Connect **Users and Access** team, or use internal group rules).

### External testing (any email, needs brief Beta review)

1. **External Testing** → new group → add builds.
2. Submit for Beta App Review (first time only).
3. Share the **public link** or invite by email.

Coworkers install the **TestFlight** app from the App Store, accept the invite, then install **On Par Facilities**.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| White screen | Wrong `WEB_APP_URL` in Release.xcconfig; deploy Vercel first |
| Can’t sign in / submit on device | Vercel env vars missing; check Supabase RLS migrations |
| Archive fails signing | Set Development Team in Signing & Capabilities |
| “Missing compliance” | In App Store Connect, set encryption to **No** for standard HTTPS-only app |

## Command-line archive (optional)

```bash
cd ios
xcodebuild -scheme FacilitiesChecklist -configuration Release \
  -archivePath build/FacilitiesChecklist.xcarchive archive \
  DEVELOPMENT_TEAM=YOUR_TEAM_ID

xcodebuild -exportArchive \
  -archivePath build/FacilitiesChecklist.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export
```

Then upload `build/export/FacilitiesChecklist.ipa` with **Transporter** or Xcode Organizer.
