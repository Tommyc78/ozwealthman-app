create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  age integer not null check (age >= 0),
  country text not null default 'Australia',
  currency text not null default 'AUD',
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  annual_income numeric(14, 2) not null default 0,
  estimated_monthly_expenses numeric(14, 2) not null default 0,
  current_super_balance numeric(14, 2) not null default 0,
  has_smsf boolean not null default false,
  has_property boolean not null default false,
  has_etfs boolean not null default false,
  has_bullion boolean not null default false,
  has_crypto boolean not null default false,
  retirement_target numeric(14, 2) not null default 0,
  passive_income_target numeric(14, 2) not null default 0
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('cash', 'super', 'smsf', 'property', 'brokerage', 'crypto', 'bullion')),
  institution text,
  is_smsf boolean not null default false,
  current_balance numeric(14, 2),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_type text not null check (transaction_type in ('income', 'expense', 'buy', 'sell', 'contribution', 'transfer')),
  category text not null,
  asset_type text check (asset_type in ('cash', 'property', 'super', 'share', 'crypto', 'bullion')),
  asset_symbol text,
  asset_name text,
  amount numeric(14, 2) not null,
  quantity numeric(20, 8),
  unit_price numeric(14, 4),
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category_type text not null check (category_type in ('income', 'fixed', 'discretionary', 'saving')),
  monthly_target numeric(14, 2) not null default 0
);

create table public.property_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null,
  location text not null,
  ownership_type text not null check (ownership_type in ('personal', 'smsf')),
  current_value numeric(14, 2) not null default 0,
  loan_balance numeric(14, 2) not null default 0,
  weekly_rent numeric(14, 2) not null default 0,
  annual_expenses numeric(14, 2) not null default 0,
  notes text
);

create table public.property_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  property_id uuid references public.property_holdings(id) on delete cascade,
  bill_type text not null check (bill_type in ('water', 'rates', 'body_corporate', 'insurance', 'utilities', 'repairs', 'loan', 'other')),
  vendor text not null,
  amount numeric(14, 2) not null,
  due_date date not null,
  paid_date date,
  recurrence text not null check (recurrence in ('once', 'monthly', 'quarterly', 'annual')),
  status text not null check (status in ('upcoming', 'paid', 'overdue')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.property_analysis_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  suburb text not null,
  state text not null,
  purchase_price numeric(14, 2) not null,
  deposit numeric(14, 2) not null,
  loan_amount numeric(14, 2) not null,
  interest_rate numeric(8, 5) not null,
  weekly_rent numeric(14, 2) not null,
  vacancy_rate numeric(8, 5) not null,
  annual_rates numeric(14, 2) not null default 0,
  annual_insurance numeric(14, 2) not null default 0,
  annual_body_corporate numeric(14, 2) not null default 0,
  annual_repairs numeric(14, 2) not null default 0,
  annual_management_fees numeric(14, 2) not null default 0,
  stamp_duty numeric(14, 2) not null default 0,
  legal_and_buying_costs numeric(14, 2) not null default 0,
  projected_growth_rate numeric(8, 5) not null default 0,
  created_at timestamptz not null default now()
);

create table public.property_research_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  property_id uuid references public.property_holdings(id) on delete cascade,
  suburb text not null,
  state text not null,
  summary text not null,
  historical_growth jsonb not null default '{}'::jsonb,
  population_movement jsonb not null default '{}'::jsonb,
  infrastructure_projects jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.super_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  fund_name text not null,
  current_balance numeric(14, 2) not null default 0,
  contribution_rate numeric(7, 4) not null default 0,
  contribution_frequency text not null check (contribution_frequency in ('weekly', 'fortnightly', 'monthly', 'annual'))
);

create table public.share_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  symbol text not null,
  name text not null,
  quantity numeric(20, 8) not null default 0,
  average_cost numeric(14, 4) not null default 0,
  current_price numeric(14, 4) not null default 0,
  current_value numeric(14, 2) not null default 0
);

