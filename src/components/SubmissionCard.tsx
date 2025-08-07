import React from "react";
import { motion } from "framer-motion";
import { Submission } from "../types/game";
import { Card } from "./Card";
import { ANIMATION_DURATIONS } from "../lib/constants";

interface SubmissionCardProps {
	submission: Submission;
	isVotable?: boolean;
	hasVoted?: boolean;
	isWinner?: boolean;
	showVoteCount?: boolean;
	onClick?: (submissionId: string) => void;
	animationDelay?: number;
	className?: string;
}

export function SubmissionCard({
	submission,
	isVotable = false,
	hasVoted = false,
	isWinner = false,
	showVoteCount = false,
	onClick,
	animationDelay = 0,
	className = "",
}: SubmissionCardProps) {
	const handleClick = () => {
		if (isVotable && !hasVoted && onClick) {
			onClick(submission.id);
		}
	};

	const canClick = isVotable && !hasVoted;

	return (
		<motion.div
			initial={{ opacity: 0, y: 30, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: ANIMATION_DURATIONS.CARD_SELECT,
				delay: animationDelay,
				ease: "easeOut",
			}}
			whileHover={
				canClick
					? {
							scale: 1.02,
							y: -4,
							transition: { duration: ANIMATION_DURATIONS.CARD_HOVER },
					  }
					: {}
			}
			whileTap={
				canClick
					? {
							scale: 0.98,
							transition: { duration: 0.1 },
					  }
					: {}
			}
			className={`
				relative bg-white rounded-xl shadow-lg border-2 p-6 transition-all duration-200
				${
					isWinner
						? "border-yellow-400 bg-yellow-50 shadow-yellow-200/50"
						: "border-gray-200"
				}
				${
					canClick
						? "cursor-pointer hover:shadow-xl hover:border-blue-300"
						: hasVoted
						? "opacity-75"
						: ""
				}
				${className}
			`
				.trim()
				.replace(/\s+/g, " ")}
			onClick={handleClick}
		>
			{/* Winner badge */}
			{isWinner && (
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
					className="absolute -top-3 -right-3 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow-lg"
				>
					👑
				</motion.div>
			)}

			{/* Vote count badge */}
			{showVoteCount && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2 }}
					className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
				>
					{submission.votes}
				</motion.div>
			)}

			{/* Cards display */}
			<div className="space-y-4">
				{/* Find and display prompt card */}
				{submission.response_cards.find((card) => card.type === "prompt") && (
					<div className="mb-4">
						<Card
							card={
								submission.response_cards.find(
									(card) => card.type === "prompt"
								)!
							}
							className="border-blue-300 bg-blue-50"
						/>
					</div>
				)}

				{/* Display response cards */}
				<div className="space-y-2">
					{submission.response_cards
						.filter((card) => card.type === "response")
						.map((card, index) => (
							<Card
								key={card.id}
								card={card}
								animationDelay={index * 0.05}
								className="border-gray-300 bg-gray-50"
							/>
						))}
				</div>
			</div>

			{/* Voting indicator */}
			{canClick && (
				<motion.div
					className="absolute inset-0 rounded-xl bg-blue-500 opacity-0"
					whileHover={{ opacity: 0.05 }}
					transition={{ duration: ANIMATION_DURATIONS.CARD_HOVER }}
				/>
			)}

			{/* Voted indicator */}
			{hasVoted && (
				<div className="absolute inset-0 rounded-xl bg-green-500 opacity-10 pointer-events-none" />
			)}
		</motion.div>
	);
}
