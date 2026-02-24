-- Supabase schema for Retail Management System (RMS)

-- 1. Enum & helper types
create type department_role as enum (
  'PROCUREMENT',
  'MANUFACTURING',
  'DISTRIBUTION',
  'RETAIL',
  'POS'
);

create type transfer_status as enum ('PENDING', 'ADJUSTED', 'APPROVED');

-- 2. Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  department_role department_role not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles
  for update
  using (auth.uid() = id);

-- 3. Raw materials
create table if not exists raw_materials (
  id bigserial primary key,
  name text not null,
  sku text unique not null,
  quantity numeric(18, 3) default 0 not null,
  color_code text not null,
  unit text not null,
  created_at timestamptz default now()
);

alter table raw_materials enable row level security;

-- 4. Produced goods
create table if not exists produced_goods (
  id bigserial primary key,
  name text not null,
  sku text unique not null,
  quantity numeric(18, 3) default 0 not null,
  recipe jsonb not null, -- { "legs": 4, "seat": 1 }
  created_at timestamptz default now()
);

alter table produced_goods enable row level security;

-- 5. Transfer requests (single table for all department-to-department moves)
create table if not exists transfer_requests (
  id bigserial primary key,
  from_dept department_role not null,
  to_dept department_role not null,
  -- items: [{ "item_type": "RAW" | "PRODUCED", "item_id": 1, "sku": "LEG-001", "requested_qty": 100, "approved_qty": 80 }]
  items jsonb not null,
  status transfer_status default 'PENDING' not null,
  initiated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table transfer_requests enable row level security;

-- 6. Sales table
create table if not exists sales (
  id bigserial primary key,
  item_id bigint not null references produced_goods(id),
  quantity numeric(18, 3) not null,
  payment_status text check (payment_status in ('PAID', 'CREDIT')) not null,
  customer_info jsonb,
  created_at timestamptz default now()
);

alter table sales enable row level security;

-- 7. Basic triggers to maintain updated_at on transfer_requests
create or replace function set_transfer_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_transfer_updated_at on transfer_requests;

create trigger trg_transfer_updated_at
before update on transfer_requests
for each row
execute procedure set_transfer_updated_at();

