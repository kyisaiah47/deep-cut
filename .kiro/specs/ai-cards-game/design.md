# Design Document

## Overview

The AI Cards Against Humanity game is built as a real-time multiplayer web application using Next.js 15 with TypeScript, Tailwind CSS for styling, and Supabase for backend services. The architecture follows a client-server model where the Next.js frontend handles the user interface and game logic, while Supabase provides real-time database synchronization, authentication, and AI integration through edge functions.

The game operates in distinct phases: lobby creation/joining, card distribution, submission, voting, and scoring. Each phase is synchronized across all clients using Supabase's real-time subscriptions, ensuring consistent game state for all players.

## Architecture

### Frontend Architecture

- **Next.js 15 App Router**: Handles routing, server-side rendering, and API routes
- **React 19**: Component-based UI with hooks for state management
- **TypeScript**: Type safety across all components and data structures
- **Tailwind CSS**: Utility-first styling for responsive design
- **Framer Motion**: Smooth animations for card interactions, transitions, and game state changes
- **Real-time Client**: Supabase client for live data synchronization

### Backend Architecture

- **Supabase Database**: PostgreSQL database with real-time capabilities
- **Supabase Auth**: User authentication and session management
- **Supabase Edge Functions**: Serverless functions for AI card generation
- **Real-time Subscriptions**: WebSocket connections for live game updates

### AI Integration

- **OpenAI API**: Integrated via Supabase Edge Functions for prompt and response generation
- **Fallback System**: Pre-written card sets for when AI generation fails
- **Content Moderation**: Basic filtering to ensure appropriate content

## Components and Interfaces

### Core Components

#### GameRoom Component

```typescript
interface GameRoomProps {
	roomCode: string;
	playerId: string;
}
```

- Manages overall game state and phase transitions
- Handles real-time subscriptions to game updates
- Coordinates between different game phase components

#### CardDisplay Component

```typescript
interface Card {
	id: string;
	type: "prompt" | "response";
	text: string;
	isSelected?: boolean;
}

interface CardDisplayProps {
	cards: Card[];
	onCardSelect: (cardId: string) => void;
	selectable: boolean;
	animationDelay?: number;
}
```

- Renders individual cards with appropriate styling and Framer Motion animations
- Handles card selection interactions with smooth hover and selection animations
- Supports both prompt and response card types with distinct animation styles
- Includes staggered entrance animations when cards are distributed

#### PlayerList Component

```typescript
interface Player {
	id: string;
	name: string;
	score: number;
	isHost: boolean;
	hasSubmitted: boolean;
	isConnected: boolean;
}

interface PlayerListProps {
	players: Player[];
	currentPlayerId: string;
}
```

- Displays all players in the game
- Shows connection status and submission indicators
- Highlights current player and host

#### Timer Component

```typescript
interface TimerProps {
	duration: number;
	onExpire: () => void;
	isActive: boolean;
}
```

- Displays countdown timer for each game phase
- Automatically triggers phase transitions
- Synchronized across all clients

#### VotingInterface Component

```typescript
interface Submission {
	id: string;
	playerId: string;
	cards: Card[];
	votes: number;
}

interface VotingInterfaceProps {
	submissions: Submission[];
	onVote: (submissionId: string) => void;
	hasVoted: boolean;
}
```

- Displays all submissions anonymously during voting
- Handles vote collection and prevents double voting
- Shows vote counts after voting ends

### API Interfaces

#### Game State Interface

```typescript
interface GameState {
	id: string;
	roomCode: string;
	phase: "lobby" | "distribution" | "submission" | "voting" | "results";
	currentRound: number;
	targetScore: number;
	settings: GameSettings;
	createdAt: string;
	updatedAt: string;
}

interface GameSettings {
	maxPlayers: number;
	submissionTimer: number;
	votingTimer: number;
	targetScore: number;
}
```

#### Real-time Event Interface

```typescript
interface GameEvent {
	type:
		| "player_joined"
		| "player_left"
		| "phase_change"
		| "cards_distributed"
		| "submission_received"
		| "voting_complete";
	gameId: string;
	data: any;
	timestamp: string;
}
```

## Data Models

### Database Schema

