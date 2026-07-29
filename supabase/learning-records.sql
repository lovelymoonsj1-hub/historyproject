create table if not exists public.learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  learning_id text not null unique check (char_length(learning_id) between 3 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.learning_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_title text not null,
  quiz_number smallint not null check (quiz_number between 1 and 3),
  is_correct boolean not null,
  selected_option text not null,
  created_at timestamptz not null default now()
);

alter table public.learning_profiles enable row level security;
alter table public.learning_records enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.learning_profiles to authenticated;
grant select, insert on public.learning_records to authenticated;

create policy "students manage own learning profile" on public.learning_profiles
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "students read own learning records" on public.learning_records
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "students add own learning records" on public.learning_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
