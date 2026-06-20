-- Update vote weights: 1st=5pts, 2nd=3pts, 3rd=1pt (reduces ties vs 3-2-1)
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
    sum(case v.rank when 1 then 5 when 2 then 3 when 3 then 1 else 0 end) as score,
    count(*) filter (where v.rank = 1) as rank1_count
  from votes v
  join session_restaurants sr on sr.id = v.restaurant_id
  where v.session_id = p_session_id
  group by v.restaurant_id, sr.name, sr.rating
  order by score desc, rank1_count desc, sr.rating desc nulls last;
$$;
