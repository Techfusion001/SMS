# Sentinel Shift OS v3 — Expenses + Child Viewer Access

## New features

### GBP side payments / expenses
The Add Shift page now includes:
- Travel Charges GBP
- Parking Charges GBP
- Other Claimable Expenses GBP
- Expense Notes
- Total Wage
- Side Payments Total
- Total Cost = Wage + Travel + Parking + Other

Reports and exports now show all these values.

### Child / Viewer Access
New page: `access.html`

Owner can add a viewer email. That viewer can view companies, shifts and reports, and download reports.

Viewer cannot add, edit, delete, or manage access.

## Required Supabase update

Run `supabase-schema-v3.sql` in Supabase SQL Editor.

## Upload files

Upload all files to GitHub Pages root.

## Important

Keep your existing Supabase URL and anon public key in `config.js`.

Never put service role key inside frontend code.