create table public.crypto_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  symbol text not null,
  name text not null,
  quantity numeric(20, 8) not null default 0,
  average_cost numeric(14, 4) not null default 0,
  current_price numeric(14, 4) not null default 0,
  current_value numeric(14, 2) not null default 0
);

create table public.bullion_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  metal_type text not null check (metal_type in ('gold', 'silver')),
  item_name text not null,
  unit_type text not null check (unit_type in ('oz', 'kg', 'grams')),
  quantity numeric(20, 8) not null default 0,
  buy_price_per_unit numeric(14, 4) not null default 0,
  total_cost numeric(14, 2) generated always as (quantity * buy_price_per_unit) stored,
  purchase_date date not null,
  current_spot_price numeric(14, 4) not null default 0,
  current_estimated_value numeric(14, 2) generated always as (quantity * current_spot_price) stored,
  unrealized_gain_loss numeric(14, 2) generated always as ((quantity * current_spot_price) - (quantity * buy_price_per_unit)) stored,
  storage_location text not null,
  notes text
);

create table public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  net_worth numeric(14, 2) not null default 0,
  monthly_surplus numeric(14, 2) not null default 0,
  super_total numeric(14, 2) not null default 0,
  smsf_total numeric(14, 2) not null default 0,
  passive_income_monthly numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.pending_ai_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action_type text not null,
  payload jsonb not null,
  confirmation_summary text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.tax_tracker_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tax_year text not null,
  context text not null check (context in ('payg', 'investment', 'smsf')),
  title text not null,
  due_date date not null,
  status text not null check (status in ('not_started', 'in_progress', 'ready', 'done')),
  notes text
);

create table public.smsf_compliance_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tax_year text not null,
  title text not null,
  category text not null check (category in ('tax', 'audit', 'records', 'strategy', 'lodgement')),
  due_date date not null,
  completed boolean not null default false,
  priority text not null check (priority in ('low', 'medium', 'high'))
);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budget_categories enable row level security;
alter table public.property_holdings enable row level security;
alter table public.property_bills enable row level security;
alter table public.property_analysis_inputs enable row level security;
alter table public.property_research_snapshots enable row level security;
alter table public.super_holdings enable row level security;
alter table public.share_holdings enable row level security;
alter table public.crypto_holdings enable row level security;
alter table public.bullion_lots enable row level security;
alter table public.dashboard_snapshots enable row level security;
alter table public.pending_ai_actions enable row level security;
alter table public.tax_tracker_items enable row level security;
alter table public.smsf_compliance_checklist enable row level security;

create policy "Users can read own user row" on public.users for select using (auth.uid() = id);
create policy "Users can update own user row" on public.users for update using (auth.uid() = id);
create policy "Users can insert own user row" on public.users for insert with check (auth.uid() = id);

create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own budget categories" on public.budget_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own property holdings" on public.property_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own property bills" on public.property_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own property analysis inputs" on public.property_analysis_inputs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own property research snapshots" on public.property_research_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own super holdings" on public.super_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own share holdings" on public.share_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own crypto holdings" on public.crypto_holdings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own bullion lots" on public.bullion_lots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own dashboard snapshots" on public.dashboard_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own pending AI actions" on public.pending_ai_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own tax tracker items" on public.tax_tracker_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own SMSF checklist" on public.smsf_compliance_checklist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index accounts_user_id_idx on public.accounts(user_id);
create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index bullion_lots_user_metal_idx on public.bullion_lots(user_id, metal_type);
create index dashboard_snapshots_user_updated_idx on public.dashboard_snapshots(user_id, updated_at desc);
create index property_bills_property_due_idx on public.property_bills(property_id, due_date);
create index tax_tracker_user_due_idx on public.tax_tracker_items(user_id, due_date);
create index smsf_checklist_user_due_idx on public.smsf_compliance_checklist(user_id, due_date);
