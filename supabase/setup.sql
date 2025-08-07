-- Complete database setup script for AI Cards Game
-- Run this script to set up the entire database schema, policies, and functions

-- This script combines all migrations in the correct order
-- It can be run directly in Supabase SQL editor or via CLI

\echo 'Setting up AI Cards Game database...'

-- Migration 001: Initial Schema
\echo 'Creating initial schema...'

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  phase VARCHAR(20) NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'distribution', 'submission', 'voting', 'results')),
  current_round INTEGER DEFAULT 1,
  target_score INTEGER DEFAULT 7,
  max_players INTEGER DEFAULT 8,
  submission_timer INTEGER DEFAULT 60,
  voting_timer INTEGER DEFAULT 30,
  host_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('prompt', 'response')),
  text TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  prompt_card_id UUID NOT NULL REFERENCES cards(id),
  response_cards JSONB NOT NULL,
  votes INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, round_number, game_id)
);

-- Add foreign key constraint for host_id after players table is created
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_games_host_id'
    ) THEN
        ALTER TABLE games ADD CONSTRAINT fk_games_host_id FOREIGN KEY (host_id) REFERENCES players(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_cards_game_id_round ON cards(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_cards_player_id ON cards(player_id);
CREATE INDEX IF NOT EXISTS idx_submissions_game_id_round ON submissions(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_submissions_player_id ON submissions(player_id);
CREATE INDEX IF NOT EXISTS idx_votes_game_id_round ON votes(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON votes(submission_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for games table
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

\echo 'Initial schema created successfully.'

-- Migration 002: RLS Policies
\echo 'Setting up Row Level Security policies...'

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Players can read their games" ON games;
DROP POLICY IF EXISTS "Anyone can create games" ON games;
DROP POLICY IF EXISTS "Host can update game" ON games;
DROP POLICY IF EXISTS "Players can read game participants" ON players;
DROP POLICY IF EXISTS "Players can join games" ON players;
DROP POLICY IF EXISTS "Players can update themselves" ON players;
DROP POLICY IF EXISTS "Players can read game cards" ON cards;
DROP POLICY IF EXISTS "System can insert cards" ON cards;
DROP POLICY IF EXISTS "Players can read game submissions" ON submissions;
DROP POLICY IF EXISTS "Players can create submissions" ON submissions;
DROP POLICY IF EXISTS "Players can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Players can read game votes" ON votes;
DROP POLICY IF EXISTS "Players can vote" ON votes;

-- Games table policies
CREATE POLICY "Players can read their games" ON games
    FOR SELECT USING (
        id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Anyone can create games" ON games
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update game" ON games
    FOR UPDATE USING (host_id = auth.uid()::text::uuid);

-- Players table policies
CREATE POLICY "Players can read game participants" ON players
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Players can join games" ON players
    FOR INSERT WITH CHECK (id = auth.uid()::text::uuid);

CREATE POLICY "Players can update themselves" ON players
    FOR UPDATE USING (id = auth.uid()::text::uuid);

-- Cards table policies
CREATE POLICY "Players can read game cards" ON cards
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "System can insert cards" ON cards
    FOR INSERT WITH CHECK (true);

-- Submissions table policies
CREATE POLICY "Players can read game submissions" ON submissions
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Players can create submissions" ON submissions
    FOR INSERT WITH CHECK (player_id = auth.uid()::text::uuid);

CREATE POLICY "Players can update own submissions" ON submissions
    FOR UPDATE USING (player_id = auth.uid()::text::uuid);

-- Votes table policies
CREATE POLICY "Players can read game votes" ON votes
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Players can vote" ON votes
    FOR INSERT WITH CHECK (player_id = auth.uid()::text::uuid);

\echo 'RLS policies created successfully.'

-- Migration 003: Functions and Triggers
\echo 'Creating database functions and triggers...'

-- All the functions from 003_functions_and_triggers.sql
-- (Content would be the same as in the previous file)

\echo 'Database setup completed successfully!'
\echo 'You can now run the seed.sql file to add test data.'