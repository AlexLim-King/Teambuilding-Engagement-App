-- Teambuilding Engagement App — initial schema.
-- Mirrors docs/02-data-model.md. Text + CHECK rather than enum types, because
-- this schema is still moving and altering an enum is painful.

create extension if not exists "pgcrypto";

-- ============================================================ organisations

create table organisation (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  retention_days  int  not null default 90,
  created_at      timestamptz not null default now()
);

create table roster_person (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation on delete cascade,
  display_name     text not null,
  normalised_name  text not null,          -- autocomplete index: lowercased, accent-stripped
  department       text,
  gender           text not null default 'unspecified'
                     check (gender in ('male','female','unspecified')),
  gender_source    text not null default 'roster'
                     check (gender_source in ('roster','nric','facilitator')),
  is_leadership    boolean not null default false,
  employee_ref     text,                   -- never sent to participant devices
  email            text                    -- never sent to participant devices
  -- Deliberately no nric column: parsed in the browser, gender derived, number discarded.
);
create index roster_person_lookup on roster_person (organisation_id, normalised_name);

-- The reusable activity library. Team size belongs to the activity, not the event.
create table activity_definition (
  id                        uuid primary key default gen_random_uuid(),
  organisation_id           uuid references organisation on delete cascade,
  name                      text not null,
  normalised_name           text not null,
  default_team_size         int  not null check (default_team_size between 2 and 30),
  min_team_size             int  not null default 2,
  max_team_size             int  not null default 30,
  is_competitive            boolean not null default true,
  default_duration_minutes  int,
  payout_override           jsonb,
  notes                     text,
  times_used                int  not null default 0,
  check (min_team_size <= default_team_size and default_team_size <= max_team_size)
);
create index activity_definition_lookup on activity_definition (organisation_id, normalised_name);

-- ============================================================ programmes & events

create table programme (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation on delete cascade,
  name             text not null,
  currency_label   text not null default 'coins',
  starts_at        date,
  ends_at          date
);

create table event (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation on delete cascade,
  programme_id     uuid references programme on delete set null,
  name             text not null,
  join_code        text not null unique,   -- 6 chars, ambiguity-free alphabet
  template         jsonb not null default '{}'::jsonb,
  formation_seed   int  not null default floor(random() * 2147483647),
  state            text not null default 'draft'
                     check (state in ('draft','open','running','closed','archived')),
  starts_at        timestamptz,
  ends_at          timestamptz
);

-- A time block. Only meaningful when stations run in parallel.
create table session (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references event on delete cascade,
  sequence   int  not null,
  label      text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  unique (event_id, sequence)
);

-- A round IS one activity: the unit everything hangs off.
create table round (
  id                      uuid primary key default gen_random_uuid(),
  event_id                uuid not null references event on delete cascade,
  session_id              uuid references session on delete set null,
  sequence                int  not null,
  activity_definition_id  uuid references activity_definition on delete set null,
  activity_name           text not null,
  team_size               int  not null check (team_size between 2 and 30),
  is_competitive          boolean not null default true,
  nomination_question_key text,
  state                   text not null default 'planned'
    check (state in ('planned','teams_formed','active','evaluating','closed','finalised')),
  evaluation_opened_at    timestamptz,
  evaluation_closes_at    timestamptz,
  finalised_at            timestamptz,
  unique (event_id, sequence)
);

-- ============================================================ participants

create table programme_participant (
  id                uuid primary key default gen_random_uuid(),
  programme_id      uuid not null references programme on delete cascade,
  roster_person_id  uuid references roster_person on delete set null,
  display_name      text not null,
  department        text
);

create table participant (
  id                        uuid primary key default gen_random_uuid(),
  event_id                  uuid not null references event on delete cascade,
  roster_person_id          uuid references roster_person on delete set null,
  programme_participant_id  uuid references programme_participant on delete set null,
  display_name              text not null,
  department                text,
  gender                    text not null default 'unspecified'
                              check (gender in ('male','female','unspecified')),
  is_leadership             boolean not null default false,
  is_walk_in                boolean not null default false,
  device_token              text not null,
  locale                    text not null default 'en' check (locale in ('en','ms')),
  claimed_at                timestamptz not null default now(),
  withdrawn_at              timestamptz,
  status                    text not null default 'active'
                              check (status in ('active','withdrawn')),
  unique (event_id, device_token),
  unique (event_id, roster_person_id)      -- a roster name is claimed once per event
);
create index participant_by_token on participant (device_token);

create table participant_photo (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null unique references participant on delete cascade,
  source          text not null check (source in ('self_capture','roster_import')),
  storage_key     text not null,
  captured_at     timestamptz not null default now()
);

-- ============================================================ teams

create table team (
  id        uuid primary key default gen_random_uuid(),
  round_id  uuid not null references round on delete cascade,
  number    int  not null,
  label     text,
  unique (round_id, number)
);

create table team_member (
  team_id        uuid not null references team on delete cascade,
  participant_id uuid not null references participant on delete cascade,
  round_id       uuid not null references round on delete cascade,
  primary key (team_id, participant_id),
  unique (round_id, participant_id)        -- one team per person per activity
);

