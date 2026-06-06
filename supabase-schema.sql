-- Security Shift Manager Supabase Database Setup
-- Paste this into Supabase SQL Editor and run it.

create extension if not exists "pgcrypto";

create table if not exists public.security_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  shift_date date not null,
  shift_name text not null,
  company text not null,
  supervisor text,
  supervisor_contact text,
  location text,

  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes >= 0),

  rate_per_hour numeric(10,2) not null default 0 check (rate_per_hour >= 0),
  hours_worked numeric(10,2) not null default 0 check (hours_worked >= 0),
  total_pay numeric(10,2) not null default 0 check (total_pay >= 0),

  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Disputed')),

  payment_received_date date,
  shift_type text not null default 'Retail Security',
  reference_no text,

  description text,
  incident_notes text,
  expenses text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_security_shifts_updated_at on public.security_shifts;

create trigger set_security_shifts_updated_at
before update on public.security_shifts
for each row
execute function public.set_updated_at();

alter table public.security_shifts enable row level security;

drop policy if exists "Users can view their own shifts" on public.security_shifts;
drop policy if exists "Users can insert their own shifts" on public.security_shifts;
drop policy if exists "Users can update their own shifts" on public.security_shifts;
drop policy if exists "Users can delete their own shifts" on public.security_shifts;

create policy "Users can view their own shifts"
on public.security_shifts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own shifts"
on public.security_shifts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own shifts"
on public.security_shifts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own shifts"
on public.security_shifts
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists security_shifts_user_date_idx
on public.security_shifts (user_id, shift_date desc);

create index if not exists security_shifts_payment_status_idx
on public.security_shifts (user_id, payment_status);
