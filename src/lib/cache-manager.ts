/**
 * Advanced caching strategies for game components and data
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
	accessCount: number;
	lastAccessed: number;
}

interface CacheStats {
	hits: number;
	misses: number;
	evictions: number;
	totalSize: number;
	hitRate: number;
}

class AdvancedCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private maxSize: number;
	private defaultTTL: number;
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		evictions: 0,
		totalSize: 0,
		hitRate: 0,
	};

	constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
		this.maxSize = maxSize;
		this.defaultTTL = defaultTTL;
	}

	set(key: string, data: T, ttl?: number): void {
		const now = Date.now();
		const entry: CacheEntry<T> = {
			data,
			timestamp: now,
			ttl: ttl || this.defaultTTL,
			accessCount: 0,
			lastAccessed: now,
		};

		// If cache is full, evict least recently used item
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			this.evictLRU();
		}

		this.cache.set(key, entry);
		this.updateStats();
	}

	get(key: string): T | null {
		const entry = this.cache.get(key);
		const now = Date.now();

		if (!entry) {
			this.stats.misses++;
			this.updateStats();
			return null;
		}

		// Check if entry has expired
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			this.stats.misses++;
			this.updateStats();
			return null;
		}

		// Update access statistics
		entry.accessCount++;
		entry.lastAccessed = now;
		this.stats.hits++;
		this.updateStats();

		return entry.data;
	}

	has(key: string): boolean {
		const entry = this.cache.get(key);
		if (!entry) return false;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: string): boolean {
		const deleted = this.cache.delete(key);
		this.updateStats();
		return deleted;
	}

	clear(): void {
		this.cache.clear();
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalSize: 0,
			hitRate: 0,
		};
	}

	private evictLRU(): void {
		let oldestKey: string | null = null;
		let oldestTime = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (entry.lastAccessed < oldestTime) {
				oldestTime = entry.lastAccessed;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
			this.stats.evictions++;
		}
	}

	private updateStats(): void {
		this.stats.totalSize = this.cache.size;
		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
	}

	getStats(): CacheStats {
		return { ...this.stats };
	}

	// Cleanup expired entries
	cleanup(): number {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
				cleaned++;
			}
		}

		this.updateStats();
		return cleaned;
	}
}

// Game-specific cache instances
export const gameStateCache = new AdvancedCache<any>(50, 30 * 1000); // 30 seconds
export const playerCache = new AdvancedCache<any>(100, 60 * 1000); // 1 minute
export const cardCache = new AdvancedCache<any>(200, 5 * 60 * 1000); // 5 minutes
export const aiResponseCache = new AdvancedCache<any>(100, 10 * 60 * 1000); // 10 minutes

// Component cache for lazy-loaded components
class ComponentCache {
	private componentPromises = new Map<string, Promise<any>>();
	private loadedComponents = new Map<string, any>();

	async loadComponent(name: string, loader: () => Promise<any>): Promise<any> {
		// Return cached component if already loaded
		if (this.loadedComponents.has(name)) {
			return this.loadedComponents.get(name);
		}

		// Return existing promise if already loading
		if (this.componentPromises.has(name)) {
			return this.componentPromises.get(name);
		}

		// Start loading component
		const promise = loader()
			.then((component) => {
				this.loadedComponents.set(name, component);
				this.componentPromises.delete(name);
				return component;
			})
			.catch((error) => {
				this.componentPromises.delete(name);
				throw error;
			});

		this.componentPromises.set(name, promise);
		return promise;
	}

	preloadComponent(name: string, loader: () => Promise<any>): void {
		if (!this.loadedComponents.has(name) && !this.componentPromises.has(name)) {
			this.loadComponent(name, loader).catch(console.error);
		}
	}

	clearCache(): void {
		this.componentPromises.clear();
		this.loadedComponents.clear();
	}
}

export const componentCache = new ComponentCache();

// Service Worker cache management
export class ServiceWorkerCache {
	private static instance: ServiceWorkerCache;
	private swRegistration: ServiceWorkerRegistration | null = null;

	static getInstance(): ServiceWorkerCache {
		if (!ServiceWorkerCache.instance) {
			ServiceWorkerCache.instance = new ServiceWorkerCache();
		}
		return ServiceWorkerCache.instance;
	}

	async register(): Promise<void> {
		if ("serviceWorker" in navigator) {
			try {
				this.swRegistration = await navigator.serviceWorker.register("/sw.js");
				console.log("Service Worker registered successfully");
			} catch (error) {
				console.error("Service Worker registration failed:", error);
			}
		}
	}

	async cacheGameAssets(gameId: string, assets: string[]): Promise<void> {
		if (!this.swRegistration) return;

		try {
			const cache = await caches.open(`game-${gameId}`);
			await cache.addAll(assets);
		} catch (error) {
			console.error("Failed to cache game assets:", error);
		}
	}

	async clearGameCache(gameId: string): Promise<void> {
		try {
			await caches.delete(`game-${gameId}`);
		} catch (error) {
			console.error("Failed to clear game cache:", error);
		}
	}
}

// Memory management utilities
export class MemoryManager {
	private static memoryWarningThreshold = 50 * 1024 * 1024; // 50MB
	private static cleanupCallbacks: (() => void)[] = [];

	static addCleanupCallback(callback: () => void): void {
		this.cleanupCallbacks.push(callback);
	}

	static removeCleanupCallback(callback: () => void): void {
		const index = this.cleanupCallbacks.indexOf(callback);
		if (index > -1) {
			this.cleanupCallbacks.splice(index, 1);
		}
	}

	static async checkMemoryUsage(): Promise<void> {
		if ("memory" in performance) {
			const memInfo = (performance as any).memory;
			const usedMemory = memInfo.usedJSHeapSize;

			if (usedMemory > this.memoryWarningThreshold) {
				console.warn(
					`High memory usage detected: ${Math.round(
						usedMemory / 1024 / 1024
					)}MB`
				);
				await this.performCleanup();
			}
		}
	}

	static async performCleanup(): Promise<void> {
		// Run all cleanup callbacks
		for (const callback of this.cleanupCallbacks) {
			try {
				callback();
			} catch (error) {
				console.error("Cleanup callback failed:", error);
			}
		}

		// Clean up caches
		gameStateCache.cleanup();
		playerCache.cleanup();
		cardCache.cleanup();
		aiResponseCache.cleanup();

		// Force garbage collection if available
		if ("gc" in window) {
			(window as any).gc();
		}
	}

	static startMemoryMonitoring(): void {
		// Check memory usage every 30 seconds
		setInterval(() => {
			this.checkMemoryUsage();
		}, 30000);
	}
}

// Cache warming strategies
export class CacheWarmer {
	static async warmGameCaches(gameId: string, playerId: string): Promise<void> {
		try {
			// Pre-warm common game data
			const promises = [
				// Preload game state
				fetch(`/api/games/${gameId}`)
					.then((r) => r.json())
					.then((data) => {
						gameStateCache.set(`game-${gameId}`, data);
					}),

				// Preload player data
				fetch(`/api/games/${gameId}/players`)
					.then((r) => r.json())
					.then((data) => {
						playerCache.set(`players-${gameId}`, data);
					}),
			];

			await Promise.allSettled(promises);
		} catch (error) {
			console.error("Cache warming failed:", error);
		}
	}

	static async preloadComponents(): Promise<void> {
		// Preload critical game components
		const criticalComponents = [
			"GameLobby",
			"SubmissionInterface",
			"VotingInterface",
		];

		for (const componentName of criticalComponents) {
			componentCache.preloadComponent(componentName, async () => {
				switch (componentName) {
					case "GameLobby":
						return import("../components/GameLobby");
					case "SubmissionInterface":
						return import("../components/SubmissionInterface");
					case "VotingInterface":
						return import("../components/VotingInterface");
					default:
						throw new Error(`Unknown component: ${componentName}`);
				}
			});
		}
	}
}

// Initialize memory monitoring
if (typeof window !== "undefined") {
	MemoryManager.startMemoryMonitoring();
}
