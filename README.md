# BantayBarangay

A QR-code emergency reporting website for a barangay. Residents scan a poster, report an emergency in under a minute, and barangay officials manage the reports from an admin dashboard.

> **School project.** BantayBarangay is not an official emergency service and does not replace calling 911. The site says this on every page.

## What it does

**For residents (public site)**

- Scan a QR code and land on the report form. No account needed.
- First choose **Emergency** (someone is in danger or it is happening now) or **Non-emergency** (a problem that can wait), then pick the kind from large picture buttons:
  - Emergency: fire, medical, crime / safety threat, accident, flood / disaster, other emergency.
  - Non-emergency: road / street light, garbage / sanitation, noise, water / power / drainage, other concern.
- Say where it is, describe it, and send.
- "Use my current location" button saves GPS coordinates, so officials get an Open in Maps link.
- Gets a reference number (like `BB-7K3M9Q`) and can check the status later on the **Track a report** page.
- Made for students and older residents:
  - Large text, large tap targets and high contrast.
  - Three text sizes (A, A+, A++), remembered on the device.
  - English and Filipino, remembered on the device.
  - Works with a screen reader and keyboard only.
  - A "Call 911" button is always at the top.
- Optional name and contact details. Only officials can see them.

**For officials (admin site at `/admin`)**

- Password-protected login.
- **Emergency alarm:** while any emergency is still **Pending**, a red banner stays at the top of every admin page, the tab title flashes "🚨 EMERGENCY", and (if switched on) an alarm sound repeats every few seconds. It stops once every waiting emergency has been started (**Start handling**) or resolved. Non-emergency reports never trigger it.
- Waiting emergencies are highlighted and always listed first.
- Dashboard with counts for **Pending**, **In progress**, **Resolved** and **All** (each split into emergency / non-emergency), a 7-day chart and a by-type chart.
- Search, Emergency / Non-emergency tabs, status tabs and a type filter. The alarm checks every 5 seconds and refreshes the list when something changes.
- Per report: Start handling, Mark resolved, Reopen, Delete, and a **message to the reporter** that shows on their tracking page.
- **Export CSV** (opens in Excel).
- **QR poster** page: prints a ready-made poster with the QR code in English and Filipino.

**Safety and quality**

- Passwords and secrets are kept in environment variables, never in the code.
- Signed, HttpOnly login cookie that expires after 8 hours; every admin action re-checks the login.
- Spam protection: hidden bot trap field plus a limit of 5 reports per device per 10 minutes.
- The tracking page only shows status and the officials' message, never the report details or contact info.
- CSV export is protected against spreadsheet formula injection.
- Security headers, `noindex` on admin pages, friendly 404 and error pages.

## Tech stack

| Part | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + React | One project for pages and server code; deploys to Vercel with no setup |
| Database | libSQL / SQLite (`@libsql/client`) | A local file while developing, free hosted Turso database in production |
| QR codes | `qrcode` | Generated on the server as SVG, so it prints sharply |
| Styling | Plain CSS | No build tooling to learn; one file: `app/globals.css` |

## Run it on your computer (Windows)

1. Install **Node.js LTS** from https://nodejs.org (version 20 or newer). Open a **new** PowerShell window afterwards.
2. If PowerShell says scripts are disabled, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
3. In the folder that contains `package.json`:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000
5. Optional: add demo data for presenting: `npm run seed` (in a second PowerShell window; adds 11 sample reports).
6. Admin: http://localhost:3000/admin. The username and password are in the `.env.local` file.

To stop the server press **Ctrl+C**.

### Settings (environment variables)

Copy `.env.example` to `.env.local` for your computer. On Vercel, add the same names in **Project Settings > Environment Variables**.

| Name | Required | What it is |
| --- | --- | --- |
| `ADMIN_USERNAME` | yes | Admin login name |
| `ADMIN_PASSWORD` | yes | Admin password. Use a long one in production |
| `SESSION_SECRET` | yes | Random text, 32+ characters, used to sign the login cookie |
| `TURSO_DATABASE_URL` | production | Starts with `libsql://`. Leave empty locally |
| `TURSO_AUTH_TOKEN` | production | Token for the Turso database |
| `NEXT_PUBLIC_SITE_URL` | recommended | Your final website address, e.g. `https://bantaybarangay.vercel.app`, used for the QR poster |
| `NEXT_PUBLIC_EMERGENCY_NUMBER` | optional | Emergency number shown on the Call button. Default `911` |
| `REPORT_TIMEZONE` | optional | Time zone for displayed times. Default `Asia/Manila` |

## Put it online (Vercel + Turso, both have free plans)

Vercel cannot keep files between requests, so reports need a hosted database. Turso is a free hosted SQLite.

