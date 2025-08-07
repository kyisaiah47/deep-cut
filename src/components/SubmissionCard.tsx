import React from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";
import { Submission, Card as CardType } from "@/types/game";

interface SubmissionCardProps {
	submission: Submission;
	promptCard: CardType;
	showPlayerName?: boolean;
	playerName?: string;
	isVotingPhase?: boolean;
	hasVoted?: boolean;
	onVote?: (submissionId: string) => void;
	animationDelay?: number;
	className?: string;
}

export function SubmissionCard({
	submission,
	promptCard,
	showPlayerName = false,
	playerName,
	isVotingPhase = false,
	hasVoted = false,
	onVote,
	animationDelay = 0,
	className = "",
}: SubmissionCardProps) {
	const handleVote = () => {
		if (isVotingPhase && !hasVoted && onVote) {
			onVote(submission.id);
		}
	};

	const canVote = isVotingPhase && !hasVoted && onVote;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: animationDelay }}
			className={`bg-white border rounded-lg p-4 space-y-4 ${
				canVote
					? "cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
					: ""
			} ${className}`}
			onClick={handleVote}
			whileHover={canVote ? { scale: 1.02 } : undefined}
			whileTap={canVote ? { scale: 0.98 } : undefined}
		>
			{/* Header with player info and votes */}
			<div className="flex items-center justify-between">
				{showPlayerName && playerName && (
					<span className="text-sm font-medium text-gray-700">
						{playerName}
					</span>
				)}
				{!showPlayerName && (
					<span className="text-sm text-gray-500">Anonymous Submission</span>
				)}

				{submission.votes > 0 && (
					<div className="flex items-center space-x-1">
						<span className="text-sm font-medium text-blue-600">
							{submission.votes}
						</span>
						<span className="text-sm text-gray-500">
							vote{submission.votes !== 1 ? "s" : ""}
						</span>
					</div>
				)}
			</div>

			{/* Prompt card */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium text-gray-600">Prompt:</h4>
				<Card
					card={promptCard}
					isSelected={false}
					isSelectable={false}
					onClick={() => {}}
					className="pointer-events-none"
				/>
			</div>

			{/* Response cards */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium text-gray-600">Response:</h4>
				<div className="grid gap-2">
					{submission.response_cards.map((responseCard, index) => (
						<Card
							key={responseCard.id || index}
							card={responseCard as CardType}
							isSelected={false}
							isSelectable={false}
							onClick={() => {}}
							className="pointer-events-none"
						/>
					))}
				</div>
			</div>

			{/* Voting indicator */}
			{canVote && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center pt-2 border-t border-gray-100"
				>
					<span className="text-sm text-blue-600 font-medium">
						Click to vote for this combination
					</span>
				</motion.div>
			)}

			{/* Already voted indicator */}
			{isVotingPhase && hasVoted && (
				<div className="text-center pt-2 border-t border-gray-100">
					<span className="text-sm text-gray-500">
						You have already voted this round
					</span>
				</div>
			)}
		</motion.div>
	);
}
