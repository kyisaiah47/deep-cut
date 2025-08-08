"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Player, Submission, Card } from "@/types/game";

interface RoundResultsProps {
	roundNumber: number;
	winners: Player[];
	winningSubmissions: Submission[];
	allSubmissions: Submission[];
	maxVotes: number;
	hasTie: boolean;
	promptCard?: Card;
	onContinue?: () => void;
	onViewAllSubmissions?: () => void;
	showContinueButton?: boolean;
	className?: string;
}

interface SubmissionWithCards extends Submission {
	responseCardsData: Card[];
}

export function RoundResults({
	roundNumber,
	winners,
	winningSubmissions,
	allSubmissions,
	maxVotes,
	hasTie,
	promptCard,
	onContinue,
	onViewAllSubmissions,
	showContinueButton = true,
	className = "",
}: RoundResultsProps) {
	// Convert submissions to include card data
	const submissionsWithCards: SubmissionWithCards[] = allSubmissions.map(
		(submission) => ({
			...submission,
			responseCardsData: submission.response_cards || [],
		})
	);

	// Sort all submissions by votes (descending)
	const sortedSubmissions = submissionsWithCards.sort(
		(a, b) => b.votes - a.votes
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className={`space-y-6 ${className}`}
		>
			{/* Header */}
			<div className="text-center">
				<motion.h2
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					className="text-2xl font-bold text-gray-900 mb-2"
				>
					Round {roundNumber} Results
				</motion.h2>
				{promptCard && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="max-w-md mx-auto"
					>
						<div className="text-sm font-medium text-gray-500 mb-2">PROMPT</div>
						<div className="p-4 bg-gray-900 text-white rounded-lg font-medium">
							{promptCard.text}
						</div>
					</motion.div>
				)}
			</div>

			{/* Winners announcement */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.4 }}
				className="text-center py-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
			>
				<motion.div
					initial={{ rotate: -180, scale: 0 }}
					animate={{ rotate: 0, scale: 1 }}
					transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
					className="text-4xl mb-3"
				>
					{hasTie ? "🎉" : "🏆"}
				</motion.div>

				<h3 className="text-xl font-bold text-gray-900 mb-2">
					{hasTie ? "It's a Tie!" : "Round Winner!"}
				</h3>

				<div className="flex flex-wrap justify-center gap-2 mb-3">
					{winners.map((winner, index) => (
						<motion.div
							key={winner.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.8 + index * 0.1 }}
						>
							<Badge
								variant="default"
								className="bg-yellow-500 text-white text-lg px-4 py-2"
							>
								{winner.name}
							</Badge>
						</motion.div>
					))}
				</div>

				<p className="text-gray-700">
					{maxVotes} vote{maxVotes !== 1 ? "s" : ""} received
				</p>
			</motion.div>

			{/* Winning submissions */}
			<div className="space-y-4">
				<h4 className="text-lg font-semibold text-gray-900">
					Winning Submission{winningSubmissions.length > 1 ? "s" : ""}
				</h4>

				<div className="grid gap-4 md:grid-cols-2">
					{winningSubmissions.map((submission, index) => {
						const submissionWithCards = submissionsWithCards.find(
							(s) => s.id === submission.id
						);
						const winner = winners.find((w) => w.id === submission.player_id);

						return (
							<motion.div
								key={submission.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 1 + index * 0.2 }}
								className="relative p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg"
							>
								{/* Winner badge */}
								<div className="absolute -top-2 -right-2">
									<Badge
										variant="default"
										className="bg-yellow-500 text-white"
									>
										🏆 Winner
									</Badge>
								</div>

								{/* Player name */}
								<div className="mb-3">
									<span className="text-sm font-medium text-gray-600">
										By {winner?.name || "Unknown Player"}
									</span>
								</div>

								{/* Response cards */}
								<div className="space-y-2">
									{submissionWithCards?.responseCardsData.map(
										(card, cardIndex) => (
											<div
												key={cardIndex}
												className="p-3 bg-white border border-yellow-200 rounded-lg text-sm"
											>
												{card.text}
											</div>
										)
									)}
								</div>

								{/* Vote count */}
								<div className="mt-3 text-center">
									<Badge
										variant="secondary"
										className="text-sm"
									>
										{submission.votes} vote{submission.votes !== 1 ? "s" : ""}
									</Badge>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* All submissions summary */}
			{sortedSubmissions.length > winningSubmissions.length && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.5 }}
					className="space-y-3"
				>
					<div className="flex items-center justify-between">
						<h4 className="text-lg font-semibold text-gray-900">
							All Submissions
						</h4>
						{onViewAllSubmissions && (
							<Button
								variant="outline"
								size="sm"
								onClick={onViewAllSubmissions}
							>
								View Details
							</Button>
						)}
					</div>

					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{sortedSubmissions.map((submission, index) => {
							const isWinner = winningSubmissions.some(
								(w) => w.id === submission.id
							);

							return (
								<motion.div
									key={submission.id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 1.7 + index * 0.05 }}
									className={`
										p-3 rounded-lg border text-sm
										${isWinner ? "bg-yellow-50 border-yellow-300" : "bg-gray-50 border-gray-200"}
									`}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-medium text-gray-700">
											Submission {index + 1}
										</span>
										<div className="flex items-center gap-2">
											<Badge
												variant={isWinner ? "default" : "secondary"}
												className={`text-xs ${
													isWinner ? "bg-yellow-500 text-white" : ""
												}`}
											>
												{submission.votes} vote
												{submission.votes !== 1 ? "s" : ""}
											</Badge>
											{isWinner && (
												<span className="text-yellow-500 text-xs">🏆</span>
											)}
										</div>
									</div>

									{/* Show first response card as preview */}
									{submission.responseCardsData.length > 0 && (
										<div className="text-xs text-gray-600 truncate">
											{submission.responseCardsData[0].text}
											{submission.responseCardsData.length > 1 && "..."}
										</div>
									)}
								</motion.div>
							);
						})}
					</div>
				</motion.div>
			)}

			{/* Continue button */}
			{showContinueButton && onContinue && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 2 }}
					className="flex justify-center pt-4"
				>
					<Button
						onClick={onContinue}
						size="lg"
						className="min-w-32"
					>
						Continue to Next Round
					</Button>
				</motion.div>
			)}
		</motion.div>
	);
}
