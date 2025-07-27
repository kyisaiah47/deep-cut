-- Add game_started column to rooms table
-- Run this in your Supabase SQL Editor

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_started BOOLEAN DEFAULT FALSE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_game_started ON rooms(game_started);

-- Optional: Reset all existing rooms to not started (in case you want to test)
-- UPDATE rooms SET game_started = FALSE;
