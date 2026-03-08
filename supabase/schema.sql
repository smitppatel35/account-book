-- ============================================================
-- CLEAN SLATE: drop everything in reverse dependency order
-- ============================================================

-- Tables (cascade drops triggers, policies, indexes, FK constraints)
drop table if exists activity_log cascade;
drop table if exists entry_links cascade;
drop table if exists entries cascade;
drop table if exists workspace_members cascade;
drop table if exists workspaces cascade;
drop table if exists profiles cascade;

-- Trigger on auth.users must be dropped explicitly (auth schema not dropped above)
drop trigger if exists on_auth_user_created on auth.users;

-- Functions
drop function if exists handle_new_user();
drop function if exists update_updated_at();
drop function if exists is_workspace_member(uuid, uuid);
drop function if exists join_workspace(text);

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (mirrors auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Workspaces
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  invite_code text unique not null default substr(md5(random()::text), 1, 10),
  created_at timestamptz default now()
);

alter table workspaces enable row level security;

-- Workspace members
create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

alter table workspace_members enable row level security;

-- RLS for workspaces: creator can always see their own; members can see theirs; anyone can look up by invite_code
create policy "Members can view workspace" on workspaces
  for select using (
    created_by = auth.uid() or
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id and user_id = auth.uid()
    )
  );

-- RPC for joining a workspace via invite code (bypasses RLS to look up workspace, then inserts member)
create or replace function join_workspace(invite text)
returns uuid as $$
declare
  ws_id uuid;
begin
  select id into ws_id from public.workspaces where invite_code = invite;
  if ws_id is null then
    raise exception 'invalid invite code';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, auth.uid(), 'editor')
  on conflict do nothing;
  return ws_id;
end;
$$ language plpgsql security definer set search_path = public;

create policy "Authenticated users can create workspaces" on workspaces
  for insert with check (auth.uid() = created_by);

create policy "Owners can update workspace" on workspaces
  for update using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Helper: check membership without triggering RLS (avoids infinite recursion)
create or replace function is_workspace_member(wsid uuid, uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = wsid and user_id = uid
  );
$$ language sql security definer set search_path = public;

-- RLS for workspace_members
create policy "Members can view membership" on workspace_members
  for select using (
    user_id = auth.uid() or
    is_workspace_member(workspace_id, auth.uid())
  );

create policy "Users can join via invite" on workspace_members
  for insert with check (user_id = auth.uid());

create policy "Owners can manage members" on workspace_members
  for delete using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

-- Entries


create table entries (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(12, 2) not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('cash', 'online')),
  description text not null,
  date date not null default current_date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table entries enable row level security;

create policy "Members can view entries" on entries
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = entries.workspace_id and user_id = auth.uid()
    )
  );

create policy "Editors and owners can insert entries" on entries
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = entries.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "Creator or owner can update entries" on entries
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from workspace_members
      where workspace_id = entries.workspace_id and user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Creator or owner can delete entries" on entries
  for delete using (
    created_by = auth.uid() or
    exists (
      select 1 from workspace_members
      where workspace_id = entries.workspace_id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- Entry links
create table entry_links (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid references entries(id) on delete cascade not null,
  url text not null,
  label text,
  "order" int not null default 0
);

alter table entry_links enable row level security;

create policy "Members can view entry links" on entry_links
  for select using (
    exists (
      select 1 from entries e
      join workspace_members wm on wm.workspace_id = e.workspace_id
      where e.id = entry_links.entry_id and wm.user_id = auth.uid()
    )
  );

create policy "Editors can manage entry links" on entry_links
  for all using (
    exists (
      select 1 from entries e
      join workspace_members wm on wm.workspace_id = e.workspace_id
      where e.id = entry_links.entry_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'editor')
    )
  );

-- Activity log
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  entry_id uuid references entries(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete')),
  snapshot jsonb,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

create policy "Members can view activity" on activity_log
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = activity_log.workspace_id and user_id = auth.uid()
    )
  );

create policy "System can insert activity" on activity_log
  for insert with check (auth.uid() = user_id);

-- Enable realtime on entries (wrapped to avoid "already exists" errors on re-run)
do $$ begin
  alter publication supabase_realtime add table entries;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table entry_links;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table activity_log;
exception when others then null; end $$;
