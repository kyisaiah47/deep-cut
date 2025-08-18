# Deep Cut - Multiplayer AI Card Game

A sophisticated, dark-themed Cards Against Humanity-style multiplayer game featuring AI-generated content, real-time gameplay, and polished animations. Built with Next.js 15, Supabase, Google Gemini AI, and Framer Motion.

## 🎮 Game Overview

**Deep Cut** is a real-time multiplayer party game where players compete by creating the funniest combinations of AI-generated prompt and response cards. The game features a dark, sinister aesthetic with smooth animations and supports 3-8 players per game.

### Game Flow

1. **Lobby Phase**: Players create or join games with room codes
2. **Distribution Phase**: AI generates unique prompt and response cards for each round
3. **Submission Phase**: Players select response cards to match the prompt
4. **Voting Phase**: Players vote on the best submissions (excluding their own)
5. **Results Phase**: Scores are calculated and displayed before the next round

Players compete across multiple rounds until someone reaches the target score (customizable 3-15 points).

## 🚀 Key Features

### Real-Time Multiplayer

- **WebSocket connections** via Supabase real-time subscriptions
- **Automatic reconnection** and error recovery systems
- **Host migration** when the current host leaves
- **Connection status monitoring** with visual indicators

### AI-Powered Content Generation

- **Google Gemini integration** for generating creative cards
- **Smart content moderation** with fallback systems
- **Dynamic card distribution** based on player count
- **Content caching** to improve performance

### Responsive Design & Animations

- **Mobile-first responsive design** optimized for all devices
- **Framer Motion animations** with reduced motion preferences support
- **Dark theme** with purple/blue gradients and sinister styling
- **Skeleton loading states** and smooth transitions

### Advanced Game Features

- **Timed rounds** with synchronized countdowns
- **Comprehensive scoring system** with round-by-round tracking
- **Error boundaries** and recovery mechanisms
- **Performance monitoring** and optimization tools

## 🛠 Tech Stack

### Frontend

- **Next.js 15** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom dark theme
- **Framer Motion** - Advanced animations and transitions
- **Lucide React** - Modern icon library

### Backend & Database

- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security (RLS)** - Secure data access patterns
- **Supabase Edge Functions** - Serverless functions for AI integration
- **Real-time subscriptions** - WebSocket-based live updates

### AI & Content

- **Google Gemini API** - AI content generation
- **Content moderation** - Automated and fallback filtering
- **Caching systems** - Performance optimization for generated content

### DevOps & Testing

- **Jest** - Unit and integration testing
- **ESLint & TypeScript** - Code quality and type checking
- **Docker** - Containerized deployment
- **Webpack Bundle Analyzer** - Performance monitoring

## 📁 Project Architecture

### Application Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Root redirect to lobby
│   ├── layout.tsx           # Global layout with fonts & performance tools
│   ├── lobby/               # Game creation and joining
│   ├── game/[roomCode]/     # Main game interface (dynamic routing)
│   ├── card-demo/           # AI card generation demo
│   ├── submission-demo/     # Submission interface demo
│   └── voting-demo/         # Voting interface demo
├── components/              # React components (78+ files)
│   ├── GameInterface.tsx    # Main game orchestrator
│   ├── GameLobby.tsx       # Pre-game player management
│   ├── SubmissionInterface.tsx # Card selection interface
│   ├── VotingInterface.tsx  # Voting UI
│   ├── ScoreManager.tsx     # Scoring and results
│   ├── ErrorBoundary.tsx    # Error handling wrapper
│   └── [50+ more components]
├── contexts/                # React Context providers
│   └── GameContext.tsx      # Central game state management
├── hooks/                   # Custom React hooks (40+ files)
│   ├── useGameState.ts      # Core game state logic
│   ├── usePlayerManagement.ts # Player join/leave/host logic
│   ├── useRealtimeSubscription.ts # WebSocket management
│   ├── useErrorRecovery.ts  # Error handling and recovery
│   └── [30+ more hooks]
├── lib/                     # Utility libraries
│   ├── supabase.ts          # Database client configuration
│   ├── card-generation.ts   # AI card generation logic
│   ├── ai-config.ts         # Gemini AI configuration
│   ├── constants.ts         # Game constants and animations
│   ├── error-handling.ts    # Centralized error management
│   └── [20+ more utilities]
└── types/                   # TypeScript type definitions
    └── game.ts              # Core game type interfaces
```

### Database Schema (Supabase)

```sql
-- Core Tables
games         # Game rooms, settings, and state
players       # Player data, scores, connection status
cards         # AI-generated prompts and responses
submissions   # Player card combinations per round
votes         # Voting data for each submission

-- Key Features
- Row Level Security (RLS) policies
- Real-time subscriptions on all tables
- Automatic functions for game state management
- Host transfer mechanisms
- Score calculation triggers
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Google Gemini API key

