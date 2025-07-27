-- Add missing columns to rooms table
-- Run this in your Supabase SQL Editor

-- Add theme column for storing game themes
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS theme TEXT;

-- Add game_started column for synchronized game start
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_started BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_theme ON rooms(theme);
CREATE INDEX IF NOT EXISTS idx_rooms_game_started ON rooms(game_started);

-- Optional: Reset all existing rooms to not started (in case you want to test)
-- UPDATE rooms SET game_started = FALSE;
