"use client";

import React from "react";
import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionStatusProps {
	className?: string;
	showText?: boolean;
	showRecovery?: boolean;
}

export function ConnectionStatus({
	className = "",
	showText = true,
	showRecovery = false,
}: ConnectionStatusProps) {
	const { isConnected, error, recoverFromError, isRecovering } = useGame();

	if (isConnected && !error) {
		return showText ? (
			<div className={`flex items-center text-green-600 ${className}`}>
				<div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
				<span className="text-sm font-medium">Connected</span>
			</div>
		) : (
			<div
				className={`w-2 h-2 bg-green-500 rounded-full animate-pulse ${className}`}
			/>
		);
	}

	if (error?.type === "connection") {
		return (
			<div className={`flex items-center text-red-600 ${className}`}>
				<div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
				{showText && (
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">Connection Lost</span>
						{showRecovery && !isRecovering && (
							<button
								onClick={recoverFromError}
								className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
							>
								Retry
							</button>
						)}
						{isRecovering && (
							<span className="text-xs text-red-500">Reconnecting...</span>
						)}
					</div>
				)}
			</div>
		);
	}

	return showText ? (
		<div className={`flex items-center text-yellow-600 ${className}`}>
			<div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
			<span className="text-sm font-medium">Connecting...</span>
		</div>
	) : (
		<div
			className={`w-2 h-2 bg-yellow-500 rounded-full animate-pulse ${className}`}
		/>
	);
}

// Enhanced connection status with recovery options
export function EnhancedConnectionStatus() {
	const {
		isConnected,
		error,
		loading,
		gameState,
		recoverFromError,
		isRecovering,
	} = useGame();

	const handleRecovery = async () => {
		try {
			await recoverFromError();
		} catch (err) {
			console.error("Recovery failed:", err);
		}
	};

	return (
		<AnimatePresence>
			{(error || !isConnected) && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
				>
					<div className="flex items-start justify-between">
						<div className="flex items-center">
							<div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse" />
							<div>
								<h4 className="text-sm font-medium text-red-800">
									Connection Issue
								</h4>
								<p className="text-sm text-red-600 mt-1">
									{error?.message || "Connection lost"}
								</p>
							</div>
						</div>

						{!isRecovering && (
							<button
								onClick={handleRecovery}
								className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
							>
								Reconnect
							</button>
						)}

						{isRecovering && (
							<div className="flex items-center text-sm text-red-600">
								<div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
								Reconnecting...
							</div>
						)}
					</div>

					{error?.type === "game_state" && (
						<div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
							<strong>Game State Issue:</strong> The game may have progressed
							while you were disconnected. Reconnecting will sync you with the
							current state.
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// Detailed connection status for debugging/admin
export function DetailedConnectionStatus() {
	const { isConnected, error, loading, gameState, isRecovering } = useGame();

	return (
		<div className="bg-gray-100 p-3 rounded-lg text-xs font-mono">
			<div className="grid grid-cols-2 gap-2">
				<div>
					<span className="font-semibold">Connected:</span>{" "}
					<span className={isConnected ? "text-green-600" : "text-red-600"}>
						{isConnected ? "Yes" : "No"}
					</span>
				</div>
				<div>
					<span className="font-semibold">Loading:</span>{" "}
					<span className={loading ? "text-yellow-600" : "text-gray-600"}>
						{loading ? "Yes" : "No"}
					</span>
				</div>
				<div>
					<span className="font-semibold">Recovering:</span>{" "}
					<span className={isRecovering ? "text-blue-600" : "text-gray-600"}>
						{isRecovering ? "Yes" : "No"}
					</span>
				</div>
				<div>
					<span className="font-semibold">Error:</span>{" "}
					<span className={error ? "text-red-600" : "text-green-600"}>
						{error ? error.type : "None"}
					</span>
				</div>
				<div>
					<span className="font-semibold">Phase:</span>{" "}
					<span className="text-blue-600">{gameState?.phase || "Unknown"}</span>
				</div>
			</div>
			{error && (
				<div className="mt-2 p-2 bg-red-50 rounded text-red-700">
					<div className="font-semibold">Error Details:</div>
					<div>{error.message}</div>
				</div>
			)}
		</div>
	);
}
