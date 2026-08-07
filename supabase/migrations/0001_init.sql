-- Rotaysh: recipe book schema
-- A "household" is a shared recipe book. Two people who both belong to the
-- same household see, add, edit, and delete the same set of recipes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Recipe Book',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  description text,
  ingredients text[] not null default '{}',
  instructions text[] not null default '{}',
  tags text[] not null default '{}',
  prep_time_minutes int,
  cook_time_minutes int,
  servings int,
  image_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_household_id_idx on recipes (household_id);
create index if not exists household_members_user_id_idx on household_members (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on recipes;
create trigger recipes_set_updated_at
  before update on recipes
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------

create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I
  code text;
  exists_already boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from households where invite_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- New user -> auto-create a personal household so the app is usable
-- immediately; the user (or their partner) can later join a shared one.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into households (name, invite_code)
  values ('My Recipe Book', generate_invite_code())
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Joining a partner's household by invite code. SECURITY DEFINER so a user
-- can look up a household by code without a broad SELECT policy on
-- households, and so the membership swap happens atomically.
-- Joining removes the caller's existing memberships first, so each person
-- always belongs to exactly one shared book at a time.
-- ---------------------------------------------------------------------------

create or replace function join_household_by_code(code text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  target households;
begin
  select * into target from households where invite_code = upper(code);

  if target.id is null then
    raise exception 'Invalid invite code';
  end if;

  delete from household_members where user_id = auth.uid();

  insert into household_members (household_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table recipes enable row level security;

create policy "members can view their household"
  on households for select
  using (id in (select household_id from household_members where user_id = auth.uid()));

create policy "owners can rename their household"
  on households for update
  using (id in (select household_id from household_members where user_id = auth.uid() and role = 'owner'));

create policy "members can view co-members"
  on household_members for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can view household recipes"
  on recipes for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can add recipes"
  on recipes for insert
  with check (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can edit household recipes"
  on recipes for update
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can delete household recipes"
  on recipes for delete
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime: broadcast recipe changes so both partners' apps update live.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table recipes;
exception
  when duplicate_object then null;
end $$;