1. **Turso database**
   - Create an account at https://turso.tech and create a database (any name, nearest region).
   - Copy its **URL** (starts with `libsql://`) and create/copy an **auth token** from the database page.
   - (The menus change over time. Look for "Create database" and "Generate token".)
2. **GitHub**
   - Create a GitHub repository and upload this project. `.gitignore` already keeps `node_modules`, `.env.local` and `local.db` out.
3. **Vercel**
   - Sign in at https://vercel.com with GitHub, choose **Add New > Project**, and import the repository.
   - Before deploying, add the environment variables from the table above (at least `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
   - Click **Deploy**.
4. **After the first deploy**
   - Add `NEXT_PUBLIC_SITE_URL` with your real address, then redeploy.
   - Open `https://your-site/admin`, sign in, then open **QR poster** and print it.
   - Submit a test report from your phone and check it shows on the dashboard.
   - The reports table is created automatically on first use.

## How the emergency alarm works (and its limits)

- The dashboard asks the server every 5 seconds whether any **Emergency** report is still **Pending**.
- If yes: red banner, flashing tab title and (when switched on) the alarm sound. Pressing **Start handling** (or **Mark resolved**) on the last one stops it.
- **Turn the sound on once:** click "Turn on alarm sound" in the banner. Browsers do not allow sound until the page has been clicked, so after reopening the page click anywhere once. The choice is remembered on that computer.
- **Keep the dashboard open** on a computer or tablet at the barangay hall, with the volume up. If the browser or computer is asleep or closed, nothing rings. Background tabs can be slowed down by the browser, so keep it visible if you can.
- There is no SMS or phone push alert in this version (see next steps).

## Demo script (for presenting)

1. Run `npm run seed` first so the dashboard has data. It includes two waiting emergencies, so the alarm rings straight away.
2. Open `/admin`, click **Turn on alarm sound** and show the red banner and highlighted emergency cards.
3. Show the poster (`/admin/qr`) and scan it with a phone.
4. On the phone: tap **Filipino**, then **A++** to show accessibility.
5. Send an **Emergency** report (use the GPS button) and show the reference number. The laptop alarm gets louder in the list within seconds.
6. Send a **Non-emergency** report. Show that it appears on the dashboard but does not ring the alarm.
7. Click **Start handling** on each emergency: the alarm stops. Write a message to the reporter.
8. On the phone: **Track a report**, enter the number and show the status and message.
9. Mark reports **Resolved**, then show the counts, charts and **Export CSV**.

## Test checklist

- [ ] Submit with nothing selected: asks to choose Emergency or Non-emergency
- [ ] Submit an emergency: reference number appears, red alarm appears on the dashboard
- [ ] Submit a non-emergency: appears on the dashboard, no alarm
- [ ] Click **Start handling** on the waiting emergency: alarm stops
- [ ] Alarm sound: click "Turn on alarm sound", submit an emergency, hear it repeat
- [ ] Track with that number (with and without `BB-`): status shows
- [ ] Track with a wrong number: friendly message
- [ ] `/admin` while signed out: goes to the login page
- [ ] Wrong password: rejected. Right password: dashboard opens
- [ ] Status buttons, message to reporter, delete (with confirmation)
- [ ] Search and filters; counts match
- [ ] Export CSV opens in Excel
- [ ] Send 6 reports quickly from one device: the 6th is blocked
- [ ] Phone, tablet and desktop; text size A++; Filipino

## Project layout

```
app/
  (public)/          Public pages: report form (/) and tracking (/track)
  actions.js         Server code for sending and tracking reports
  admin/             Login, dashboard, QR poster, CSV export, alarm endpoint (alerts), admin actions
components/          Shared pieces (header, form, logo, EmergencyAlert alarm banner, etc.)
lib/
  db.js              Database and automatic setup/upgrade
  session.js         Admin login cookie
  i18n.js            English and Filipino text
  constants.js       Report types and statuses
scripts/seed.mjs     Demo data (npm run seed)
```

## Known limits (good to mention in your write-up)

- One shared admin account. Several named admins would need a users table.
- The alarm only works while the dashboard is open in a browser. There is no SMS, email or phone push alert yet.
- Spam limiting is per device network address, so it is a basic safeguard, not a full defence.
- Reports are stored as plain text in the database. For a real barangay, add a data privacy notice and retention rules (Data Privacy Act of 2012).
- Location from the GPS button is only as accurate as the phone allows.

## Ideas for next steps

- SMS or email / phone push notification when an emergency arrives, even if nobody has the dashboard open
- Escalation: re-alert (or alert another official) if an emergency stays Pending for more than a few minutes
- A map view of reports
- Photo upload
- Several admin accounts with roles
- More languages (Cebuano, Ilocano)
