-- Ready-made catalog designs: items carry a design slug (public/designs/<slug>.svg) instead of an uploaded design_path.
alter table order_items add column if not exists design_slug text;
