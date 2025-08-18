# AI Card Generation System

This document describes the AI-powered card generation system for the Cards Against Humanity-style game.

## Overview

The AI card generation system uses OpenAI's GPT models to create funny and engaging prompt and response cards for each game round. The system includes fallback mechanisms, content moderation, and caching for optimal performance.

## Architecture

### Components

1. **Supabase Edge Function** (`supabase/functions/generate-cards/`)

   - Serverless function that handles AI generation requests
   - Integrates with OpenAI API
   - Implements fallback and content moderation
   - Stores generated cards in the database

2. **Client-side Service** (`src/lib/card-generation.ts`)

   - Provides TypeScript interface for card generation
   - Implements caching mechanism
   - Handles client-side fallback generation
   - Manages card distribution to players

3. **React Hooks** (`src/hooks/useCardGeneration.ts`)

   - `useCardGeneration`: Manages AI card generation state
   - `useGameCards`: Handles loading and managing game cards
   - `useCardDistribution`: Manages card distribution to players

4. **API Routes** (`src/app/api/cards/`)
   - REST endpoints for card generation and management
   - Validation and error handling
   - Integration with the card generation service

## Environment Variables

### Required for AI Generation

```bash
# OpenAI API Configuration
GEMINI_API_KEY=your_GEMINI_API_KEY_here

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional Configuration

```bash
# AI Model Configuration (defaults provided)
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.8

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_CONTENT_MODERATION=true
ENABLE_CARD_CACHING=true
```

## Usage

### Generating Cards for a Round

```typescript
import { useCardGeneration } from "../hooks";

function GameComponent() {
	const { generateCardsForRound, isGenerating, generationError } =
		useCardGeneration();

	const handleStartRound = async () => {
		const result = await generateCardsForRound({
			gameId: "game-123",
			roundNumber: 1,
			playerCount: 4,
			theme: "technology", // optional
		});

		if (result.success) {
			console.log(`Generated ${result.cardsGenerated} cards`);
		}
	};

	return (
		<div>
			<button
				onClick={handleStartRound}
				disabled={isGenerating}
			>
				{isGenerating ? "Generating Cards..." : "Start Round"}
			</button>
			{generationError && <p>Error: {generationError}</p>}
		</div>
	);
}
```

### Loading Cards for Display

```typescript
import { useGameCards } from "../hooks";

function CardDisplay({ gameId, roundNumber, playerId }) {
	const {
		promptCard,
		playerCards,
		loadCardsForRound,
		loadPlayerCards,
		isLoading,
	} = useGameCards();

	useEffect(() => {
		loadCardsForRound(gameId, roundNumber);
		loadPlayerCards(gameId, roundNumber, playerId);
	}, [gameId, roundNumber, playerId]);

	if (isLoading) return <div>Loading cards...</div>;

	return (
		<div>
			{promptCard && <PromptCard card={promptCard} />}
			<div className="player-cards">
				{playerCards.map((card) => (
					<ResponseCard
						key={card.id}
						card={card}
					/>
				))}
			</div>
		</div>
	);
}
```

### Distributing Cards to Players

```typescript
import { useCardDistribution } from "../hooks";

function GameHost({ gameId, roundNumber, playerIds }) {
	const { distributeCardsToAllPlayers, isDistributing, distributionComplete } =
		useCardDistribution();

	const handleDistributeCards = async () => {
		const success = await distributeCardsToAllPlayers(
			gameId,
			roundNumber,
			playerIds,
			5 // cards per player
		);

		if (success) {
			console.log("Cards distributed successfully");
		}
	};

	return (
		<button
			onClick={handleDistributeCards}
			disabled={isDistributing}
		>
			{isDistributing ? "Distributing..." : "Distribute Cards"}
		</button>
	);
}
```

## API Endpoints

### Generate Cards

```
POST /api/cards/generate
```

Request body:

```json
{
  "gameId": "string",
  "roundNumber": number,
  "playerCount": number,
  "theme": "string (optional)"
}
```

### Distribute Cards

```
POST /api/cards/distribute
```

Request body:

```json
{
  "gameId": "string",
  "roundNumber": number,
  "playerIds": ["string"],
  "cardsPerPlayer": number
}
```

### Get Cards

```
GET /api/cards/{gameId}/{roundNumber}?type={all|prompt|response|player}&playerId={string}
```

### Delete Cards

```
DELETE /api/cards/{gameId}/{roundNumber}
```

## Fallback System

The system includes multiple fallback mechanisms:

1. **AI Generation Failure**: Falls back to pre-written card sets
2. **Network Issues**: Client-side fallback generation
3. **Content Moderation**: Filters inappropriate content
4. **Cache Miss**: Regenerates cards if cache expires

## Content Moderation

Basic content filtering is implemented to ensure family-friendly content:

- Filters inappropriate words and phrases
- Replaces filtered content with `[FILTERED]` placeholder
- Can be extended with more sophisticated moderation APIs

## Caching Strategy

- **Client-side caching**: 5-minute cache for generated cards
- **Automatic cleanup**: Expired cache entries are removed periodically
- **Cache invalidation**: Manual cache clearing available

## Performance Considerations

- **Batch Generation**: Generates multiple response cards in single API call
- **Async Processing**: Non-blocking card generation
- **Error Recovery**: Graceful degradation to fallback systems
- **Rate Limiting**: Prevents API quota exhaustion

## Monitoring and Metrics

The system tracks:

- Generation success/failure rates
- Response times
- Fallback usage
- Cache hit rates

Access metrics via:

```typescript
import { aiMetrics } from "../lib/ai-config";

const metrics = aiMetrics.getMetrics();
console.log("AI Generation Metrics:", metrics);
```

## Deployment

### Supabase Edge Function Deployment

```bash
# Deploy the edge function
supabase functions deploy generate-cards

# Set environment variables
supabase secrets set GEMINI_API_KEY=your_api_key_here
```

### Environment Setup

1. Add OpenAI API key to your environment variables
2. Deploy the Supabase Edge Function
3. Ensure database schema includes the `cards` table
4. Test the generation system with a sample request

## Troubleshooting

### Common Issues

1. **OpenAI API Key Missing**

   - Ensure `GEMINI_API_KEY` is set in environment variables
   - Check Supabase secrets configuration

2. **Generation Failures**

   - Check OpenAI API quota and billing
   - Verify network connectivity
   - Review error logs in Supabase dashboard

3. **Fallback Not Working**

   - Ensure fallback card sets are properly configured
   - Check database permissions for card insertion

4. **Cache Issues**
   - Clear cache manually if needed
   - Check cache expiration settings
   - Verify cache key generation

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG_AI_GENERATION=true
```

This will log detailed information about:

- API requests and responses
- Cache operations
- Fallback activations
- Content moderation results
