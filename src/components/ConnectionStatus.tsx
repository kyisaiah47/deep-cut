"use client";

import React from "react";
import { useGame } from "@/contexts/GameContext";

interface ConnectionStatusProps {
	className?: string;
	showText?: boolean;
}

export function ConnectionStatus({
	className = "",
	showText = true,
}: ConnectionStatusProps) {
	const { isConnected, error } = useGame();

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
		return showText ? (
			<div className={`flex items-center text-red-600 ${className}`}>
				<div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
				<span className="text-sm font-medium">Connection Lost</span>
			</div>
		) : (
			<div className={`w-2 h-2 bg-red-500 rounded-full ${className}`} />
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

// Detailed connection status for debugging/admin
export function DetailedConnectionStatus() {
	const { isConnected, error, loading, gameState } = useGame();

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
