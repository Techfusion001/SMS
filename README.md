# Security Shift Manager — GitHub Pages + Supabase

This is a free static web app for managing security shifts using:

- GitHub Pages for frontend hosting
- Supabase for login and PostgreSQL database
- HTML, CSS, JavaScript only
- No PHP, no paid hosting, no server required

## Features

- Email/password login
- Add, edit, delete shifts
- Company/agency details
- Supervisor name and contact
- Site/location
- Start/end time
- Overnight shift support
- Break minutes
- Rate per hour
- Auto-calculated hours and total pay
- Payment status: Pending, Paid, Disputed
- Payment received date
- Invoice/reference number
- Duty notes
- Incident notes
- Expenses/travel notes
- Monthly filter
- Search
- Dashboard totals
- Excel report download
- CSV download
- JSON backup

## Setup Part 1 — Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Paste everything from `supabase-schema.sql`.
4. Run it.
5. Go to Project Settings > API.
6. Copy:
   - Project URL
   - anon public key
7. Open `config.js`.
8. Paste both values.

Example:

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

## Setup Part 2 — Auth settings

In Supabase:

1. Go to Authentication > Providers.
2. Enable Email provider.
3. For easiest testing, you can disable email confirmation.
4. For production, keep confirmation enabled if you want safer account creation.

## Setup Part 3 — GitHub Pages

1. Create a new GitHub repository.
2. Upload:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`
   - `supabase-schema.sql`
   - `README.md`
3. Go to repository Settings.
4. Open Pages.
5. Source: Deploy from a branch.
6. Branch: main.
7. Folder: root.
8. Save.
9. Open your GitHub Pages link.

## Important security note

The Supabase anon key is allowed to be public in frontend apps. Your data is protected by Row Level Security policies in Supabase.

Do not put your Supabase service role key inside this frontend project.

## Local testing

Open `index.html` in your browser after adding Supabase config.

If browser blocks something locally, use VS Code Live Server extension or upload to GitHub Pages.

## Suggested future upgrades

- Admin account for viewing all guards
- PDF report export
- Invoice generator
- Mileage calculator
- Company-wise payment reminder
- Incident report generator