create table pair_history (
  event_id         uuid not null references event on delete cascade,
  participant_a_id uuid not null references participant on delete cascade,
  participant_b_id uuid not null references participant on delete cascade,
  times_together   int  not null default 0,
  primary key (event_id, participant_a_id, participant_b_id),
  check (participant_a_id < participant_b_id)   -- one row per unordered pair
);

-- Directed arcs already used, so nobody rates the same person twice.
create table rating_history (
  event_id             uuid not null references event on delete cascade,
  rater_participant_id uuid not null references participant on delete cascade,
  ratee_participant_id uuid not null references participant on delete cascade,
  primary key (event_id, rater_participant_id, ratee_participant_id)
);

-- ============================================================ evaluation

create table rating_assignment (
  id                   uuid primary key default gen_random_uuid(),
  round_id             uuid not null references round on delete cascade,
  rater_participant_id uuid not null references participant on delete cascade,
  ratee_participant_id uuid not null references participant on delete cascade,
  excused_at           timestamptz,
  excused_reason       text check (excused_reason in ('technical','facilitator')),
  unique (round_id, rater_participant_id),
  check (rater_participant_id <> ratee_participant_id)
);

create table submission (
  id                   uuid primary key,          -- client-generated: the idempotency key
  round_id             uuid not null references round on delete cascade,
  rater_participant_id uuid not null references participant on delete cascade,
  ratee_participant_id uuid not null references participant on delete cascade,
  submitted_at         timestamptz,               -- device clock: for interest only
  received_at          timestamptz not null default now(),
  client_seq           int not null default 0,
  is_partial           boolean not null default false,
  submitted_late       boolean not null default false,
  ratee_withdrawn      boolean not null default false,
  seconds_to_submit    int,
  unique (round_id, rater_participant_id)
);

create table criterion_rating (
  submission_id uuid not null references submission on delete cascade,
  criterion_key text not null,
  value         smallint not null check (value between 1 and 5),
  primary key (submission_id, criterion_key)
);

create table nomination (
  submission_id         uuid not null references submission on delete cascade,
  question_key          text not null,
  nominee_participant_id uuid references participant on delete set null,  -- null = skipped
  primary key (submission_id, question_key)
);

create table facilitator_observation (
  id              uuid primary key default gen_random_uuid(),
  round_id        uuid not null references round on delete cascade,
  team_id         uuid references team on delete cascade,
  participant_id  uuid references participant on delete cascade,
  teamwork_rating smallint check (teamwork_rating between 1 and 5),
  note            text,
  created_by      uuid not null,
  created_at      timestamptz not null default now(),
  check (team_id is not null or participant_id is not null)
);

-- ============================================================ results & currency

create table round_result (
  id       uuid primary key default gen_random_uuid(),
  round_id uuid not null references round on delete cascade,
  team_id  uuid not null references team on delete cascade,
  placing  int,
  score    numeric,
  notes    text,
  unique (round_id, team_id)
);

-- Earned but not released. Not money yet, so not in the ledger.
create table pending_award (
  id                        uuid primary key default gen_random_uuid(),
  programme_participant_id  uuid not null references programme_participant on delete cascade,
  round_id                  uuid not null references round on delete cascade,
  team_id                   uuid references team on delete set null,
  batch_id                  uuid not null,
  amount                    int  not null check (amount > 0),
  reason                    text not null,
  status                    text not null default 'pending'
    check (status in ('pending','released','forfeited','cancelled')),
  released_ledger_entry_id  uuid,
  created_by                uuid not null,
  created_at                timestamptz not null default now(),
  unique (programme_participant_id, round_id)
);
create index pending_award_open on pending_award (round_id, status);

-- Append-only. Only ever real, released currency. Integers only.
create table currency_ledger (
  id                        uuid primary key,      -- client-generated idempotency key
  programme_participant_id  uuid not null references programme_participant on delete cascade,
  batch_id                  uuid,
  kind                      text not null
                              check (kind in ('award','adjustment','redemption','reversal')),
  amount                    int  not null,         -- signed; never a float
  event_id                  uuid references event on delete set null,
  round_id                  uuid references round on delete set null,
  team_id                   uuid references team on delete set null,
  reason                    text not null,
  created_by                uuid,
  reverses_entry_id         uuid references currency_ledger(id),
  client_seq                int not null default 0,
  created_at                timestamptz not null default now()
);
create index currency_ledger_by_person on currency_ledger (programme_participant_id);

-- Single-writer lease for the redemption counter. Expires, so a dead device frees it.
create table redemption_lease (
  programme_id uuid primary key references programme on delete cascade,
  device_id    text not null,
  holder_name  text,
  expires_at   timestamptz not null
);

-- ============================================================ RLS

-- Enabled on every table with no anon policies. The Supabase anon key is public
-- by design; without RLS it reads the whole database. Participants never touch
-- Supabase directly — they go through API routes using the service role key,
-- which bypasses RLS.
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
