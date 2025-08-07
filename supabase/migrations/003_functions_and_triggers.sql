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