/**
 * Rate limiting and abuse prevention for game operations
 */

import { rateLimiter } from "./performance-monitor";

export interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
	keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: number;
	retryAfter?: number;
}

// Default rate limit configurations for different operations
export const RATE_LIMITS = {
	// Game creation - 5 games per minute per IP
	GAME_CREATION: {
		maxRequests: 5,
		windowMs: 60 * 1000,
	},

	// Game joining - 10 joins per minute per IP
	GAME_JOINING: {
		maxRequests: 10,
		windowMs: 60 * 1000,
	},

	// Card generation - 3 generations per minute per game
	CARD_GENERATION: {
		maxRequests: 3,
		windowMs: 60 * 1000,
	},

	// Submissions - 1 per round per player (handled separately)
	CARD_SUBMISSION: {
		maxRequests: 1,
		windowMs: 5 * 60 * 1000, // 5 minutes
	},

	// Voting - 1 per round per player (handled separately)
	VOTING: {
		maxRequests: 1,
		windowMs: 5 * 60 * 1000, // 5 minutes
	},

	// General API calls - 100 per minute per IP
	API_GENERAL: {
		maxRequests: 100,
		windowMs: 60 * 1000,
	},

	// Real-time connections - 5 per minute per IP
	REALTIME_CONNECTION: {
		maxRequests: 5,
		windowMs: 60 * 1000,
	},
} as const;

class GameRateLimiter {
	private static instance: GameRateLimiter;

	static getInstance(): GameRateLimiter {
		if (!GameRateLimiter.instance) {
			GameRateLimiter.instance = new GameRateLimiter();
		}
		return GameRateLimiter.instance;
	}

	// Check rate limit for a specific operation
	checkRateLimit(
		key: string,
		config: RateLimitConfig,
		identifier?: string
	): RateLimitResult {
		const fullKey = identifier ? `${key}:${identifier}` : key;
		const allowed = rateLimiter.isAllowed(
			fullKey,
			config.maxRequests,
			config.windowMs
		);
		const remaining = rateLimiter.getRemainingRequests(
			fullKey,
			config.maxRequests,
			config.windowMs
		);

		const resetTime = Date.now() + config.windowMs;
		const retryAfter = allowed ? undefined : Math.ceil(config.windowMs / 1000);

		return {
			allowed,
			remaining,
			resetTime,
			retryAfter,
		};
	}

	// Game-specific rate limiting
	checkGameCreation(ipAddress: string): RateLimitResult {
		return this.checkRateLimit(
			"game_creation",
			RATE_LIMITS.GAME_CREATION,
			ipAddress
		);
	}

	checkGameJoining(ipAddress: string): RateLimitResult {
		return this.checkRateLimit(
			"game_joining",
			RATE_LIMITS.GAME_JOINING,
			ipAddress
		);
	}

	checkCardGeneration(gameId: string): RateLimitResult {
		return this.checkRateLimit(
			"card_generation",
			RATE_LIMITS.CARD_GENERATION,
			gameId
		);
	}

	checkCardSubmission(
		playerId: string,
		gameId: string,
		roundNumber: number
	): RateLimitResult {
		const key = `card_submission:${gameId}:${roundNumber}`;
		return this.checkRateLimit(key, RATE_LIMITS.CARD_SUBMISSION, playerId);
	}

	checkVoting(
		playerId: string,
		gameId: string,
		roundNumber: number
	): RateLimitResult {
		const key = `voting:${gameId}:${roundNumber}`;
		return this.checkRateLimit(key, RATE_LIMITS.VOTING, playerId);
	}

	checkRealtimeConnection(ipAddress: string): RateLimitResult {
		return this.checkRateLimit(
			"realtime_connection",
			RATE_LIMITS.REALTIME_CONNECTION,
			ipAddress
		);
	}

	checkGeneralAPI(ipAddress: string): RateLimitResult {
		return this.checkRateLimit(
			"api_general",
			RATE_LIMITS.API_GENERAL,
			ipAddress
		);
	}
}

export const gameRateLimiter = GameRateLimiter.getInstance();

// Abuse detection patterns
export interface AbusePattern {
	name: string;
	description: string;
	check: (events: AbuseEvent[]) => boolean;
	severity: "low" | "medium" | "high";
	action: "warn" | "throttle" | "block";
}

export interface AbuseEvent {
	type: string;
	timestamp: number;
	identifier: string;
	metadata?: Record<string, any>;
}

class AbuseDetector {
	private events: AbuseEvent[] = [];
	private blockedIdentifiers = new Set<string>();
	private throttledIdentifiers = new Map<string, number>();

	private patterns: AbusePattern[] = [
		{
			name: "rapid_game_creation",
			description: "Creating games too rapidly",
			check: (events) => {
				const gameCreations = events.filter((e) => e.type === "game_creation");
				const recentCreations = gameCreations.filter(
					(e) => Date.now() - e.timestamp < 60000 // Last minute
				);
				return recentCreations.length > 10;
			},
			severity: "high",
			action: "block",
		},
		{
			name: "excessive_api_calls",
			description: "Making too many API calls",
			check: (events) => {
				const apiCalls = events.filter((e) => e.type === "api_call");
				const recentCalls = apiCalls.filter(
					(e) => Date.now() - e.timestamp < 60000 // Last minute
				);
				return recentCalls.length > 200;
			},
			severity: "medium",
			action: "throttle",
		},
		{
			name: "connection_spam",
			description: "Spamming connection attempts",
			check: (events) => {
				const connections = events.filter(
					(e) => e.type === "connection_attempt"
				);
				const recentConnections = connections.filter(
					(e) => Date.now() - e.timestamp < 60000 // Last minute
				);
				return recentConnections.length > 20;
			},
			severity: "high",
			action: "block",
		},
		{
			name: "failed_auth_attempts",
			description: "Multiple failed authentication attempts",
			check: (events) => {
				const failedAuth = events.filter(
					(e) => e.type === "auth_failure" && Date.now() - e.timestamp < 300000 // Last 5 minutes
				);
				return failedAuth.length > 5;
			},
			severity: "high",
			action: "block",
		},
	];

