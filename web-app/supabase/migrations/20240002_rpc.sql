-- Compute geometric midpoint of all participant locations
create or replace function compute_midpoint(p_session uuid)
returns geography language sql as $$
  select st_centroid(st_collect(location::geometry))::geography
  from participants
  where session_id = p_session and location is not null;
$$;

-- Record a swipe and check for full match
create or replace function cast_swipe(
  p_session_id uuid,
  p_participant_id uuid,
  p_restaurant_id uuid,
  p_direction text
)
returns jsonb language plpgsql as $$
declare
  total_participants int;
  total_likes int;
  new_match_id uuid;
begin
  insert into swipes (session_id, participant_id, restaurant_id, direction)
  values (p_session_id, p_participant_id, p_restaurant_id, p_direction)
  on conflict (participant_id, restaurant_id) do update set direction = excluded.direction;

  if p_direction = 'nope' then
    return jsonb_build_object('matched', false, 'match_id', null);
  end if;

  select count(*) into total_participants
  from participants where session_id = p_session_id;

  select count(*) into total_likes
  from swipes
  where session_id = p_session_id
    and restaurant_id = p_restaurant_id
    and direction = 'like';

  if total_likes >= total_participants then
    insert into matches (session_id, restaurant_id)
    values (p_session_id, p_restaurant_id)
    on conflict (session_id) do nothing
    returning id into new_match_id;

    return jsonb_build_object('matched', true, 'match_id', new_match_id);
  end if;

  return jsonb_build_object('matched', false, 'match_id', null);
end;
$$;

-- Submit top-3 votes for a participant
create or replace function submit_vote(
  p_session_id uuid,
  p_participant_id uuid,
  p_ranks jsonb  -- array of {restaurant_id, rank}
)
returns void language plpgsql as $$
declare
  item jsonb;
begin
  delete from votes where participant_id = p_participant_id;
  for item in select * from jsonb_array_elements(p_ranks)
  loop
    insert into votes (session_id, participant_id, restaurant_id, rank)
    values (
      p_session_id,
      p_participant_id,
      (item->>'restaurant_id')::uuid,
      (item->>'rank')::int
    );
  end loop;
end;
$$;

-- Aggregate vote results (anonymised)
create or replace function get_vote_results(p_session_id uuid)
returns table (
  restaurant_id uuid,
  name text,
  score bigint,
  rank1_count bigint
) language sql as $$
  select
    v.restaurant_id,
    sr.name,
    sum(case v.rank when 1 then 3 when 2 then 2 when 3 then 1 else 0 end) as score,
    count(*) filter (where v.rank = 1) as rank1_count
  from votes v
  join session_restaurants sr on sr.id = v.restaurant_id
  where v.session_id = p_session_id
  group by v.restaurant_id, sr.name, sr.rating
  order by score desc, rank1_count desc, sr.rating desc nulls last;
$$;

-- Finalize session with winner
create or replace function finalize_session(p_session_id uuid, p_place_id text)
returns void language sql as $$
  update sessions
  set result_place_id = p_place_id, status = 'done'
  where id = p_session_id;
$$;
