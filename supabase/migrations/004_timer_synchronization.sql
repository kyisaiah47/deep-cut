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