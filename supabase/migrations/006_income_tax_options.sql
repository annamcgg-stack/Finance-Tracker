-- Extended tax calculator options on income_settings
alter table public.income_settings
  add column if not exists tax_options jsonb not null default '{}'::jsonb;
