-- PrintForge initial schema. Run in Supabase SQL editor or `supabase db push`.
create extension if not exists "pgcrypto";

create table products (
  id text primary key,
  name text not null,
  category text not null,
  base_cost_paise int not null,
  shipping_cost_paise int not null,
  price_paise int not null,           -- GST-inclusive selling price
  gst_rate numeric(4,2) not null,     -- percent, e.g. 5, 12, 18
  supplier_sku text,
  active boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  phone text not null,
  address jsonb not null,             -- name, line1, line2, city, state, pincode
  subtotal_paise int not null,
  shipping_paise int not null,
  total_paise int not null,
  status text not null default 'pending'
    check (status in ('pending','paid','in_production','shipped','delivered','cancelled','refunded')),
  razorpay_order_id text unique,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  color text not null,
  size text,
  quantity int not null check (quantity > 0 and quantity <= 20),
  unit_price_paise int not null,
  design_url text                      -- Phase D: Supabase Storage path
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  razorpay_payment_id text unique not null,
  amount_paise int not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  supplier text not null,
  supplier_order_id text,
  tracking_number text,
  carrier text,
  status text,
  updated_at timestamptz not null default now()
);

-- idempotency for Razorpay / supplier webhooks
create table webhook_events (
  id text primary key,
  source text not null,
  received_at timestamptz not null default now()
);

-- RLS: server uses the service-role key (bypasses RLS). Browser clients may only read their own orders.
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table shipments enable row level security;
alter table webhook_events enable row level security;

create policy "products are public" on products for select using (active);
create policy "own orders" on orders for select using (auth.uid() = user_id);
create policy "own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own payments" on payments for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own shipments" on shipments for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- Seed (placeholder costs; replace after supplier sample orders)
insert into products (id,name,category,base_cost_paise,shipping_cost_paise,price_paise,gst_rate) values
 ('tshirt','Classic T-Shirt','Apparel',25000,6000,69900,5),
 ('hoodie','Pullover Hoodie','Apparel',55000,8000,149900,12),
 ('mug','Ceramic Mug 11oz','Drinkware',15000,7000,39900,18),
 ('phonecase','Phone Case','Accessories',18000,6000,49900,18),
 ('canvas','Canvas Print 12x16','Wall Art',40000,9000,99900,18);
