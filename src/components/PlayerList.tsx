"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@/types/game";
import { useGame } from "@/contexts/GameContext";
import { ConnectionStatus } from "./ConnectionStatus";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PlayerListProps {
	players: Player[];
	currentPlayerId: string;
	className?: string;
	showConnectionStatus?: boolean;
	showSubmissionStatus?: boolean;
}

export function PlayerList({
	players,
	currentPlayerId,
	className = "",
	showConnectionStatus = true,
	showSubmissionStatus = false,
}: PlayerListProps) {
	const { gameState } = useGame();
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	// Handle host transfer when needed (currently unused but available for future use)
	// const handleHostTransfer = useCallback(
	// 	async (newHostId: string) => {
	// 		if (!isHost || !gameState) return;

	// 		try {
	// 			// This would typically be handled by a database function
	// 			// For now, we'll broadcast the event
	// 			await broadcastEvent({
	// 				type: "player_left",
	// 				data: { newHostId },
	// 			});
	// 		} catch (error) {
	// 			console.error("Failed to transfer host:", error);
	// 		}
	// 	},
	// 	[isHost, gameState, broadcastEvent]
	// );

	// Sort players: host first, then by join time
	const sortedPlayers = React.useMemo(() => {
		return [...players].sort((a, b) => {
			// Host always first
			if (gameState?.host_id === a.id) return -1;
			if (gameState?.host_id === b.id) return 1;

			// Then by join time
			return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
		});
	}, [players, gameState?.host_id]);

	return (
		<div
			className={`bg-white rounded-lg shadow-md ${
				isMobile ? "p-3" : "p-4"
			} ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3
					className={`font-semibold text-gray-800 ${
						isMobile ? "text-base" : "text-lg"
					}`}
				>
					Players ({players.length})
				</h3>
				{gameState?.max_players && (
					<span className={`text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}>
						Max: {gameState.max_players}
					</span>
				)}
			</div>

			<div className={isMobile ? "space-y-1" : "space-y-2"}>
				<AnimatePresence mode="popLayout">
					{sortedPlayers.map((player) => (
						<PlayerItem
							key={player.id}
							player={player}
							isCurrentPlayer={player.id === currentPlayerId}
							isHost={gameState?.host_id === player.id}
							showConnectionStatus={showConnectionStatus}
							showSubmissionStatus={showSubmissionStatus}
							gamePhase={gameState?.phase}
							isMobile={isMobile}
							prefersReducedMotion={prefersReducedMotion}
						/>
					))}
				</AnimatePresence>
			</div>

			{players.length === 0 && (
				<div className="text-center py-8 text-gray-500">
					<p className={isMobile ? "text-sm" : "text-base"}>
						No players in the game yet.
					</p>
				</div>
			)}
		</div>
	);
}

interface PlayerItemProps {
	player: Player;
	isCurrentPlayer: boolean;
	isHost: boolean;
	showConnectionStatus: boolean;
	showSubmissionStatus: boolean;
	gamePhase?: string;
	isMobile: boolean;
	prefersReducedMotion: boolean;
}

function PlayerItem({
	player,
	isCurrentPlayer,
	isHost,
	showConnectionStatus,
	showSubmissionStatus,
	gamePhase,
	isMobile,
	prefersReducedMotion,
}: PlayerItemProps) {
	// Determine if player has submitted (this would come from game state)
	const hasSubmitted = false; // TODO: Implement submission tracking

	return (
		<motion.div
			layout
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
			transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
			className={`
				flex items-center justify-between rounded-lg border-2 transition-all duration-200
				${isMobile ? "p-2" : "p-3"}
				${isCurrentPlayer ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}
				${!player.is_connected ? "opacity-60" : ""}
			`}
		>
			<div
				className={`flex items-center ${isMobile ? "space-x-2" : "space-x-3"}`}
			>
				{/* Player Avatar */}
				<div
					className={`
						rounded-full flex items-center justify-center text-white font-semibold
						${isMobile ? "w-8 h-8 text-sm" : "w-10 h-10"}
						${isCurrentPlayer ? "bg-blue-500" : "bg-gray-500"}
						${!player.is_connected ? "opacity-50" : ""}
					`}
				>
					{player.name.charAt(0).toUpperCase()}
				</div>

				{/* Player Info */}
				<div className="flex-1 min-w-0">
					<div
						className={`flex items-center ${
							isMobile ? "space-x-1" : "space-x-2"
						}`}
					>
						<span
							className={`font-medium truncate ${
								isMobile ? "text-sm" : "text-base"
							} ${isCurrentPlayer ? "text-blue-800" : "text-gray-800"}`}
						>
							{player.name}
							{isCurrentPlayer && (isMobile ? "" : " (You)")}
						</span>

						{isHost && (
							<span
								className={`font-medium bg-yellow-100 text-yellow-800 rounded-full ${
									isMobile ? "px-1 py-0.5 text-xs" : "px-2 py-1 text-xs"
								}`}
							>
								{isMobile ? "👑" : "Host"}
							</span>
						)}
					</div>

					{/* Connection and submission status */}
					{!isMobile && (
						<div className="flex items-center space-x-3 mt-1">
							{showConnectionStatus && (
								<ConnectionStatus
									className="scale-75"
									showText={false}
								/>
							)}

							{showSubmissionStatus && gamePhase === "submission" && (
								<div className="flex items-center space-x-1">
									<div
										className={`w-2 h-2 rounded-full ${
											hasSubmitted ? "bg-green-500" : "bg-gray-300"
										}`}
									/>
									<span className="text-xs text-gray-600">
										{hasSubmitted ? "Submitted" : "Waiting"}
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Player Score */}
			<div className="text-right flex-shrink-0">
				<div
					className={`font-bold text-gray-800 ${
						isMobile ? "text-base" : "text-lg"
					}`}
				>
					{player.score}
				</div>
				{!isMobile && <div className="text-xs text-gray-500">points</div>}
			</div>

			{/* Mobile connection status */}
			{isMobile && showConnectionStatus && (
				<div className="ml-2">
					<ConnectionStatus showText={false} />
				</div>
			)}
		</motion.div>
	);
}

// Compact version for smaller spaces
export function CompactPlayerList({
	players,
	currentPlayerId,
	className = "",
}: {
	players: Player[];
	currentPlayerId: string;
	className?: string;
}) {
	const { gameState } = useGame();

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{players.map((player) => (
				<motion.div
					key={player.id}
					layout
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					className={`
						flex items-center space-x-2 px-3 py-2 rounded-full text-sm
						${
							player.id === currentPlayerId
								? "bg-blue-100 text-blue-800"
								: "bg-gray-100 text-gray-700"
						}
						${!player.is_connected ? "opacity-50" : ""}
					`}
				>
					<div
						className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold
							${player.id === currentPlayerId ? "bg-blue-500" : "bg-gray-500"}
						`}
					>
						{player.name.charAt(0).toUpperCase()}
					</div>
					<span className="font-medium">{player.name}</span>
					{gameState?.host_id === player.id && (
						<span className="text-xs">👑</span>
					)}
					<span className="font-bold">{player.score}</span>
				</motion.div>
			))}
		</div>
	);
}
