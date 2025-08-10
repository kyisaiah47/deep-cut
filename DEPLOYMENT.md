# AI Cards Game - Deployment Guide

## Overview

This guide covers the complete deployment process for the AI Cards Game, including environment setup, database configuration, and production deployment.

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key
- Vercel account (for deployment) or Docker (for self-hosting)

## Environment Setup

### 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for AI card generation)
OPENAI_API_KEY=your_openai_api_key

# Optional: Performance Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### 2. Supabase Setup

#### Database Schema

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Run the migration files in order
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_rls_policies.sql
\i supabase/migrations/003_functions_and_triggers.sql
\i supabase/migrations/004_timer_synchronization.sql
```

Or use the setup script:

```bash
npm run db:setup
```

#### Edge Functions

Deploy the card generation edge function:

```bash
supabase functions deploy generate-cards --project-ref your-project-ref
```

### 3. Local Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Run development server
npm run dev
```

## Production Deployment

### Option 1: Vercel Deployment (Recommended)

1. **Connect Repository**

   - Fork/clone the repository to your GitHub account
   - Connect your Vercel account to GitHub
   - Import the project in Vercel

2. **Environment Variables**

   - Add all environment variables from `.env.local` to Vercel
   - Ensure `NEXT_PUBLIC_` variables are properly set

3. **Build Configuration**

   - Vercel will automatically detect Next.js and use the correct build settings
   - Build command: `npm run build`
   - Output directory: `.next`

4. **Domain Setup**
   - Configure your custom domain in Vercel
   - Update CORS settings in Supabase to include your domain

### Option 2: Docker Deployment

1. **Build Docker Image**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. **Build and Run**

```bash
# Build image
docker build -t ai-cards-game .

# Run container
docker run -p 3000:3000 --env-file .env.local ai-cards-game
```

### Option 3: Self-Hosting with PM2

1. **Install PM2**

```bash
npm install -g pm2
```

2. **Build Application**

```bash
npm run build
```

3. **PM2 Configuration**

Create `ecosystem.config.js`:

```javascript
module.exports = {
	apps: [
		{
			name: "ai-cards-game",
			script: "npm",
			args: "start",
			cwd: "/path/to/your/app",
			env: {
				NODE_ENV: "production",
				PORT: 3000,
			},
			env_file: ".env.local",
			instances: "max",
			exec_mode: "cluster",
			watch: false,
			max_memory_restart: "1G",
			error_file: "./logs/err.log",
			out_file: "./logs/out.log",
			log_file: "./logs/combined.log",
			time: true,
		},
	],
};
```

4. **Start Application**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Optimization

### Indexing

Ensure these indexes are created for optimal performance:

```sql
-- Game lookups
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase);

-- Player queries
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_connected ON players(is_connected);

-- Card distribution
CREATE INDEX IF NOT EXISTS idx_cards_game_round ON cards(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_cards_player ON cards(player_id);

-- Submissions and voting
CREATE INDEX IF NOT EXISTS idx_submissions_game_round ON submissions(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_game_round ON votes(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_player_round ON votes(player_id, round_number);
```

### Connection Pooling

Configure Supabase connection pooling:

```sql
-- In Supabase dashboard, set:
-- Pool Size: 15
-- Pool Mode: Transaction
-- Max Client Connections: 200
```

## Performance Monitoring

### 1. Enable Performance Dashboard

Set environment variable:

```bash
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### 2. Monitor Key Metrics

- Real-time connection latency
- Database query performance
- AI generation response times
- Memory usage and cleanup

### 3. Error Tracking

The application includes built-in error tracking. Monitor logs for:

- Connection failures
- AI generation errors
- Database transaction failures
- Real-time synchronization issues

## Security Configuration

### 1. Supabase RLS Policies

Ensure Row Level Security is enabled and policies are properly configured:

```sql
-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
```

### 2. CORS Configuration

In Supabase dashboard, configure CORS for your domain:

```
https://yourdomain.com
https://www.yourdomain.com
```

### 3. Rate Limiting

The application includes built-in rate limiting. Configure limits in production:

```typescript
// In src/lib/rate-limiting.ts
export const RATE_LIMITS = {
	gameCreation: { requests: 5, window: 60000 }, // 5 games per minute
	cardGeneration: { requests: 10, window: 60000 }, // 10 generations per minute
	submissions: { requests: 30, window: 60000 }, // 30 submissions per minute
	votes: { requests: 50, window: 60000 }, // 50 votes per minute
};
```

## Scaling Considerations

### 1. Database Scaling

- Monitor connection pool usage
- Consider read replicas for high traffic
- Implement database connection retry logic

### 2. Real-time Scaling

- Monitor WebSocket connection limits
- Implement connection cleanup for abandoned sessions
- Consider horizontal scaling with load balancers

### 3. AI Generation Scaling

- Implement request queuing for high demand
- Cache frequently generated card combinations
- Set up fallback systems for API failures

## Monitoring and Maintenance

### 1. Health Checks

The application includes health check endpoints:

- `/api/health` - Basic application health
- `/api/health/database` - Database connectivity
- `/api/health/realtime` - Real-time system status

### 2. Backup Strategy

- Supabase provides automatic backups
- Consider additional backup strategies for critical data
- Test restore procedures regularly

### 3. Updates and Maintenance

- Monitor for security updates
- Test updates in staging environment
- Plan maintenance windows for database migrations

## Troubleshooting

### Common Issues

1. **Real-time Connection Failures**

   - Check WebSocket configuration
   - Verify CORS settings
   - Monitor connection pool limits

2. **AI Generation Errors**

   - Verify OpenAI API key and quota
   - Check fallback card system
   - Monitor rate limiting

3. **Database Performance**

   - Check query execution plans
   - Monitor connection pool usage
   - Verify index usage

4. **Memory Leaks**
   - Monitor component cleanup
   - Check subscription disposal
   - Review timer management

### Support

For deployment issues:

1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Monitor real-time subscriptions
5. Review error tracking dashboard

## Conclusion

This deployment guide covers the essential steps for deploying the AI Cards Game in production. Follow the security and performance recommendations for optimal operation.
