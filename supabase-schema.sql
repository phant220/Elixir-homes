create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  room_name text not null,
  guest_name text not null default 'Client Elixir',
  check_in date not null,
  check_out date not null,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  month_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  motif text not null,
  montant numeric not null default 0,
  date date not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table reservations enable row level security;
alter table expenses enable row level security;

create policy "profiles_are_viewable_by_owner" on profiles
for select using (auth.uid() = id);

create policy "profiles_are_insertable_by_owner" on profiles
for insert with check (auth.uid() = id);

create policy "reservations_are_viewable_by_authenticated_users" on reservations
for select using (auth.uid() is not null);

create policy "reservations_are_insertable_by_authenticated_users" on reservations
for insert with check (auth.uid() is not null);

create policy "reservations_are_deleteable_by_authenticated_users" on reservations
for delete using (auth.uid() is not null);

create policy "expenses_are_viewable_by_authenticated_users" on expenses
for select using (auth.uid() is not null);

create policy "expenses_are_insertable_by_authenticated_users" on expenses
for insert with check (auth.uid() is not null);
