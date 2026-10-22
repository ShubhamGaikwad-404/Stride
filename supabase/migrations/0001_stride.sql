-- Stride stores one private JSON profile per authenticated Supabase user.
-- The browser's anon key is safe to expose because RLS restricts every row.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users can read their own health profile"
  on public.user_data for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own health profile"
  on public.user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own health profile"
  on public.user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.user_data to authenticated;
