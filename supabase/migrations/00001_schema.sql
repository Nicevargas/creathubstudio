-- ============================================================
-- CreatHub Studio - Migration Inicial
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "pgcrypto";

-- 2. TABELA PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  category text default 'Geral',
  avatar_url text,
  image_credits integer not null default 5,
  video_credits integer not null default 2,
  plan text default 'Teste',
  preferences jsonb default '{}'::jsonb,
  cnpj_cpf text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABELA CONTEUDOS GERADOS
create table if not exists public.conteudos_gerados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null default 'image',
  link_arquivo text,
  prompt text,
  created_at timestamptz default now()
);

-- 4. TABELA NOTICIAS
create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  id_user uuid not null references public.profiles(id) on delete cascade,
  titulo_noticia text not null,
  link_noticia text,
  resumo_noticia text default '',
  categoria text default 'Geral',
  status text default 'draft',
  created_at timestamptz default now()
);

-- 5. TABELA CREDIT PACKAGES
create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  image_credits integer not null default 0,
  video_credits integer not null default 0,
  price_id text,
  popular boolean default false,
  best_value boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- 6. TABELA CREDIT PURCHASES
create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid references public.credit_packages(id),
  image_credits_purchased integer not null default 0,
  video_credits_purchased integer not null default 0,
  amount_paid numeric(10,2),
  status text default 'pending',
  external_id text,
  created_at timestamptz default now()
);

-- 7. TABELA CREDIT HISTORY
create table if not exists public.credit_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount integer not null,
  description text default '',
  created_at timestamptz default now()
);

-- 8. ÍNDICES
create index if not exists idx_conteudos_user on public.conteudos_gerados(user_id);
create index if not exists idx_noticias_user on public.noticias(id_user);
create index if not exists idx_purchases_user on public.credit_purchases(user_id);
create index if not exists idx_history_user on public.credit_history(user_id);

-- 9. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.conteudos_gerados enable row level security;
alter table public.noticias enable row level security;
alter table public.credit_packages enable row level security;
alter table public.credit_purchases enable row level security;
alter table public.credit_history enable row level security;

-- Policies: profiles
drop policy if exists "users_read_own_profile" on public.profiles;
create policy "users_read_own_profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies: conteudos_gerados
drop policy if exists "users_read_own_content" on public.conteudos_gerados;
create policy "users_read_own_content" on public.conteudos_gerados
  for select using (auth.uid() = user_id);

drop policy if exists "users_insert_own_content" on public.conteudos_gerados;
create policy "users_insert_own_content" on public.conteudos_gerados
  for insert with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_content" on public.conteudos_gerados;
create policy "users_delete_own_content" on public.conteudos_gerados
  for delete using (auth.uid() = user_id);

-- Policies: noticias
drop policy if exists "users_read_own_news" on public.noticias;
create policy "users_read_own_news" on public.noticias
  for select using (auth.uid() = id_user);

drop policy if exists "users_insert_own_news" on public.noticias;
create policy "users_insert_own_news" on public.noticias
  for insert with check (auth.uid() = id_user);

drop policy if exists "users_update_own_news" on public.noticias;
create policy "users_update_own_news" on public.noticias
  for update using (auth.uid() = id_user);

drop policy if exists "users_delete_own_news" on public.noticias;
create policy "users_delete_own_news" on public.noticias
  for delete using (auth.uid() = id_user);

-- Policies: credit_packages (leitura pública)
drop policy if exists "public_read_packages" on public.credit_packages;
create policy "public_read_packages" on public.credit_packages
  for select using (true);

-- Policies: credit_purchases
drop policy if exists "users_read_own_purchases" on public.credit_purchases;
create policy "users_read_own_purchases" on public.credit_purchases
  for select using (auth.uid() = user_id);

-- Policies: credit_history
drop policy if exists "users_read_own_history" on public.credit_history;
create policy "users_read_own_history" on public.credit_history
  for select using (auth.uid() = user_id);

-- 10. FUNCTIONS / RPC

-- RPC: deduct_credits_atomic
create or replace function public.deduct_credits_atomic(
  p_user_id uuid,
  p_type text,
  p_amount integer,
  p_description text default ''
) returns boolean
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  if p_type = 'image' then
    select image_credits into v_balance from public.profiles where id = p_user_id for update;
    if v_balance < p_amount then
      return false;
    end if;
    update public.profiles set image_credits = image_credits - p_amount where id = p_user_id;
  elsif p_type = 'video' then
    select video_credits into v_balance from public.profiles where id = p_user_id for update;
    if v_balance < p_amount then
      return false;
    end if;
    update public.profiles set video_credits = video_credits - p_amount where id = p_user_id;
  else
    return false;
  end if;

  insert into public.credit_history(user_id, type, amount, description)
  values (p_user_id, p_type, p_amount, p_description);

  return true;
end;
$$;

-- RPC: increment_credits (usado pelo webhook Stripe)
create or replace function public.increment_credits(
  user_id uuid,
  img_amount integer default 0,
  vid_amount integer default 0
) returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    image_credits = image_credits + img_amount,
    video_credits = video_credits + vid_amount
  where id = user_id;
end;
$$;

-- 11. TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, category, image_credits, video_credits, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'category', 'Geral'),
    5,
    2,
    'Teste'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. STORAGE BUCKET: avatars
insert into storage.buckets (id, name, public, avif_autodetection)
values ('avatars', 'avatars', true, false)
on conflict (id) do nothing;

-- Storage policy: avatars (leitura pública, insert/update autenticado)
drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_auth_insert" on storage.objects;
create policy "avatars_auth_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');
