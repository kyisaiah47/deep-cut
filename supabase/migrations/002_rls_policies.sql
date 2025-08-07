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