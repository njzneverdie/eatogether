-- RLS policies

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table participants enable row level security;
alter table session_restaurants enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table votes enable row level security;

-- profiles: own row only
create policy "profiles_own" on profiles for all
  using (id = auth.uid());

-- sessions: readable by participants
create policy "sessions_participant_read" on sessions for select
  using (
    id in (select session_id from participants where user_id = auth.uid())
    or host_id = auth.uid()
  );

create policy "sessions_host_update" on sessions for update
  using (host_id = auth.uid());

-- participants: readable by session members
create policy "participants_session_read" on participants for select
  using (session_id in (select session_id from participants where user_id = auth.uid()));

create policy "participants_own_write" on participants for insert
  with check (user_id = auth.uid());

create policy "participants_own_update" on participants for update
  using (user_id = auth.uid());

-- session_restaurants: readable by participants
create policy "restaurants_session_read" on session_restaurants for select
  using (session_id in (select session_id from participants where user_id = auth.uid()));

-- swipes: own row only
create policy "swipes_own" on swipes for all
  using (participant_id in (select id from participants where user_id = auth.uid()));

-- matches: readable by session members
create policy "matches_session_read" on matches for select
  using (session_id in (select session_id from participants where user_id = auth.uid()));

-- votes: write own, NO read of others (aggregate via RPC only)
create policy "votes_own_write" on votes for insert
  with check (participant_id in (select id from participants where user_id = auth.uid()));

create policy "votes_own_read" on votes for select
  using (participant_id in (select id from participants where user_id = auth.uid()));
