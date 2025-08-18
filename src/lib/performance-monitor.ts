/**
 * Performance monitoring utilities for real-time operations and AI generation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PerformanceMetric {
	name: string;
	value: number;
	timestamp: number;
	metadata?: Record<string, any>;
}

export interface RealtimeMetrics {
	connectionLatency: number;
	subscriptionLatency: number;
	messageProcessingTime: number;
	reconnectionCount: number;
	lastReconnectionTime?: number;
}

export interface AIGenerationMetrics {
	generationTime: number;
	tokenCount?: number;
	cacheHit: boolean;
	fallbackUsed: boolean;
	errorCount: number;
}

export interface GamePerformanceMetrics {
	phaseTransitionTime: number;
	playerSyncTime: number;
	cardDistributionTime: number;
	votingProcessingTime: number;
	scoreCalculationTime: number;
}

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private realtimeMetrics: RealtimeMetrics = {
		connectionLatency: 0,
		subscriptionLatency: 0,
		messageProcessingTime: 0,
		reconnectionCount: 0,
	};
	private aiMetrics: AIGenerationMetrics = {
		generationTime: 0,
		cacheHit: false,
		fallbackUsed: false,
		errorCount: 0,
	};
	private gameMetrics: GamePerformanceMetrics = {
		phaseTransitionTime: 0,
		playerSyncTime: 0,
		cardDistributionTime: 0,
		votingProcessingTime: 0,
		scoreCalculationTime: 0,
	};

	// Performance measurement utilities
	startTimer(name: string): () => number {
		const startTime = performance.now();
		return () => {
			const duration = performance.now() - startTime;
			this.recordMetric(name, duration);
			return duration;
		};
	}

	recordMetric(name: string, value: number, metadata?: Record<string, any>) {
		const metric: PerformanceMetric = {
			name,
			value,
			timestamp: Date.now(),
			metadata,
		};

		this.metrics.push(metric);

		// Keep only last 1000 metrics to prevent memory leaks
		if (this.metrics.length > 1000) {
			this.metrics = this.metrics.slice(-1000);
		}

		// Log performance issues
		this.checkPerformanceThresholds(metric);
	}

	// Real-time operation monitoring
	measureRealtimeLatency(
		operationType: "connection" | "subscription" | "message"
	) {
		const timer = this.startTimer(`realtime_${operationType}`);

		return (additionalData?: Record<string, any>) => {
			const duration = timer();

			switch (operationType) {
				case "connection":
					this.realtimeMetrics.connectionLatency = duration;
					break;
				case "subscription":
					this.realtimeMetrics.subscriptionLatency = duration;
					break;
				case "message":
					this.realtimeMetrics.messageProcessingTime = duration;
					break;
			}

			return duration;
		};
	}

	recordReconnection() {
		this.realtimeMetrics.reconnectionCount++;
		this.realtimeMetrics.lastReconnectionTime = Date.now();
		this.recordMetric("realtime_reconnection", 1, {
			totalReconnections: this.realtimeMetrics.reconnectionCount,
		});
	}

	// AI generation monitoring
	measureAIGeneration(cacheHit: boolean = false) {
		const timer = this.startTimer("ai_generation");

		return (
			success: boolean,
			tokenCount?: number,
			fallbackUsed: boolean = false
		) => {
			const duration = timer();

			this.aiMetrics.generationTime = duration;
			this.aiMetrics.cacheHit = cacheHit;
			this.aiMetrics.fallbackUsed = fallbackUsed;

			if (!success) {
				this.aiMetrics.errorCount++;
			}

			this.recordMetric("ai_generation_complete", duration, {
				success,
				tokenCount,
				cacheHit,
				fallbackUsed,
				errorCount: this.aiMetrics.errorCount,
			});

			return duration;
		};
	}

	// Game operation monitoring
	measureGameOperation(operation: keyof GamePerformanceMetrics) {
		const timer = this.startTimer(`game_${operation}`);

		return (playerCount?: number, additionalData?: Record<string, any>) => {
			const duration = timer();
			this.gameMetrics[operation] = duration;

			this.recordMetric(`game_${operation}_complete`, duration, {
				playerCount,
				...additionalData,
			});

			return duration;
		};
	}

	// Performance threshold checking
	private checkPerformanceThresholds(metric: PerformanceMetric) {
		const thresholds = {
			realtime_connection: 1000, // 1 second
			realtime_subscription: 500, // 500ms
			realtime_message: 100, // 100ms
			ai_generation: 5000, // 5 seconds
			game_phaseTransitionTime: 2000, // 2 seconds
			game_cardDistributionTime: 3000, // 3 seconds
		};

		const threshold = thresholds[metric.name as keyof typeof thresholds];
		if (threshold && metric.value > threshold) {
			console.warn(
				`Performance threshold exceeded for ${metric.name}: ${metric.value}ms (threshold: ${threshold}ms)`,
				metric
			);

			// Record performance warning
			this.recordMetric(`${metric.name}_warning`, metric.value, {
				threshold,
				exceeded: metric.value - threshold,
			});
		}
	}

	// Analytics and reporting
	getMetrics(
		name?: string,
		timeRange?: { start: number; end: number }
	): PerformanceMetric[] {
		let filtered = this.metrics;

		if (name) {
			filtered = filtered.filter((m) => m.name === name);
		}

		if (timeRange) {
			filtered = filtered.filter(
				(m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
			);
		}

		return filtered;
	}

	getAverageMetric(
		name: string,
		timeRange?: { start: number; end: number }
	): number {
		const metrics = this.getMetrics(name, timeRange);
		if (metrics.length === 0) return 0;

		const sum = metrics.reduce((acc, m) => acc + m.value, 0);
		return sum / metrics.length;
	}

	getPerformanceSummary(): {
		realtime: RealtimeMetrics;
		ai: AIGenerationMetrics;
		game: GamePerformanceMetrics;
		recentMetrics: PerformanceMetric[];
	} {
		const now = Date.now();
		const fiveMinutesAgo = now - 5 * 60 * 1000;

		return {
			realtime: { ...this.realtimeMetrics },
			ai: { ...this.aiMetrics },
			game: { ...this.gameMetrics },
			recentMetrics: this.getMetrics(undefined, {
				start: fiveMinutesAgo,
				end: now,
			}),
		};
	}

	// Memory and cleanup
	clearMetrics(olderThan?: number) {
		if (olderThan) {
			this.metrics = this.metrics.filter((m) => m.timestamp > olderThan);
		} else {
			this.metrics = [];
		}
	}

	// Export metrics for external monitoring
	exportMetrics(): string {
		return JSON.stringify(
			{
				timestamp: Date.now(),
				summary: this.getPerformanceSummary(),
				allMetrics: this.metrics,
			},
			null,
			2
		);
	}
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
	return {
		startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
		recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
		measureRealtimeLatency:
			performanceMonitor.measureRealtimeLatency.bind(performanceMonitor),
		measureAIGeneration:
			performanceMonitor.measureAIGeneration.bind(performanceMonitor),
		measureGameOperation:
			performanceMonitor.measureGameOperation.bind(performanceMonitor),
		getPerformanceSummary:
			performanceMonitor.getPerformanceSummary.bind(performanceMonitor),
		exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor),
	};
}

// Web Vitals integration
export function measureWebVitals() {
	if (typeof window !== "undefined" && "performance" in window) {
		// Measure Core Web Vitals
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				// entry is PerformanceEntry, but some web vitals polyfills add .value
				const value =
					(entry as any).value !== undefined
						? (entry as any).value
						: entry.duration || 0;
				performanceMonitor.recordMetric(`web_vital_${entry.name}`, value, {
					entryType: entry.entryType,
					startTime: entry.startTime,
				});
			}
		});

		// Observe different performance entry types
		try {
			observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
		} catch (e) {
			// Fallback for browsers that don't support all entry types
			console.warn("Performance observer not fully supported:", e);
		}
	}
}

// Rate limiting utilities
export class RateLimiter {
	private requests: Map<string, number[]> = new Map();

	isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const windowStart = now - windowMs;

		// Get existing requests for this key
		const requests = this.requests.get(key) || [];

		// Filter out old requests
		const recentRequests = requests.filter((time) => time > windowStart);

		// Check if under limit
		if (recentRequests.length < maxRequests) {
			recentRequests.push(now);
			this.requests.set(key, recentRequests);
			return true;
		}

		// Update the requests array even if rejected
		this.requests.set(key, recentRequests);
		return false;
	}

	getRemainingRequests(
		key: string,
		maxRequests: number,
		windowMs: number
	): number {
		const now = Date.now();
		const windowStart = now - windowMs;
		const requests = this.requests.get(key) || [];
		const recentRequests = requests.filter((time) => time > windowStart);

		return Math.max(0, maxRequests - recentRequests.length);
	}

	cleanup() {
		const now = Date.now();
		const oneHourAgo = now - 60 * 60 * 1000;

		for (const [key, requests] of this.requests.entries()) {
			const recentRequests = requests.filter((time) => time > oneHourAgo);
			if (recentRequests.length === 0) {
				this.requests.delete(key);
			} else {
				this.requests.set(key, recentRequests);
			}
		}
	}
}

export const rateLimiter = new RateLimiter();