#### games table

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  phase VARCHAR(20) NOT NULL DEFAULT 'lobby',
  current_round INTEGER DEFAULT 1,
  target_score INTEGER DEFAULT 7,
  max_players INTEGER DEFAULT 8,
  submission_timer INTEGER DEFAULT 60,
  voting_timer INTEGER DEFAULT 30,
  host_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### players table

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### cards table

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('prompt', 'response')),
  text TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### submissions table

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  prompt_card_id UUID REFERENCES cards(id),
  response_cards JSONB NOT NULL,
  votes INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### votes table

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, round_number, game_id)
);
```

## Error Handling

### Client-Side Error Handling

- **Connection Errors**: Automatic reconnection with exponential backoff
- **Validation Errors**: Form validation with user-friendly error messages
- **Game State Errors**: Graceful handling of desynchronized states
- **AI Generation Failures**: Fallback to pre-written cards with user notification

### Server-Side Error Handling

- **Database Errors**: Transaction rollbacks and error logging
- **Real-time Subscription Failures**: Automatic resubscription attempts
- **AI API Failures**: Fallback card generation and error tracking
- **Rate Limiting**: Prevent spam and abuse with request throttling

### Error Recovery Strategies

```typescript
interface ErrorBoundaryState {
	hasError: boolean;
	errorType: "connection" | "game_state" | "ai_generation" | "unknown";
	retryCount: number;
}
```

## Testing Strategy

### Unit Testing

- **Component Testing**: React Testing Library for UI components
- **Hook Testing**: Custom hooks for game state management
- **Utility Testing**: Card generation and validation functions
- **API Testing**: Next.js API routes and Supabase functions

### Integration Testing

- **Real-time Flow Testing**: Multi-client game simulation
- **Database Integration**: Supabase operations and triggers
- **AI Integration**: Edge function testing with mocked responses
- **Authentication Flow**: User registration and game joining

### End-to-End Testing

- **Complete Game Flow**: Full multiplayer game simulation
- **Cross-browser Testing**: Ensure compatibility across browsers
- **Mobile Responsiveness**: Touch interactions and responsive design
- **Performance Testing**: Real-time synchronization under load

### Testing Tools

- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing automation
- **Supabase Local Development**: Isolated testing environment

## Performance Considerations

### Real-time Optimization

- **Selective Subscriptions**: Only subscribe to relevant game events
- **Debounced Updates**: Prevent excessive re-renders during rapid updates
- **Connection Pooling**: Efficient WebSocket connection management
- **State Normalization**: Optimized data structures for quick lookups

### AI Generation Optimization

- **Caching Strategy**: Cache generated cards for similar prompts
- **Batch Processing**: Generate multiple cards in single API calls
- **Fallback Performance**: Fast access to pre-written card sets
- **Rate Limiting**: Prevent API quota exhaustion

### Frontend Performance

- **Code Splitting**: Lazy load game components
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Monitor and optimize bundle size
- **Memory Management**: Proper cleanup of subscriptions and timers

## Animation Design

### Framer Motion Integration

The game uses Framer Motion to create engaging animations that enhance the user experience without interfering with gameplay flow.

### Animation Patterns

#### Card Animations

- **Card Distribution**: Staggered entrance animations when cards are dealt to players
- **Card Selection**: Smooth scale and glow effects when hovering and selecting cards
- **Card Submission**: Slide-out animation when cards are submitted
- **Card Reveal**: Flip animation when revealing submissions during voting

#### Game State Transitions

- **Phase Changes**: Smooth transitions between lobby, submission, voting, and results phases
- **Player Actions**: Subtle animations for player join/leave notifications
- **Score Updates**: Number counting animations and celebration effects for winners

#### UI Feedback

- **Button Interactions**: Micro-animations for all interactive elements
- **Loading States**: Skeleton animations while waiting for AI card generation
- **Timer Animations**: Smooth countdown with color changes as time expires
- **Connection Status**: Pulse animations for connection indicators

### Performance Considerations

- **Reduced Motion**: Respect user preferences for reduced motion accessibility
- **Animation Optimization**: Use transform and opacity properties for GPU acceleration
- **Conditional Animations**: Disable complex animations on slower devices
