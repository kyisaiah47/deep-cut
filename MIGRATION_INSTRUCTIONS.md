# Database Migration Instructions

To add theme support to your Deep Cut game, you need to add a `theme` column to the `rooms` table in your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste this SQL command:

```sql
ALTER TABLE rooms ADD COLUMN theme TEXT;
```

5. Click "Run" to execute the migration

## Option 2: Using Supabase CLI (if you have it installed)

If you have the Supabase CLI installed, you can run:

```bash
npx supabase db push
```

Then execute the SQL file manually in the SQL editor.

## Verification

After running the migration, you can verify it worked by checking that:

1. The `rooms` table now has a `theme` column
2. When you create a new game room and select a theme, all players joining that room will see the same theme in the lobby

## What This Migration Does

- Adds a `theme` TEXT column to the existing `rooms` table
- Allows the app to store the selected theme in the database
- Enables all players joining a room to see the same theme that was selected when the room was created
