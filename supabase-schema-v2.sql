-- Sentinel Shift OS v2 Supabase Schema
-- Paste this in Supabase SQL Editor and run it.
-- Safe for both fresh install and upgrading from the earlier version.

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
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Disputed')),
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_security_companies_updated_at on public.security_companies;
create trigger set_security_companies_updated_at before update on public.security_companies for each row execute function public.set_updated_at();

drop trigger if exists set_security_shifts_updated_at on public.security_shifts;
create trigger set_security_shifts_updated_at before update on public.security_shifts for each row execute function public.set_updated_at();

alter table public.security_companies enable row level security;
alter table public.security_shifts enable row level security;

drop policy if exists "Users can view their own companies" on public.security_companies;
drop policy if exists "Users can insert their own companies" on public.security_companies;
drop policy if exists "Users can update their own companies" on public.security_companies;
drop policy if exists "Users can delete their own companies" on public.security_companies;

create policy "Users can view their own companies" on public.security_companies for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own companies" on public.security_companies for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own companies" on public.security_companies for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own companies" on public.security_companies for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can view their own shifts" on public.security_shifts;
drop policy if exists "Users can insert their own shifts" on public.security_shifts;
drop policy if exists "Users can update their own shifts" on public.security_shifts;
drop policy if exists "Users can delete their own shifts" on public.security_shifts;

create policy "Users can view their own shifts" on public.security_shifts for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own shifts" on public.security_shifts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own shifts" on public.security_shifts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own shifts" on public.security_shifts for delete to authenticated using (auth.uid() = user_id);

create index if not exists security_companies_user_idx on public.security_companies (user_id, company_name);
create index if not exists security_shifts_user_date_idx on public.security_shifts (user_id, shift_date desc);
create index if not exists security_shifts_company_idx on public.security_shifts (user_id, company_id);
create index if not exists security_shifts_payment_status_idx on public.security_shifts (user_id, payment_status);