### 1. Clone and Install

```bash
git clone [repository-url]
cd kiro-card-game
npm install
```

### 2. Environment Configuration

Create `.env.local` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Database Setup

```bash
# Using Supabase CLI (recommended)
supabase start
supabase db reset

# Or manually via dashboard: Run supabase/setup.sql
```

### 4. Development Server

```bash
npm run dev          # Start with Turbopack
npm run dev:prod     # Production mode locally
npm run test         # Run test suite
npm run lint         # ESLint checking
```

### 5. Production Deployment

```bash
npm run build        # Production build
npm run deploy:check # Pre-deployment validation
npm run docker:build # Docker containerization
```

## 🎯 Game Configuration

### Customizable Settings

- **Player Limits**: 3-8 players per game
- **Target Score**: 3-15 points to win
- **Timer Settings**: Configurable submission (60s) and voting (30s) timers
- **AI Themes**: Optional thematic card generation
- **Room Codes**: 6-character unique identifiers

### Game Constants

```typescript
GAME_PHASES: lobby | distribution | submission | voting | results
TIMER_DURATIONS: 60s submission, 30s voting (configurable)
ANIMATION_DURATIONS: Optimized for 60fps performance
RESPONSIVE_BREAKPOINTS: Mobile-first responsive design
```

## 🔌 API Integration

### Supabase Integration

- **Authentication**: Anonymous user sessions
- **Real-time**: WebSocket subscriptions for live updates
- **Edge Functions**: AI content generation serverless functions
- **Row Level Security**: Player-specific data access

### Google Gemini AI

- **Card Generation**: Dynamic prompt and response creation
- **Content Moderation**: Automated filtering with fallbacks
- **Caching**: 5-minute cache for performance optimization
- **Fallback System**: Client-side generation when AI fails

## 🧪 Testing & Quality

### Test Coverage

```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage reports
npm run test:ci       # CI/CD pipeline tests
```

### Code Quality

- **TypeScript strict mode** for type safety
- **ESLint configuration** with Next.js and React rules
- **Automated error boundaries** for fault tolerance
- **Performance monitoring** with built-in dashboards

## 🚀 Performance Features

### Optimization Strategies

- **Lazy loading** for non-critical components
- **Skeleton screens** during loading states
- **Image optimization** with Next.js Image component
- **Bundle analysis** with webpack-bundle-analyzer
- **Reduced motion** support for accessibility

### Real-time Optimization

- **Connection pooling** via Supabase
- **Automatic reconnection** with exponential backoff
- **Error recovery systems** with user feedback
- **Performance monitoring** and alerting

## 🔒 Security & Privacy

### Data Protection

- **Row Level Security (RLS)** on all database tables
- **Content moderation** for user-generated content
- **Session management** with automatic cleanup
- **Input validation** and sanitization

### Game Integrity

- **Anti-cheat measures** through server-side validation
- **Vote verification** to prevent duplicate voting
- **Host privilege verification** for game control actions
- **Automatic disconnection handling**

## 🐳 Deployment

### Docker Support

```bash
npm run docker:build # Build container
npm run docker:run   # Run locally
```

### Vercel Deployment (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

### Manual Deployment

```bash
npm run deploy:check # Validate before deployment
npm run build        # Production build
npm start           # Production server
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** feature branch from `main`
3. **Implement** changes with tests
4. **Run** quality checks: `npm run lint && npm run test`
5. **Submit** pull request with detailed description

### Code Standards

- **TypeScript** for all new code
- **Component composition** over inheritance
- **Custom hooks** for reusable logic
- **Error boundaries** for fault tolerance
- **Responsive design** for all components

## 📚 Additional Documentation

- **`/docs/ai-card-generation.md`** - AI integration details
- **`/docs/database-implementation.md`** - Database schema and functions
- **`/docs/round-management.md`** - Game flow and state management
- **`/supabase/README.md`** - Database setup and schema
- **`DEPLOYMENT.md`** - Production deployment guide
- **`PRODUCTION_CHECKLIST.md`** - Go-live verification

## 🆘 Troubleshooting

### Common Issues

- **Connection problems**: Check Supabase URL and keys
- **AI generation failures**: Verify Gemini API key and quotas
- **Build errors**: Clear `.next` and `node_modules`, reinstall
- **Database issues**: Check RLS policies and table permissions

### Debug Tools

- **Performance dashboard**: Built-in monitoring (`/components/PerformanceDashboard`)
- **Error tracking**: Comprehensive error boundaries
- **Connection status**: Real-time connection monitoring
- **Developer tools**: Browser DevTools integration

---

**Deep Cut** - Where AI meets dark humor in multiplayer gaming. Built for performance, designed for fun.
