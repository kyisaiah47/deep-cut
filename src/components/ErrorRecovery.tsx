"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameError, errorLogger } from "@/lib/error-handling";
import { useGame } from "@/contexts/GameContext";

interface ErrorRecoveryProps {
	error: GameError;
	onRetry?: () => void;
	onDismiss?: () => void;
	gameId?: string;
	playerId?: string;
}

export function ErrorRecovery({
	error,
	onRetry,
	onDismiss,
	gameId,
	playerId,
}: ErrorRecoveryProps) {
	const [isRetrying, setIsRetrying] = useState(false);
	const { recoverFromError, isRecovering } = useGame();

	const handleRetry = async () => {
		setIsRetrying(true);
		try {
			if (onRetry) {
				await onRetry();
			} else {
				await recoverFromError();
			}
		} catch (err) {
			console.error("Retry failed:", err);
		} finally {
			setIsRetrying(false);
		}
	};

	const handleReportError = () => {
		// Get recent error logs for context
		const recentErrors = errorLogger.getRecentErrors(10);
		const errorReport = {
			currentError: {
				message: error.message,
				type: error.type,
				timestamp: error.timestamp,
				context: error.context,
			},
			recentErrors: recentErrors.map((log) => ({
				message: log.error.message,
				type: log.error.type,
				timestamp: log.timestamp,
			})),
			gameContext: { gameId, playerId },
			userAgent: navigator.userAgent,
			url: window.location.href,
		};

		// Copy to clipboard for easy reporting
		navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));

		// In a real app, you might send this to a support system
		console.log("Error report copied to clipboard:", errorReport);
		alert(
			"Error details copied to clipboard. Please share with support if the issue persists."
		);
	};

	const getErrorIcon = () => {
		switch (error.type) {
			case "connection":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
						/>
					</svg>
				);
			case "game_state":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				);
			case "ai_generation":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
				);
			default:
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				);
		}
	};

	const getErrorSuggestions = () => {
		switch (error.type) {
			case "connection":
				return [
					"Check your internet connection",
					"Try refreshing the page",
					"Disable VPN if you're using one",
					"Check if the game server is accessible",
				];
			case "game_state":
				return [
					"The game may have progressed while you were away",
					"Reconnecting will sync you with the current state",
					"Other players may have continued without you",
					"Your progress should be preserved",
				];
			case "ai_generation":
				return [
					"AI service may be temporarily unavailable",
					"The game will use backup cards instead",
					"This won't affect your gameplay experience",
					"Try again in a few moments",
				];
			default:
				return [
					"An unexpected error occurred",
					"Try refreshing the page",
					"Contact support if the issue persists",
				];
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto"
		>
			<div className="flex items-start space-x-4">
				<div
					className={`flex-shrink-0 p-2 rounded-full ${
						error.type === "connection"
							? "bg-red-100 text-red-600"
							: error.type === "game_state"
							? "bg-yellow-100 text-yellow-600"
							: error.type === "ai_generation"
							? "bg-blue-100 text-blue-600"
							: "bg-gray-100 text-gray-600"
					}`}
				>
					{getErrorIcon()}
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{error.type === "connection" && "Connection Problem"}
						{error.type === "game_state" && "Game Sync Issue"}
						{error.type === "ai_generation" && "AI Service Issue"}
						{error.type === "unknown" && "Unexpected Error"}
					</h3>

					<p className="text-sm text-gray-600 mb-4">{error.message}</p>

					<div className="mb-4">
						<h4 className="text-sm font-medium text-gray-900 mb-2">
							What you can do:
						</h4>
						<ul className="text-sm text-gray-600 space-y-1">
							{getErrorSuggestions().map((suggestion, index) => (
								<li
									key={index}
									className="flex items-start"
								>
									<span className="text-gray-400 mr-2">•</span>
									{suggestion}
								</li>
							))}
						</ul>
					</div>

					<div className="flex flex-col sm:flex-row gap-2">
						{error.retryable && (
							<button
								onClick={handleRetry}
								disabled={isRetrying || isRecovering}
								className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isRetrying || isRecovering ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
										Retrying...
									</>
								) : (
									"Try Again"
								)}
							</button>
						)}

						<button
							onClick={() => window.location.reload()}
							className="flex-1 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Refresh Page
						</button>
					</div>

					<div className="mt-4 pt-4 border-t border-gray-200">
						<div className="flex justify-between items-center">
							<button
								onClick={handleReportError}
								className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
							>
								Copy error details
							</button>

							{onDismiss && (
								<button
									onClick={onDismiss}
									className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
								>
									Dismiss
								</button>
							)}
						</div>

						<p className="text-xs text-gray-400 mt-2">
							Error ID: {error.timestamp}
						</p>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// Floating error recovery notification
export function ErrorRecoveryNotification() {
	const { error } = useGame();
	const [dismissed, setDismissed] = useState(false);

	if (!error || dismissed) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 50 }}
				className="fixed bottom-4 right-4 z-50 max-w-sm"
			>
				<ErrorRecovery
					error={error}
					onDismiss={() => setDismissed(true)}
				/>
			</motion.div>
		</AnimatePresence>
	);
}
