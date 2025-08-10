"use client";

import {
	ServiceWorkerCache,
	CacheWarmer,
	MemoryManager,
} from "./cache-manager";
import { measureWebVitals } from "./performance-monitor";

// Initialize performance monitoring and caching
export function initializePerformanceOptimizations() {
	if (typeof window === "undefined") return;

	// Register service worker
	ServiceWorkerCache.getInstance().register();

	// Start measuring web vitals
	measureWebVitals();

	// Preload critical components
	CacheWarmer.preloadComponents();

	// Start memory monitoring
	MemoryManager.startMemoryMonitoring();

	// Add cleanup callback for memory management
	MemoryManager.addCleanupCallback(() => {
		console.log("Performing memory cleanup...");
	});

	// Warm up caches when user interacts with the page
	const warmCachesOnInteraction = () => {
		// Get game ID from URL if available
		const urlParams = new URLSearchParams(window.location.search);
		const gameId = urlParams.get("gameId");
		const playerId = urlParams.get("playerId");

		if (gameId && playerId) {
			CacheWarmer.warmGameCaches(gameId, playerId);
		}

		// Remove event listeners after first interaction
		document.removeEventListener("click", warmCachesOnInteraction);
		document.removeEventListener("keydown", warmCachesOnInteraction);
		document.removeEventListener("touchstart", warmCachesOnInteraction);
	};

	// Add event listeners for cache warming
	document.addEventListener("click", warmCachesOnInteraction, { once: true });
	document.addEventListener("keydown", warmCachesOnInteraction, { once: true });
	document.addEventListener("touchstart", warmCachesOnInteraction, {
		once: true,
	});
}

// Initialize on client side
if (typeof window !== "undefined") {
	// Wait for DOM to be ready
	if (document.readyState === "loading") {
		document.addEventListener(
			"DOMContentLoaded",
			initializePerformanceOptimizations
		);
	} else {
		initializePerformanceOptimizations();
	}
}
