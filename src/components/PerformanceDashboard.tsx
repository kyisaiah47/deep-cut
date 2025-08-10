"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePerformanceMonitor } from "@/lib/performance-monitor";
import {
	gameStateCache,
	playerCache,
	cardCache,
	aiResponseCache,
} from "@/lib/cache-manager";

interface PerformanceDashboardProps {
	isVisible: boolean;
	onClose: () => void;
}

export function PerformanceDashboard({
	isVisible,
	onClose,
}: PerformanceDashboardProps) {
	const { getPerformanceSummary, exportMetrics } = usePerformanceMonitor();
	const [summary, setSummary] = useState<any>(null);
	const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
		null
	);

	useEffect(() => {
		if (isVisible) {
			// Initial load
			setSummary(getPerformanceSummary());

			// Set up auto-refresh
			const interval = setInterval(() => {
				setSummary(getPerformanceSummary());
			}, 2000);
			setRefreshInterval(interval);

			return () => {
				if (interval) clearInterval(interval);
			};
		} else {
			if (refreshInterval) {
				clearInterval(refreshInterval);
				setRefreshInterval(null);
			}
		}
	}, [isVisible, getPerformanceSummary]);

	const handleExportMetrics = () => {
		const metrics = exportMetrics();
		const blob = new Blob([metrics], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `performance-metrics-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	if (!isVisible || !summary) return null;

	const getCacheStats = () => {
		return {
			gameState: gameStateCache.getStats(),
			player: playerCache.getStats(),
			card: cardCache.getStats(),
			aiResponse: aiResponseCache.getStats(),
		};
	};

	const cacheStats = getCacheStats();

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-gray-900">
							Performance Dashboard
						</h2>
						<div className="flex space-x-2">
							<button
								onClick={handleExportMetrics}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Export Metrics
							</button>
							<button
								onClick={onClose}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
							>
								Close
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Real-time Performance */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Real-time Performance
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Connection Latency:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.realtime.connectionLatency)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Subscription Latency:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.realtime.subscriptionLatency)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Message Processing:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.realtime.messageProcessingTime)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Reconnections:</span>
									<span className="text-sm font-medium">
										{summary.realtime.reconnectionCount}
									</span>
								</div>
							</div>
						</div>

						{/* AI Generation Performance */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								AI Generation
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Generation Time:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.ai.generationTime)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Cache Hit:</span>
									<span
										className={`text-sm font-medium ${
											summary.ai.cacheHit ? "text-green-600" : "text-red-600"
										}`}
									>
										{summary.ai.cacheHit ? "Yes" : "No"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Fallback Used:</span>
									<span
										className={`text-sm font-medium ${
											summary.ai.fallbackUsed
												? "text-yellow-600"
												: "text-green-600"
										}`}
									>
										{summary.ai.fallbackUsed ? "Yes" : "No"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Error Count:</span>
									<span className="text-sm font-medium">
										{summary.ai.errorCount}
									</span>
								</div>
							</div>
						</div>

						{/* Game Performance */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Game Operations
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Phase Transition:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.game.phaseTransitionTime)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Player Sync:</span>
									<span className="text-sm font-medium">
										{Math.round(summary.game.playerSyncTime)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Card Distribution:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.game.cardDistributionTime)}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Vote Processing:
									</span>
									<span className="text-sm font-medium">
										{Math.round(summary.game.votingProcessingTime)}ms
									</span>
								</div>
							</div>
						</div>

						{/* Cache Performance */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Game State Cache
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hit Rate:</span>
									<span className="text-sm font-medium">
										{Math.round(cacheStats.gameState.hitRate * 100)}%
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Cache Size:</span>
									<span className="text-sm font-medium">
										{cacheStats.gameState.totalSize}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hits:</span>
									<span className="text-sm font-medium text-green-600">
										{cacheStats.gameState.hits}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Misses:</span>
									<span className="text-sm font-medium text-red-600">
										{cacheStats.gameState.misses}
									</span>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Player Cache
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hit Rate:</span>
									<span className="text-sm font-medium">
										{Math.round(cacheStats.player.hitRate * 100)}%
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Cache Size:</span>
									<span className="text-sm font-medium">
										{cacheStats.player.totalSize}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hits:</span>
									<span className="text-sm font-medium text-green-600">
										{cacheStats.player.hits}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Misses:</span>
									<span className="text-sm font-medium text-red-600">
										{cacheStats.player.misses}
									</span>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Card Cache
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hit Rate:</span>
									<span className="text-sm font-medium">
										{Math.round(cacheStats.card.hitRate * 100)}%
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Cache Size:</span>
									<span className="text-sm font-medium">
										{cacheStats.card.totalSize}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Hits:</span>
									<span className="text-sm font-medium text-green-600">
										{cacheStats.card.hits}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Misses:</span>
									<span className="text-sm font-medium text-red-600">
										{cacheStats.card.misses}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Recent Metrics */}
					<div className="mt-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							Recent Performance Events
						</h3>
						<div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
							{summary.recentMetrics.length === 0 ? (
								<p className="text-sm text-gray-500">
									No recent metrics available
								</p>
							) : (
								<div className="space-y-2">
									{summary.recentMetrics
										.slice(-10)
										.reverse()
										.map((metric: any, index: number) => (
											<div
												key={index}
												className="flex justify-between items-center text-sm"
											>
												<span className="text-gray-600">{metric.name}:</span>
												<div className="flex items-center space-x-2">
													<span className="font-medium">
														{Math.round(metric.value)}ms
													</span>
													<span className="text-xs text-gray-400">
														{new Date(metric.timestamp).toLocaleTimeString()}
													</span>
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					</div>

					{/* Memory Usage (if available) */}
					{typeof window !== "undefined" && "memory" in performance && (
						<div className="mt-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								Memory Usage
							</h3>
							<div className="bg-gray-50 rounded-lg p-4">
								<div className="grid grid-cols-3 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-blue-600">
											{Math.round(
												(performance as any).memory.usedJSHeapSize / 1024 / 1024
											)}
											MB
										</div>
										<div className="text-sm text-gray-600">Used</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-green-600">
											{Math.round(
												(performance as any).memory.totalJSHeapSize /
													1024 /
													1024
											)}
											MB
										</div>
										<div className="text-sm text-gray-600">Total</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-purple-600">
											{Math.round(
												(performance as any).memory.jsHeapSizeLimit /
													1024 /
													1024
											)}
											MB
										</div>
										<div className="text-sm text-gray-600">Limit</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</motion.div>
		</motion.div>
	);
}

// Performance monitoring toggle component
export function PerformanceToggle() {
	const [showDashboard, setShowDashboard] = useState(false);

	// Only show in development or when explicitly enabled
	const shouldShow =
		process.env.NODE_ENV === "development" ||
		(typeof window !== "undefined" &&
			window.localStorage.getItem("show-performance-dashboard") === "true");

	if (!shouldShow) return null;

	return (
		<>
			<button
				onClick={() => setShowDashboard(true)}
				className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
				title="Performance Dashboard"
			>
				📊
			</button>
			<PerformanceDashboard
				isVisible={showDashboard}
				onClose={() => setShowDashboard(false)}
			/>
		</>
	);
}
