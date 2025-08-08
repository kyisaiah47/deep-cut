-- Complete database setup script for AI Cards Game
-- Generated on 2025-08-08T22:06:20.475Z
-- Run this script to set up the entire database schema, policies, and functions

-- Migration 1: 001_initial_schema.sql
-- --------------------------------------------------

-- Initial database schema for AI Cards Game
-- This migration creates all the necessary tables for the multiplayer card game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create games table
CREATE TABLE games (
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
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('prompt', 'response')),
  text TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
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
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, round_number, game_id)
);

-- Add foreign key constraint for host_id after players table is created
ALTER TABLE games ADD CONSTRAINT fk_games_host_id FOREIGN KEY (host_id) REFERENCES players(id);

-- Create indexes for better performance
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_cards_game_id_round ON cards(game_id, round_number);
CREATE INDEX idx_cards_player_id ON cards(player_id);
CREATE INDEX idx_submissions_game_id_round ON submissions(game_id, round_number);
CREATE INDEX idx_submissions_player_id ON submissions(player_id);
CREATE INDEX idx_votes_game_id_round ON votes(game_id, round_number);
CREATE INDEX idx_votes_submission_id ON votes(submission_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for games table
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Migration 2: 002_rls_policies.sql
-- --------------------------------------------------

-- Row Level Security (RLS) policies for multiplayer game access
-- These policies ensure players can only access data from games they're participating in

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Games table policies
-- Players can read games they are participating in
CREATE POLICY "Players can read their games" ON games
    FOR SELECT USING (
        id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- Anyone can create a new game (for game creation)
CREATE POLICY "Anyone can create games" ON games
    FOR INSERT WITH CHECK (true);

-- Only the host can update game settings
CREATE POLICY "Host can update game" ON games
    FOR UPDATE USING (host_id = auth.uid()::text::uuid);

-- Players table policies
-- Players can read all players in games they're participating in
CREATE POLICY "Players can read game participants" ON players
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- Players can insert themselves into games
CREATE POLICY "Players can join games" ON players
    FOR INSERT WITH CHECK (id = auth.uid()::text::uuid);

-- Players can update their own data
CREATE POLICY "Players can update themselves" ON players
    FOR UPDATE USING (id = auth.uid()::text::uuid);

-- Cards table policies
-- Players can read cards from games they're in
CREATE POLICY "Players can read game cards" ON cards
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- System can insert cards (via service role)
CREATE POLICY "System can insert cards" ON cards
    FOR INSERT WITH CHECK (true);

-- Submissions table policies
-- Players can read all submissions in their games (for voting)
CREATE POLICY "Players can read game submissions" ON submissions
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- Players can insert their own submissions
CREATE POLICY "Players can create submissions" ON submissions
    FOR INSERT WITH CHECK (player_id = auth.uid()::text::uuid);

-- Players can update their own submissions (before voting phase)
CREATE POLICY "Players can update own submissions" ON submissions
    FOR UPDATE USING (player_id = auth.uid()::text::uuid);

-- Votes table policies
-- Players can read votes in their games
CREATE POLICY "Players can read game votes" ON votes
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- Players can insert their own votes
CREATE POLICY "Players can vote" ON votes
    FOR INSERT WITH CHECK (player_id = auth.uid()::text::uuid);

-- Players cannot update or delete votes (voting is final)
-- No UPDATE or DELETE policies means these operations are not allowed

-- Migration 3: 003_functions_and_triggers.sql
-- --------------------------------------------------

-- Database functions and triggers for real-time game state management

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    -- Generate 6 character room code
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists, regenerate if it does
    WHILE EXISTS(SELECT 1 FROM games WHERE room_code = result) LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set host when first player joins
CREATE OR REPLACE FUNCTION set_first_player_as_host()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is the first player in the game, make them the host
    IF NOT EXISTS (SELECT 1 FROM players WHERE game_id = NEW.game_id AND id != NEW.id) THEN
        UPDATE games SET host_id = NEW.id WHERE id = NEW.game_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set first player as host
CREATE TRIGGER trigger_set_first_player_as_host
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION set_first_player_as_host();

-- Function to transfer host when current host leaves
CREATE OR REPLACE FUNCTION transfer_host_on_leave()
RETURNS TRIGGER AS $$
DECLARE
    new_host_id UUID;
BEGIN
    -- If the leaving player was the host, transfer to another player
    IF OLD.id = (SELECT host_id FROM games WHERE id = OLD.game_id) THEN
        -- Find another connected player to be the new host
        SELECT id INTO new_host_id 
        FROM players 
        WHERE game_id = OLD.game_id 
          AND id != OLD.id 
          AND is_connected = true 
        ORDER BY joined_at ASC 
        LIMIT 1;
        
        -- Update the game with new host (or null if no players left)
        UPDATE games 
        SET host_id = new_host_id 
        WHERE id = OLD.game_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to transfer host when player leaves
CREATE TRIGGER trigger_transfer_host_on_leave
    AFTER DELETE ON players
    FOR EACH ROW
    EXECUTE FUNCTION transfer_host_on_leave();

-- Function to update vote count when votes are added
CREATE OR REPLACE FUNCTION update_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the vote count in submissions table
    UPDATE submissions 
    SET votes = (
        SELECT COUNT(*) 
        FROM votes 
        WHERE submission_id = NEW.submission_id
    )
    WHERE id = NEW.submission_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote counts
CREATE TRIGGER trigger_update_submission_vote_count
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_vote_count();

-- Function to check if all players have submitted for a round
CREATE OR REPLACE FUNCTION check_all_players_submitted(game_uuid UUID, round_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    total_players INTEGER;
    submitted_players INTEGER;
BEGIN
    -- Count total connected players in the game
    SELECT COUNT(*) INTO total_players
    FROM players 
    WHERE game_id = game_uuid AND is_connected = true;
    
    -- Count players who have submitted for this round
    SELECT COUNT(*) INTO submitted_players
    FROM submissions 
    WHERE game_id = game_uuid AND round_number = round_num;
    
    RETURN submitted_players >= total_players;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all players have voted for a round
CREATE OR REPLACE FUNCTION check_all_players_voted(game_uuid UUID, round_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    total_players INTEGER;
    voted_players INTEGER;
BEGIN
    -- Count total connected players in the game
    SELECT COUNT(*) INTO total_players
    FROM players 
    WHERE game_id = game_uuid AND is_connected = true;
    
    -- Count unique players who have voted for this round
    SELECT COUNT(DISTINCT player_id) INTO voted_players
    FROM votes 
    WHERE game_id = game_uuid AND round_number = round_num;
    
    RETURN voted_players >= total_players;
END;
$$ LANGUAGE plpgsql;

-- Function to get round winner(s)
CREATE OR REPLACE FUNCTION get_round_winners(game_uuid UUID, round_num INTEGER)
RETURNS TABLE(player_id UUID, player_name TEXT, votes INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as player_id,
        p.name as player_name,
        s.votes
    FROM submissions s
    JOIN players p ON s.player_id = p.id
    WHERE s.game_id = game_uuid 
      AND s.round_number = round_num
      AND s.votes = (
          SELECT MAX(votes) 
          FROM submissions 
          WHERE game_id = game_uuid AND round_number = round_num
      );
END;
$$ LANGUAGE plpgsql;

-- Function to update player scores after a round
CREATE OR REPLACE FUNCTION update_player_scores(game_uuid UUID, round_num INTEGER)
RETURNS VOID AS $$
DECLARE
    winner_record RECORD;
BEGIN
    -- Add 1 point to each round winner
    FOR winner_record IN 
        SELECT player_id FROM get_round_winners(game_uuid, round_num)
    LOOP
        UPDATE players 
        SET score = score + 1 
        WHERE id = winner_record.player_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if game should end (someone reached target score)
CREATE OR REPLACE FUNCTION check_game_end(game_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    target INTEGER;
    max_score INTEGER;
BEGIN
    -- Get target score for the game
    SELECT target_score INTO target FROM games WHERE id = game_uuid;
    
    -- Get highest current score
    SELECT MAX(score) INTO max_score 
    FROM players 
    WHERE game_id = game_uuid;
    
    RETURN max_score >= target;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up disconnected players after timeout
CREATE OR REPLACE FUNCTION cleanup_disconnected_players()
RETURNS VOID AS $$
BEGIN
    -- Remove players who have been disconnected for more than 5 minutes
    DELETE FROM players 
    WHERE is_connected = false 
      AND joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
-- Function
 to increment submission votes (used by client)
CREATE OR REPLACE FUNCTION increment_submission_votes(submission_id UUID)
RETURNS VOID AS $
BEGIN
    UPDATE submissions 
    SET votes = votes + 1 
    WHERE id = submission_id;
END;
$ LANGUAGE plpgsql;

-- Migration 4: 004_timer_synchronization.sql
-- --------------------------------------------------

-- Timer synchronization table for synchronized countdowns across clients
-- This migration adds support for synchronized timers in multiplayer games

-- Create game_timers table for timer synchronization
CREATE TABLE game_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('lobby', 'distribution', 'submission', 'voting', 'results')),
  duration INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paused_at TIMESTAMP WITH TIME ZONE,
  time_remaining INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, phase)
);

-- Create index for better performance
CREATE INDEX idx_game_timers_game_id ON game_timers(game_id);
CREATE INDEX idx_game_timers_active ON game_timers(game_id, is_active);

-- Create trigger to automatically update updated_at for game_timers table
CREATE TRIGGER update_game_timers_updated_at 
    BEFORE UPDATE ON game_timers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get server time for synchronization
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate remaining time for a timer
CREATE OR REPLACE FUNCTION get_timer_remaining(
    p_game_id UUID,
    p_phase VARCHAR(20)
)
RETURNS INTEGER AS $$
DECLARE
    timer_record RECORD;
    elapsed_seconds INTEGER;
    remaining_time INTEGER;
BEGIN
    -- Get the timer record
    SELECT * INTO timer_record
    FROM game_timers
    WHERE game_id = p_game_id AND phase = p_phase AND is_active = true;
    
    -- If no active timer found, return 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- If timer is paused, return stored remaining time
    IF timer_record.is_paused THEN
        RETURN COALESCE(timer_record.time_remaining, 0);
    END IF;
    
    -- Calculate elapsed time since start
    elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - timer_record.started_at))::INTEGER;
    
    -- Calculate remaining time
    remaining_time := timer_record.duration - elapsed_seconds;
    
    -- Return 0 if timer has expired
    RETURN GREATEST(0, remaining_time);
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically expire timers
CREATE OR REPLACE FUNCTION expire_timers()
RETURNS VOID AS $$
BEGIN
    -- Mark expired timers as inactive
    UPDATE game_timers
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
      AND is_paused = false
      AND EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER >= duration;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE game_timers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for game_timers
CREATE POLICY "Players can view timers for their games" ON game_timers
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players WHERE id = auth.uid()
        )
    );

CREATE POLICY "Players can insert timers for their games" ON game_timers
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT game_id FROM players WHERE id = auth.uid()
        )
    );

CREATE POLICY "Players can update timers for their games" ON game_timers
    FOR UPDATE USING (
        game_id IN (
            SELECT game_id FROM players WHERE id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON game_timers TO authenticated;
GRANT EXECUTE ON FUNCTION get_server_time() TO authenticated;
GRANT EXECUTE ON FUNCTION get_timer_remaining(UUID, VARCHAR) TO authenticated;

