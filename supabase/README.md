# Supabase Database Setup

This directory contains all the database schema, migrations, and setup files for the AI Cards Game.

## Files Overview

- `migrations/001_initial_schema.sql` - Creates all database tables and indexes
- `migrations/002_rls_policies.sql` - Sets up Row Level Security policies
- `migrations/003_functions_and_triggers.sql` - Database functions and triggers for game logic
- `setup.sql` - Complete setup script that runs all migrations
- `seed.sql` - Sample data for testing and development
- `README.md` - This file

## Database Schema

### Tables

1. **games** - Stores game rooms and settings
2. **players** - Stores player information and scores
3. **cards** - Stores prompt and response cards
4. **submissions** - Stores player card submissions for each round
5. **votes** - Stores voting data for submissions

### Key Features

- **Row Level Security (RLS)** - Ensures players can only access data from games they're participating in
- **Real-time subscriptions** - All tables support Supabase real-time updates
- **Automatic host management** - First player becomes host, host transfers when current host leaves
- **Vote counting** - Automatic vote tallying with triggers
- **Game state functions** - Helper functions for checking game progression

## Setup Instructions

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:

   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already done):

   ```bash
   supabase init
   ```

3. Start local Supabase instance:

   ```bash
   supabase start
   ```

4. Run migrations:

   ```bash
   supabase db reset
   ```

5. The migrations will be applied automatically from the `migrations/` directory.

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup.sql`
4. Run the script
5. Optionally, run `seed.sql` for test data

### Option 3: Manual Migration

Run each migration file in order:

1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_functions_and_triggers.sql`

## Environment Variables

Make sure you have the following environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

After setup, you can test the database by:

1. Running the seed data: `seed.sql`
2. Using the Supabase dashboard to browse tables
3. Testing RLS policies by creating test users
4. Verifying real-time subscriptions work

## Key Functions

The database includes several helper functions:

- `generate_room_code()` - Generates unique 6-character room codes
- `check_all_players_submitted(game_id, round)` - Checks if all players have submitted
- `check_all_players_voted(game_id, round)` - Checks if all players have voted
- `get_round_winners(game_id, round)` - Returns round winners
- `update_player_scores(game_id, round)` - Updates scores after a round
- `check_game_end(game_id)` - Checks if game should end

## Security

- All tables have RLS enabled
- Players can only access data from games they're participating in
- Only game hosts can modify game settings
- Votes are immutable once cast
- Automatic cleanup of disconnected players

## Real-time Features

All tables support Supabase real-time subscriptions for:

- Player join/leave events
- Game phase changes
- Card submissions
- Vote updates
- Score changes

## Troubleshooting

If you encounter issues:

1. Check that all environment variables are set correctly
2. Verify your Supabase project has the required permissions
3. Ensure the UUID extension is enabled
4. Check the Supabase logs for any error messages
5. Verify RLS policies are not blocking legitimate operations
