"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCardGeneration, useGameCards, useCardDistribution } from "../hooks";

interface CardGenerationDemoProps {
	gameId: string;
	roundNumber: number;
	playerIds: string[];
}

export function CardGenerationDemo({
	gameId,
	roundNumber,
	playerIds,
}: CardGenerationDemoProps) {
	const [theme, setTheme] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState(playerIds[0] || "");

	const {
		generateCardsForRound,
		isGenerating,
		generationError,
		lastGenerationResult,
		clearError,
	} = useCardGeneration();

	const {
		promptCard,
		responseCards,
		playerCards,
		loadCardsForRound,
		loadPlayerCards,
		isLoading,
		error: cardsError,
	} = useGameCards();

	const {
		distributeCardsToAllPlayers,
		isDistributing,
		distributionError,
		distributionComplete,
		resetDistribution,
	} = useCardDistribution();

	const handleGenerateCards = async () => {
		clearError();
		const result = await generateCardsForRound({
			gameId,
			roundNumber,
			playerCount: playerIds.length,
			theme: theme.trim() || undefined,
		});

		if (result.success) {
			// Automatically load the generated cards
			await loadCardsForRound(gameId, roundNumber);
		}
	};

	const handleDistributeCards = async () => {
		resetDistribution();
		const success = await distributeCardsToAllPlayers(
			gameId,
			roundNumber,
			playerIds,
			5
		);

		if (success && selectedPlayerId) {
			// Load cards for the selected player
			await loadPlayerCards(gameId, roundNumber, selectedPlayerId);
		}
	};

	const handleLoadPlayerCards = async (playerId: string) => {
		setSelectedPlayerId(playerId);
		await loadPlayerCards(gameId, roundNumber, playerId);
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-8">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					AI Card Generation Demo
				</h1>
				<p className="text-gray-600">
					Game: {gameId} | Round: {roundNumber} | Players: {playerIds.length}
				</p>
			</div>

			{/* Generation Controls */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-semibold mb-4">Generate Cards</h2>

				<div className="space-y-4">
					<div>
						<label
							htmlFor="theme"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Theme (optional)
						</label>
						<input
							id="theme"
							type="text"
							value={theme}
							onChange={(e) => setTheme(e.target.value)}
							placeholder="e.g., technology, food, travel"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isGenerating}
						/>
					</div>

					<button
						onClick={handleGenerateCards}
						disabled={isGenerating}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isGenerating ? "Generating Cards..." : "Generate Cards with AI"}
					</button>

					{generationError && (
						<div className="bg-red-50 border border-red-200 rounded-md p-3">
							<p className="text-red-800 text-sm">{generationError}</p>
						</div>
					)}

					{lastGenerationResult && lastGenerationResult.success && (
						<div className="bg-green-50 border border-green-200 rounded-md p-3">
							<p className="text-green-800 text-sm">
								✅ Generated {lastGenerationResult.cardsGenerated} cards (
								{lastGenerationResult.responseCardsCount} responses + 1 prompt)
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Generated Cards Display */}
			{(promptCard || responseCards.length > 0) && (
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">Generated Cards</h2>

					{promptCard && (
						<div className="mb-6">
							<h3 className="text-lg font-medium mb-2">Prompt Card</h3>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4"
							>
								<p className="text-blue-900 font-medium">{promptCard.text}</p>
							</motion.div>
						</div>
					)}

					{responseCards.length > 0 && (
						<div>
							<h3 className="text-lg font-medium mb-2">
								Response Cards ({responseCards.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{responseCards.slice(0, 12).map((card, index) => (
									<motion.div
										key={card.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className="bg-gray-100 border border-gray-300 rounded-lg p-3"
									>
										<p className="text-gray-800 text-sm">{card.text}</p>
									</motion.div>
								))}
							</div>
							{responseCards.length > 12 && (
								<p className="text-gray-500 text-sm mt-2">
									... and {responseCards.length - 12} more cards
								</p>
							)}
						</div>
					)}
				</div>
			)}

			{/* Card Distribution */}
			{responseCards.length > 0 && (
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">
						Distribute Cards to Players
					</h2>

					<button
						onClick={handleDistributeCards}
						disabled={isDistributing || distributionComplete}
						className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
					>
						{isDistributing
							? "Distributing Cards..."
							: distributionComplete
							? "Cards Distributed ✅"
							: "Distribute Cards to All Players"}
					</button>

					{distributionError && (
						<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
							<p className="text-red-800 text-sm">{distributionError}</p>
						</div>
					)}

					{distributionComplete && (
						<div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
							<p className="text-green-800 text-sm">
								✅ Cards distributed to {playerIds.length} players (5 cards
								each)
							</p>
						</div>
					)}

					{/* Player Selection */}
					{distributionComplete && (
						<div className="space-y-4">
							<div>
								<label
									htmlFor="player-select"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									View cards for player:
								</label>
								<select
									id="player-select"
									value={selectedPlayerId}
									onChange={(e) => handleLoadPlayerCards(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{playerIds.map((playerId) => (
										<option
											key={playerId}
											value={playerId}
										>
											{playerId}
										</option>
									))}
								</select>
							</div>

							{/* Player Cards Display */}
							{playerCards.length > 0 && (
								<div>
									<h3 className="text-lg font-medium mb-2">
										{selectedPlayerId}&apos;s Cards ({playerCards.length})
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{playerCards.map((card, index) => (
											<motion.div
												key={card.id}
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: index * 0.1 }}
												className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 cursor-pointer hover:bg-yellow-200 transition-colors"
											>
												<p className="text-yellow-900 text-sm font-medium">
													{card.text}
												</p>
											</motion.div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Loading States */}
			{(isLoading || isGenerating || isDistributing) && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<div className="flex items-center space-x-3">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
							<p className="text-gray-700">
								{isGenerating && "Generating cards..."}
								{isDistributing && "Distributing cards..."}
								{isLoading && "Loading cards..."}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Error Display */}
			{cardsError && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<h3 className="text-red-800 font-medium mb-2">Error Loading Cards</h3>
					<p className="text-red-700 text-sm">{cardsError}</p>
				</div>
			)}
		</div>
	);
}

export default CardGenerationDemo;
