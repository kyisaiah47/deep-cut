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