-- One shipment record per order/supplier; prevents double fulfilment.
alter table shipments add constraint shipments_order_supplier_key unique (order_id, supplier);
alter table order_items add column if not exists design_path text;
alter table order_items drop column if exists design_url;

-- Private bucket for customer design files (server signs upload/download URLs).
insert into storage.buckets (id, name, public) values ('designs', 'designs', false)
on conflict (id) do nothing;
