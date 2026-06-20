-- Enable extensions
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Profiles (mirrors auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '訪客')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique,
  host_id uuid references profiles(id),
  mode text check (mode in ('swipe', 'midpoint', 'vote')),
  vote_submode text check (vote_submode in ('pass', 'online')),
  cuisine_type text,
  status text default 'lobby'
    check (status in ('lobby', 'spinning', 'picking', 'deciding', 'done', 'cancelled')),
  result_place_id text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '6 hours'
);

-- Participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references profiles(id),
  seat_label text,
  display_name text not null,
  location geography(Point, 4326),
  is_ready boolean default false,
  joined_at timestamptz default now(),
  unique (session_id, user_id)
);

-- Session restaurants cache
create table if not exists session_restaurants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  place_id text not null,
  name text not null,
  location geography(Point, 4326),
  rating numeric,
  price_level int,
  photo_ref text,
  address text,
  data jsonb,
  unique (session_id, place_id)
);

-- Swipes (mode: swipe)
create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  restaurant_id uuid references session_restaurants(id) on delete cascade,
  direction text check (direction in ('like', 'nope')),
  created_at timestamptz default now(),
  unique (participant_id, restaurant_id)
);

-- Matches (mode: swipe)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  restaurant_id uuid references session_restaurants(id),
  matched_at timestamptz default now(),
  unique (session_id)
);

-- Votes (mode: vote)
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  restaurant_id uuid references session_restaurants(id) on delete cascade,
  rank int check (rank in (1, 2, 3)),
  created_at timestamptz default now(),
  unique (participant_id, rank),
  unique (participant_id, restaurant_id)
);
