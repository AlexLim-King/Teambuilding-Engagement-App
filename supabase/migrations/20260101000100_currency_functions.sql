-- Currency operations live in Postgres, not application code.
--
-- Vercel functions are stateless and run concurrently, so a read-compare-write
-- in TypeScript can interleave: two invocations both read 120, both pass the
-- check, both insert, and the balance lands at -120. Row locks here are where
-- that is actually resolved. See docs/05-architecture.md.

-- Released balance: a plain sum. Reversals are entries with the opposite amount,
-- so there is no "where not reversed" filtering to get wrong.
create or replace function balance_of(p_participant uuid)
returns int
language sql stable as $$
  select coalesce(sum(amount), 0)::int
    from currency_ledger
   where programme_participant_id = p_participant;
$$;

-- Zero a balance at the counter. Compare-and-set, so a double tap or a retried
-- request cannot overdraw: the second attempt sees 0, not 120, and is refused.
create or replace function redeem_balance(
  p_participant uuid,
  p_expected    int,
  p_entry       uuid,
  p_created_by  uuid
) returns table (ok boolean, balance int)
language plpgsql as $$
declare
  v_balance int;
begin
  -- Serialise concurrent callers on this participant.
  perform 1 from programme_participant where id = p_participant for update;

  v_balance := balance_of(p_participant);

  if v_balance <> p_expected then
    return query select false, v_balance;
    return;
  end if;

  if v_balance = 0 then
    return query select true, 0;
    return;
  end if;

  insert into currency_ledger (id, programme_participant_id, kind, amount, reason, created_by)
  values (p_entry, p_participant, 'redemption', -v_balance, 'Counter redemption', p_created_by)
  on conflict (id) do nothing;          -- idempotent on replay

  return query select true, balance_of(p_participant);
end $$;

-- Release a pending award on submission, on excuse, or by hand. Idempotent:
-- releasing twice creates one ledger entry, not two.
create or replace function release_pending_awards(
  p_participant uuid,
  p_round       uuid,
  p_created_by  uuid
) returns int
language plpgsql as $$
declare
  v_released int := 0;
  r          record;
  v_entry    uuid;
begin
  for r in
    select * from pending_award
     where programme_participant_id = p_participant
       and round_id = p_round
       and status = 'pending'
       for update
  loop
    v_entry := gen_random_uuid();

    insert into currency_ledger (
      id, programme_participant_id, batch_id, kind, amount, round_id, team_id, reason, created_by
    ) values (
      v_entry, r.programme_participant_id, r.batch_id, 'award', r.amount,
      r.round_id, r.team_id, r.reason, p_created_by
    );

    update pending_award
       set status = 'released', released_ledger_entry_id = v_entry
     where id = r.id;

    v_released := v_released + r.amount;
  end loop;

  return v_released;
end $$;

-- Finalise a round: no further submissions, and unreleased awards forfeit.
create or replace function finalise_round(p_round uuid)
returns int
language plpgsql as $$
declare
  v_forfeited int;
begin
  update pending_award
     set status = 'forfeited'
   where round_id = p_round and status = 'pending';

  select coalesce(sum(amount), 0)::int into v_forfeited
    from pending_award
   where round_id = p_round and status = 'forfeited';

  update round set state = 'finalised', finalised_at = now() where id = p_round;

  return v_forfeited;
end $$;

-- Claim or renew the redemption counter lease. One statement, so it is atomic
-- without any application logic. A dead device's lease simply expires.
create or replace function claim_redemption_lease(
  p_programme   uuid,
  p_device      text,
  p_holder      text,
  p_force       boolean default false,
  p_ttl_seconds int default 300
) returns table (granted boolean, device_id text, holder_name text, expires_at timestamptz)
language plpgsql as $$
begin
  insert into redemption_lease as l (programme_id, device_id, holder_name, expires_at)
  values (p_programme, p_device, p_holder, now() + make_interval(secs => p_ttl_seconds))
  on conflict (programme_id) do update
     set device_id   = excluded.device_id,
         holder_name = excluded.holder_name,
         expires_at  = excluded.expires_at
   where l.device_id = excluded.device_id   -- renewing our own
      or l.expires_at < now()               -- previous holder went away
      or p_force;                           -- explicit takeover

  return query
    select rl.device_id = p_device, rl.device_id, rl.holder_name, rl.expires_at
      from redemption_lease rl
     where rl.programme_id = p_programme;
end $$;
