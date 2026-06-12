-- Deep Cut: schema matching current code (src/app/page.tsx, Lobby, GameRoom,
-- SubmissionPhase, VotingPhase, GameHistory, api/generate-theme).
-- Run this in the Supabase SQL Editor on a fresh project.

create table rooms (
	id uuid primary key default gen_random_uuid(),
	room_code text unique not null,
	theme text,
	game_started boolean not null default false,
	current_round integer not null default 1,
	created_at timestamptz not null default now()
);

create table players (
	id uuid primary key default gen_random_uuid(),
	room_code text not null,
	name text not null,
	created_at timestamptz not null default now(),
	unique (room_code, name)
);

create table submissions (
	id uuid primary key default gen_random_uuid(),
	room_code text not null,
	player_name text not null,
	round_number integer not null,
	answer text not null,
	user_id uuid,
	created_at timestamptz not null default now(),
	unique (room_code, player_name, round_number)
);

create table votes (
	id uuid primary key default gen_random_uuid(),
	room_code text not null,
	round_number integer not null,
	voter_name text not null,
	vote_for text not null,
	created_at timestamptz not null default now(),
	unique (room_code, round_number, voter_name)
);

create table decks (
	id uuid primary key default gen_random_uuid(),
	room_code text not null,
	theme text,
	questions jsonb,
	answers jsonb,
	created_at timestamptz not null default now()
);

create table game_sessions (
	id uuid primary key default gen_random_uuid(),
	theme text,
	players jsonb not null default '[]'::jsonb,
	winner text,
	duration_minutes integer,
	total_submissions integer,
	created_at timestamptz not null default now()
);

create index idx_players_room on players (room_code);
create index idx_submissions_room_round on submissions (room_code, round_number);
create index idx_votes_room_round on votes (room_code, round_number);

-- The game has no auth: clients use the publishable key directly, so allow
-- anon access via permissive RLS policies.
alter table rooms enable row level security;
alter table players enable row level security;
alter table submissions enable row level security;
alter table votes enable row level security;
alter table decks enable row level security;
alter table game_sessions enable row level security;

create policy "anon all" on rooms for all using (true) with check (true);
create policy "anon all" on players for all using (true) with check (true);
create policy "anon all" on submissions for all using (true) with check (true);
create policy "anon all" on votes for all using (true) with check (true);
create policy "anon all" on decks for all using (true) with check (true);
create policy "anon all" on game_sessions for all using (true) with check (true);

-- Realtime: the UI subscribes to postgres_changes on these tables.
alter publication supabase_realtime add table rooms, players, submissions, votes;

-- DELETE events on players need old-row data in the payload.
alter table players replica identity full;
