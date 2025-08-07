-- Seed data for testing the AI Cards Game
-- This file contains sample data for development and testing

-- Insert sample fallback cards for when AI generation fails
-- These are generic Cards Against Humanity style prompts and responses

-- Sample prompt cards (black cards)
INSERT INTO cards (id, game_id, round_number, type, text, player_id) VALUES
-- We'll use a dummy game_id that can be replaced in tests
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'I never truly understood _____ until I encountered _____.', NULL),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What''s the secret to a successful relationship? _____.', NULL),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'In the new Disney movie, _____ teams up with _____ to save _____.', NULL),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What ended my last relationship? _____.', NULL),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What''s the next Happy Meal toy? _____.', NULL),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What gives me uncontrollable gas? _____.', NULL),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What''s my secret power? _____.', NULL),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What will always get you laid? _____.', NULL),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'What''s the most emo? _____.', NULL),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 1, 'prompt', 'Instead of coal, Santa now gives the bad children _____.', NULL);

-- Sample response cards (white cards)
INSERT INTO cards (id, game_id, round_number, type, text, player_id) VALUES
-- Response cards
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A disappointing birthday party.', NULL),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Vigorous jazz hands.', NULL),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Pretending to care.', NULL),
('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A windmill full of corpses.', NULL),
('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Switching to Geico.', NULL),
('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000000', 1, 'response', 'The inevitable heat death of the universe.', NULL),
('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Spontaneous human combustion.', NULL),
('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A really cool hat.', NULL),
('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Passive-aggressive Post-it notes.', NULL),
('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000000', 1, 'response', 'The miracle of childbirth.', NULL),
('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A lifetime of sadness.', NULL),
('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Poorly-timed Holocaust jokes.', NULL),
('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Authentic Mexican cuisine.', NULL),
('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Dying of dysentery.', NULL),
('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Pixelated bukkake.', NULL),
('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A good sniff.', NULL),
('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Whipping it out.', NULL),
('00000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Making a pouty face.', NULL),
('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000000', 1, 'response', 'Silence.', NULL),
('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000000', 1, 'response', 'A falcon with a cap on its head.', NULL);

-- Create a sample test game for development
INSERT INTO games (id, room_code, phase, current_round, target_score, max_players, submission_timer, voting_timer, host_id) VALUES
('11111111-1111-1111-1111-111111111111', 'TEST01', 'lobby', 1, 5, 6, 60, 30, NULL);

-- Create sample test players
INSERT INTO players (id, game_id, name, score, is_connected) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Alice', 0, true),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Bob', 0, true),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Charlie', 0, true);

-- Update the test game to set Alice as host
UPDATE games SET host_id = '22222222-2222-2222-2222-222222222222' WHERE id = '11111111-1111-1111-1111-111111111111';

-- Note: In a real application, the card data would be generated dynamically by AI
-- or loaded from a more comprehensive card database. This seed data is just for testing.