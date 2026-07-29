-- Run this once in Supabase SQL Editor after learning-records.sql.
-- Teacher and student accounts are automatically matched by their ID prefix.

alter table public.learning_profiles
  add column if not exists role text not null default 'student'
  check (role in ('student', 'teacher'));

create table if not exists public.teacher_registration_codes (
  code text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_code text not null unique check (char_length(class_code) between 3 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.class_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  learning_id text not null,
  joined_at timestamptz not null default now()
);

alter table public.learning_records
  add column if not exists classroom_id uuid references public.classrooms(id) on delete set null;

create index if not exists learning_records_classroom_id_idx on public.learning_records(classroom_id);
create index if not exists learning_records_classroom_concept_idx on public.learning_records(classroom_id, concept_title);

alter table public.classrooms enable row level security;
alter table public.class_memberships enable row level security;

drop policy if exists "students manage own learning profile" on public.learning_profiles;
drop policy if exists "students read own learning records" on public.learning_records;
drop policy if exists "students add own learning records" on public.learning_records;

create policy "users read own profile" on public.learning_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own profile" on public.learning_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id and role = 'student');

create policy "teachers read own classrooms" on public.classrooms
  for select to authenticated using ((select auth.uid()) = teacher_id);

create policy "users read own membership" on public.class_memberships
  for select to authenticated using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = (select auth.uid()))
  );

create policy "users read own records or teacher records" on public.learning_records
  for select to authenticated using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = (select auth.uid()))
  );
create policy "students add own records" on public.learning_records
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (classroom_id is null or exists (
      select 1 from public.class_memberships m
      where m.user_id = (select auth.uid()) and m.classroom_id = learning_records.classroom_id
    ))
  );

create or replace function public.join_class(p_class_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id uuid;
  v_learning_id text;
begin
  select id into v_classroom_id from public.classrooms
  where upper(class_code) = upper(trim(p_class_code));
  if v_classroom_id is null then raise exception 'CLASS_CODE_NOT_FOUND'; end if;
  select learning_id into v_learning_id from public.learning_profiles where user_id = auth.uid();
  if v_learning_id is null then raise exception 'PROFILE_NOT_FOUND'; end if;
  insert into public.class_memberships(user_id, classroom_id, learning_id)
  values (auth.uid(), v_classroom_id, v_learning_id)
  on conflict (user_id) do update set classroom_id = excluded.classroom_id, learning_id = excluded.learning_id, joined_at = now();
  return v_classroom_id;
end;
$$;

create or replace function public.create_teacher_classroom(p_class_code text, p_teacher_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id uuid;
begin
  if not exists (select 1 from public.teacher_registration_codes where code = p_teacher_code) then
    raise exception 'TEACHER_CODE_INVALID';
  end if;
  update public.learning_profiles set role = 'teacher' where user_id = auth.uid();
  insert into public.classrooms(teacher_id, class_code)
  values (auth.uid(), upper(trim(p_class_code)))
  returning id into v_classroom_id;
  delete from public.teacher_registration_codes where code = p_teacher_code;
  return v_classroom_id;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert on public.learning_profiles to authenticated;
grant select on public.classrooms, public.class_memberships to authenticated;
grant select, insert on public.learning_records to authenticated;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.create_teacher_classroom(text, text) to authenticated;

-- Automatic account matching
-- Teacher ID: alphabet 4-8 letters + class number 2 digits + master (example: jaun51master)
-- Student ID: the same first part + student number 2 digits (example: jaun5100)
create or replace function public.register_teacher_account(p_learning_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_code text;
  v_classroom_id uuid;
  v_profile_id text;
begin
  if lower(trim(p_learning_id)) !~ '^[a-z]{4,8}[0-9]{2}master$' then
    raise exception 'TEACHER_ID_FORMAT_INVALID';
  end if;
  select learning_id into v_profile_id from public.learning_profiles where user_id = auth.uid();
  if lower(v_profile_id) <> lower(trim(p_learning_id)) then raise exception 'PROFILE_MISMATCH'; end if;
  v_class_code := substring(lower(trim(p_learning_id)) from '^([a-z]{4,8}[0-9]{2})master$');
  select id into v_classroom_id from public.classrooms where class_code = v_class_code;
  if v_classroom_id is not null and not exists (
    select 1 from public.classrooms where id = v_classroom_id and teacher_id = auth.uid()
  ) then raise exception 'CLASS_CODE_IN_USE'; end if;
  update public.learning_profiles set role = 'teacher' where user_id = auth.uid();
  if v_classroom_id is null then
    insert into public.classrooms(teacher_id, class_code) values (auth.uid(), v_class_code) returning id into v_classroom_id;
  end if;
  return v_classroom_id;
end;
$$;

create or replace function public.auto_join_student_class(p_learning_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_code text;
  v_classroom_id uuid;
  v_profile_id text;
begin
  if lower(trim(p_learning_id)) !~ '^[a-z]{4,8}[0-9]{4}$' then
    raise exception 'STUDENT_ID_FORMAT_INVALID';
  end if;
  select learning_id into v_profile_id from public.learning_profiles where user_id = auth.uid();
  if lower(v_profile_id) <> lower(trim(p_learning_id)) then raise exception 'PROFILE_MISMATCH'; end if;
  v_class_code := substring(lower(trim(p_learning_id)) from '^([a-z]{4,8}[0-9]{2})[0-9]{2}$');
  select id into v_classroom_id from public.classrooms where class_code = v_class_code;
  if v_classroom_id is null then raise exception 'TEACHER_ACCOUNT_NOT_READY'; end if;
  insert into public.class_memberships(user_id, classroom_id, learning_id)
  values (auth.uid(), v_classroom_id, v_profile_id)
  on conflict (user_id) do update set classroom_id = excluded.classroom_id, learning_id = excluded.learning_id, joined_at = now();
  return v_classroom_id;
end;
$$;

grant execute on function public.register_teacher_account(text) to authenticated;
grant execute on function public.auto_join_student_class(text) to authenticated;
