-- Add theme column to rooms table
ALTER TABLE rooms ADD COLUMN theme TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN rooms.theme IS 'The selected theme for the game room';
