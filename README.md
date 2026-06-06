# Sentinel Shift OS — Pro Cyberpunk Version

GitHub Pages frontend + Supabase database for security shift management.

## New in this version
- Multipage website: Dashboard, Companies, Add Shift, Shift Records, Reports, Settings
- Company/agency directory
- Modular shift form: Shift Details, Report of Shift, Payment & Reference
- Better reports and exports
- Cyberpunk futuristic UI
- Optional browser-generated sound effects
- Supabase Row Level Security

## Setup
1. Open Supabase SQL Editor.
2. Paste and run `supabase-schema-v2.sql`.
3. Open `config.js`.
4. Add your Supabase Project URL and anon public key.
5. Upload all files to your GitHub repository.
6. Enable GitHub Pages from repository settings.

## Upgrade from old version
Run `supabase-schema-v2.sql`. It adds:
- `security_companies` table
- `company_id` field in shifts
- `handover_notes` field in shifts

Existing old shifts remain. You can add companies and link new shifts to those companies.

## Important
Never put your Supabase service role key in this project. Only use the anon public key.
