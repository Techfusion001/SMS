-- Sentinel Shift OS v3
-- Adds GBP side payments/expenses and child/viewer read-only access.
-- Paste this into Supabase SQL Editor and run.

create extension if not exists "pgcrypto";

create table if not exists public.security_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_person text,
  phone text,
  email text,
  default_rate numeric(10,2) not null default 0 check (default_rate >= 0),
  payment_terms text default 'Weekly',
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.security_companies(id) on delete set null,
  company text,
  shift_date date not null,
  shift_name text not null,
  supervisor text,
  supervisor_contact text,
  location text,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  rate_per_hour numeric(10,2) not null default 0 check (rate_per_hour >= 0),
  hours_worked numeric(10,2) not null default 0 check (hours_worked >= 0),
  total_pay numeric(10,2) not null default 0 check (total_pay >= 0),
  payment_status text not null default 'Pending' check (payment_status in ('Pending','Paid','Disputed')),
  payment_received_date date,
  shift_type text not null default 'Retail Security',
  reference_no text,
  description text,
  incident_notes text,
  handover_notes text,
  expenses text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.security_shifts add column if not exists company_id uuid references public.security_companies(id) on delete set null;
alter table public.security_shifts add column if not exists company text;
alter table public.security_shifts add column if not exists handover_notes text;
alter table public.security_shifts add column if not exists travel_charge numeric(10,2) not null default 0 check (travel_charge >= 0);
alter table public.security_shifts add column if not exists parking_charge numeric(10,2) not null default 0 check (parking_charge >= 0);
alter table public.security_shifts add column if not exists other_expense numeric(10,2) not null default 0 check (other_expense >= 0);
alter table public.security_shifts add column if not exists expense_notes text;
alter table public.security_shifts add column if not exists total_cost numeric(10,2) not null default 0 check (total_cost >= 0);

update public.security_shifts
set total_cost = coalesce(total_pay,0) + coalesce(travel_charge,0) + coalesce(parking_charge,0) + coalesce(other_expense,0)
where total_cost = 0 and (coalesce(total_pay,0) + coalesce(travel_charge,0) + coalesce(parking_charge,0) + coalesce(other_expense,0)) > 0;

create table if not exists public.security_viewer_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_email text not null,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, viewer_email)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_security_companies_updated_at on public.security_companies;
create trigger set_security_companies_updated_at before update on public.security_companies for each row execute function public.set_updated_at();

drop trigger if exists set_security_shifts_updated_at on public.security_shifts;
create trigger set_security_shifts_updated_at before update on public.security_shifts for each row execute function public.set_updated_at();

drop trigger if exists set_security_viewer_access_updated_at on public.security_viewer_access;
create trigger set_security_viewer_access_updated_at before update on public.security_viewer_access for each row execute function public.set_updated_at();

alter table public.security_companies enable row level security;
alter table public.security_shifts enable row level security;
alter table public.security_viewer_access enable row level security;

-- Remove old policies if present
drop policy if exists "Users can view their own companies" on public.security_companies;
drop policy if exists "Users can insert their own companies" on public.security_companies;
drop policy if exists "Users can update their own companies" on public.security_companies;
drop policy if exists "Users can delete their own companies" on public.security_companies;
drop policy if exists "Owners and viewers can view companies" on public.security_companies;
drop policy if exists "Owners can insert companies" on public.security_companies;
drop policy if exists "Owners can update companies" on public.security_companies;
drop policy if exists "Owners can delete companies" on public.security_companies;

drop policy if exists "Users can view their own shifts" on public.security_shifts;
drop policy if exists "Users can insert their own shifts" on public.security_shifts;
drop policy if exists "Users can update their own shifts" on public.security_shifts;
drop policy if exists "Users can delete their own shifts" on public.security_shifts;
drop policy if exists "Owners and viewers can view shifts" on public.security_shifts;
drop policy if exists "Owners can insert shifts" on public.security_shifts;
drop policy if exists "Owners can update shifts" on public.security_shifts;
drop policy if exists "Owners can delete shifts" on public.security_shifts;

drop policy if exists "Owners can select viewer access" on public.security_viewer_access;
drop policy if exists "Owners can insert viewer access" on public.security_viewer_access;
drop policy if exists "Owners can update viewer access" on public.security_viewer_access;
drop policy if exists "Owners can delete viewer access" on public.security_viewer_access;

create policy "Owners and viewers can view companies"
on public.security_companies for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.security_viewer_access va
    where va.owner_id = security_companies.user_id
      and lower(va.viewer_email) = lower(coalesce(auth.jwt() ->> 'email',''))
      and va.is_active = true
  )
);

create policy "Owners can insert companies"
on public.security_companies for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners can update companies"
on public.security_companies for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owners can delete companies"
on public.security_companies for delete to authenticated
using (auth.uid() = user_id);

create policy "Owners and viewers can view shifts"
on public.security_shifts for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.security_viewer_access va
    where va.owner_id = security_shifts.user_id
      and lower(va.viewer_email) = lower(coalesce(auth.jwt() ->> 'email',''))
      and va.is_active = true
  )
);

create policy "Owners can insert shifts"
on public.security_shifts for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners can update shifts"
on public.security_shifts for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owners can delete shifts"
on public.security_shifts for delete to authenticated
using (auth.uid() = user_id);

create policy "Owners can select viewer access"
on public.security_viewer_access for select to authenticated
using (auth.uid() = owner_id or lower(viewer_email) = lower(coalesce(auth.jwt() ->> 'email','')));

create policy "Owners can insert viewer access"
on public.security_viewer_access for insert to authenticated
with check (auth.uid() = owner_id);

create policy "Owners can update viewer access"
on public.security_viewer_access for update to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owners can delete viewer access"
on public.security_viewer_access for delete to authenticated
using (auth.uid() = owner_id);

create index if not exists security_companies_user_idx on public.security_companies (user_id, company_name);
create index if not exists security_shifts_user_date_idx on public.security_shifts (user_id, shift_date desc);
create index if not exists security_shifts_company_idx on public.security_shifts (user_id, company_id);
create index if not exists security_shifts_payment_status_idx on public.security_shifts (user_id, payment_status);
create index if not exists security_viewer_access_owner_idx on public.security_viewer_access (owner_id);
create index if not exists security_viewer_access_email_idx on public.security_viewer_access (lower(viewer_email));
