"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardDisplay, SubmissionCard, ResponseCardGrid } from "./index";
import { Card as CardType, Submission } from "../types/game";
import {
	validateCardSelection,
	getSelectionStatusMessage,
} from "../lib/card-validation";

// Mock data for demonstration
const mockPromptCard: CardType = {
	id: "prompt-1",
	game_id: "demo-game",
	round_number: 1,
	type: "prompt",
	text: "The secret to happiness is ___________.",
	created_at: new Date().toISOString(),
};

const mockResponseCards: CardType[] = [
	{
		id: "response-1",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "A warm hug from a stranger",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-2",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Unlimited pizza",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-3",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Finding money in old pants",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-4",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Dancing like nobody's watching",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-5",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "A perfectly timed joke",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-6",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Sleeping in on weekends",
		created_at: new Date().toISOString(),
	},
];

const mockSubmissions: Submission[] = [
	{
		id: "sub-1",
		game_id: "demo-game",
		player_id: "player-1",
		round_number: 1,
		prompt_card_id: "prompt-1",
		response_cards: [
			mockPromptCard,
			mockResponseCards[0],
			mockResponseCards[1],
		],
		votes: 3,
		submitted_at: new Date().toISOString(),
	},
	{
		id: "sub-2",
		game_id: "demo-game",
		player_id: "player-2",
		round_number: 1,
		prompt_card_id: "prompt-1",
		response_cards: [
			mockPromptCard,
			mockResponseCards[2],
			mockResponseCards[3],
		],
		votes: 1,
		submitted_at: new Date().toISOString(),
	},
];

export function CardDisplayDemo() {
	const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
	const [votedSubmissionId, setVotedSubmissionId] = useState<string | null>(
		null
	);
	const [demoMode, setDemoMode] = useState<"selection" | "voting">("selection");

	const allCards = [mockPromptCard, ...mockResponseCards];

	const handleCardSelect = (cardId: string) => {
		setSelectedCardIds((prev) => {
			if (prev.includes(cardId)) {
				return prev.filter((id) => id !== cardId);
			} else {
				return [...prev, cardId];
			}
		});
	};

	const handleVote = (submissionId: string) => {
		setVotedSubmissionId(submissionId);
	};

	const validation = validateCardSelection(
		allCards.filter((card) => selectedCardIds.includes(card.id)),
		{ minResponseCards: 2, maxResponseCards: 3 }
	);

	const statusMessage = getSelectionStatusMessage(
		allCards.filter((card) => selectedCardIds.includes(card.id)),
		{ minResponseCards: 2, maxResponseCards: 3 }
	);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						Card Display Components Demo
					</h1>
					<p className="text-gray-600 text-lg">
						Interactive demonstration of card components with animations
					</p>
				</div>

				{/* Mode Toggle */}
				<div className="flex justify-center mb-8">
					<div className="bg-white rounded-lg p-1 shadow-md">
						<button
							onClick={() => setDemoMode("selection")}
							className={`px-6 py-2 rounded-md font-medium transition-all ${
								demoMode === "selection"
									? "bg-blue-500 text-white shadow-md"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							Card Selection
						</button>
						<button
							onClick={() => setDemoMode("voting")}
							className={`px-6 py-2 rounded-md font-medium transition-all ${
								demoMode === "voting"
									? "bg-blue-500 text-white shadow-md"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							Voting Interface
						</button>
					</div>
				</div>

				{demoMode === "selection" ? (
					<>
						{/* Selection Status */}
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white rounded-lg shadow-md p-6 mb-8"
						>
							<div className="text-center">
								<p className="text-lg font-medium text-gray-900 mb-2">
									{statusMessage}
								</p>
								{validation.errors.length > 0 && (
									<div className="text-red-600 text-sm">
										{validation.errors.join(", ")}
									</div>
								)}
								{validation.warnings.length > 0 && (
									<div className="text-yellow-600 text-sm">
										{validation.warnings.join(", ")}
									</div>
								)}
								<div className="mt-4">
									<button
										onClick={() => setSelectedCardIds([])}
										className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 mr-4"
									>
										Clear Selection
									</button>
									<button
										disabled={!validation.isValid}
										className={`px-4 py-2 rounded-md font-medium ${
											validation.isValid
												? "bg-green-500 text-white hover:bg-green-600"
												: "bg-gray-300 text-gray-500 cursor-not-allowed"
										}`}
									>
										Submit Cards
									</button>
								</div>
							</div>
						</motion.div>

						{/* Card Display */}
						<div className="bg-white rounded-lg shadow-md p-6">
							<CardDisplay
								cards={allCards}
								selectedCardIds={selectedCardIds}
								onCardSelect={handleCardSelect}
								selectable={true}
								maxSelections={4}
								title="Select Your Cards"
							/>
						</div>
					</>
				) : (
					<>
						{/* Voting Status */}
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white rounded-lg shadow-md p-6 mb-8"
						>
							<div className="text-center">
								<p className="text-lg font-medium text-gray-900 mb-2">
									{votedSubmissionId
										? "Vote submitted!"
										: "Vote for the funniest combination"}
								</p>
								{votedSubmissionId && (
									<button
										onClick={() => setVotedSubmissionId(null)}
										className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
									>
										Change Vote
									</button>
								)}
							</div>
						</motion.div>

						{/* Submissions Display */}
						<div className="bg-white rounded-lg shadow-md p-6">
							<h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
								Vote for Your Favorite
							</h2>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{mockSubmissions.map((submission, index) => (
									<SubmissionCard
										key={submission.id}
										submission={submission}
										promptCard={mockPromptCard}
										isVotingPhase={!votedSubmissionId}
										hasVoted={votedSubmissionId === submission.id}
										onVote={handleVote}
										animationDelay={index * 0.2}
									/>
								))}
							</div>
						</div>
					</>
				)}

				{/* Individual Card Examples */}
				<div className="mt-12 bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
						Individual Card Examples
					</h2>
					<ResponseCardGrid>
						<Card
							card={mockPromptCard}
							className="max-w-sm mx-auto"
						/>
						<Card
							card={mockResponseCards[0]}
							isSelectable={true}
							onClick={() => console.log("Card clicked")}
							className="max-w-sm mx-auto"
						/>
						<Card
							card={mockResponseCards[1]}
							isSelected={true}
							isSelectable={true}
							onClick={() => console.log("Card clicked")}
							className="max-w-sm mx-auto"
						/>
					</ResponseCardGrid>
				</div>
			</div>
		</div>
	);
}