	recordEvent(event: AbuseEvent): void {
		this.events.push(event);

		// Keep only events from the last hour
		const oneHourAgo = Date.now() - 60 * 60 * 1000;
		this.events = this.events.filter((e) => e.timestamp > oneHourAgo);

		// Check for abuse patterns
		this.checkForAbuse(event.identifier);
	}

	private checkForAbuse(identifier: string): void {
		const identifierEvents = this.events.filter(
			(e) => e.identifier === identifier
		);

		for (const pattern of this.patterns) {
			if (pattern.check(identifierEvents)) {
				this.handleAbuseDetection(identifier, pattern);
			}
		}
	}

	private handleAbuseDetection(
		identifier: string,
		pattern: AbusePattern
	): void {
		console.warn(`Abuse detected: ${pattern.name} for ${identifier}`);

		switch (pattern.action) {
			case "block":
				this.blockedIdentifiers.add(identifier);
				// Block for 1 hour
				setTimeout(() => {
					this.blockedIdentifiers.delete(identifier);
				}, 60 * 60 * 1000);
				break;

			case "throttle":
				const throttleUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
				this.throttledIdentifiers.set(identifier, throttleUntil);
				break;

			case "warn":
				// Just log the warning
				console.warn(`Warning issued to ${identifier} for ${pattern.name}`);
				break;
		}
	}

	isBlocked(identifier: string): boolean {
		return this.blockedIdentifiers.has(identifier);
	}

	isThrottled(identifier: string): boolean {
		const throttleUntil = this.throttledIdentifiers.get(identifier);
		if (!throttleUntil) return false;

		if (Date.now() > throttleUntil) {
			this.throttledIdentifiers.delete(identifier);
			return false;
		}

		return true;
	}

	getThrottleInfo(identifier: string): {
		throttled: boolean;
		retryAfter?: number;
	} {
		const throttleUntil = this.throttledIdentifiers.get(identifier);
		if (!throttleUntil) return { throttled: false };

		const now = Date.now();
		if (now > throttleUntil) {
			this.throttledIdentifiers.delete(identifier);
			return { throttled: false };
		}

		return {
			throttled: true,
			retryAfter: Math.ceil((throttleUntil - now) / 1000),
		};
	}

	cleanup(): void {
		const now = Date.now();

		// Clean up expired throttles
		for (const [
			identifier,
			throttleUntil,
		] of this.throttledIdentifiers.entries()) {
			if (now > throttleUntil) {
				this.throttledIdentifiers.delete(identifier);
			}
		}

		// Clean up old events
		const oneHourAgo = now - 60 * 60 * 1000;
		this.events = this.events.filter((e) => e.timestamp > oneHourAgo);
	}
}

export const abuseDetector = new AbuseDetector();

// Middleware helper for Next.js API routes
export function withRateLimit(
	handler: (req: any, res: any) => Promise<any>,
	config: RateLimitConfig,
	getIdentifier: (req: any) => string = (req) => req.ip || "unknown"
) {
	return async (req: any, res: any) => {
		const identifier = getIdentifier(req);

		// Check if blocked
		if (abuseDetector.isBlocked(identifier)) {
			return res.status(429).json({
				error: "Too many requests",
				message:
					"Your IP has been temporarily blocked due to suspicious activity",
				retryAfter: 3600, // 1 hour
			});
		}

		// Check if throttled
		const throttleInfo = abuseDetector.getThrottleInfo(identifier);
		if (throttleInfo.throttled) {
			return res.status(429).json({
				error: "Too many requests",
				message: "You are being rate limited",
				retryAfter: throttleInfo.retryAfter,
			});
		}

		// Check rate limit
		const rateLimitResult = gameRateLimiter.checkRateLimit(
			req.url || "unknown",
			config,
			identifier
		);

		if (!rateLimitResult.allowed) {
			// Record abuse event
			abuseDetector.recordEvent({
				type: "rate_limit_exceeded",
				timestamp: Date.now(),
				identifier,
				metadata: { url: req.url, method: req.method },
			});

			return res.status(429).json({
				error: "Too many requests",
				message: "Rate limit exceeded",
				retryAfter: rateLimitResult.retryAfter,
				remaining: rateLimitResult.remaining,
			});
		}

		// Record API call event
		abuseDetector.recordEvent({
			type: "api_call",
			timestamp: Date.now(),
			identifier,
			metadata: { url: req.url, method: req.method },
		});

		// Add rate limit headers
		res.setHeader("X-RateLimit-Limit", config.maxRequests);
		res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
		res.setHeader("X-RateLimit-Reset", rateLimitResult.resetTime);

		return handler(req, res);
	};
}

// Cleanup interval
if (typeof window === "undefined") {
	setInterval(() => {
		rateLimiter.cleanup();
		abuseDetector.cleanup();
	}, 5 * 60 * 1000); // Every 5 minutes
}
