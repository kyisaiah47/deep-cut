import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { Player, Submission } from "@/types/game";

interface PlayerSubmissionStatus {
	player: Player;
	hasSubmitted: boolean;
	submittedAt?: string;
}

interface SubmissionStatusIndicatorProps {
	showPlayerNames?: boolean;
	compact?: boolean;
	className?: string;
}

export function SubmissionStatusIndicator({
	showPlayerNames = true,
	compact = false,
	className = "",
}: SubmissionStatusIndicatorProps) {
	const { gameState, players, submissions } = useGame();

	// Calculate submission status for each player
	const playerStatuses = useMemo((): PlayerSubmissionStatus[] => {
		if (!gameState) return [];

		return players.map((player) => {
			const playerSubmission = submissions.find(
				(sub) =>
					sub.player_id === player.id &&
					sub.round_number === gameState.current_round
			);

			return {
				player,
				hasSubmitted: !!playerSubmission,
				submittedAt: playerSubmission?.submitted_at,
			};
		});
	}, [players, submissions, gameState]);

	// Calculate overall progress
	const progress = useMemo(() => {
		const submitted = playerStatuses.filter(
			(status) => status.hasSubmitted
		).length;
		const total = playerStatuses.length;
		const percentage = total > 0 ? (submitted / total) * 100 : 0;

		return { submitted, total, percentage };
	}, [playerStatuses]);

	if (compact) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className={`inline-flex items-center space-x-2 ${className}`}
			>
				<div className="flex -space-x-1">
					{playerStatuses.map((status, index) => (
						<motion.div
							key={status.player.id}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: index * 0.1 }}
							className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
								status.hasSubmitted
									? "bg-green-500 text-white"
									: status.player.is_connected
									? "bg-yellow-400 text-gray-800"
									: "bg-gray-300 text-gray-600"
							}`}
							title={`${status.player.name} - ${
								status.hasSubmitted
									? "Submitted"
									: status.player.is_connected
									? "Thinking..."
									: "Disconnected"
							}`}
						>
							{status.hasSubmitted
								? "✓"
								: status.player.name.charAt(0).toUpperCase()}
						</motion.div>
					))}
				</div>
				<span className="text-sm text-gray-600">
					{progress.submitted}/{progress.total}
				</span>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					Submission Status
				</h3>
				<span className="text-sm text-gray-600">
					{progress.submitted}/{progress.total} submitted
				</span>
			</div>

			{/* Progress bar */}
			<div className="space-y-2">
				<div className="flex justify-between text-sm text-gray-600">
					<span>Progress</span>
					<span>{Math.round(progress.percentage)}%</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<motion.div
						className="bg-blue-500 h-2 rounded-full"
						initial={{ width: "0%" }}
						animate={{ width: `${progress.percentage}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>
			</div>

			{/* Player list */}
			{showPlayerNames && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium text-gray-700">Players:</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{playerStatuses.map((status, index) => (
							<motion.div
								key={status.player.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className={`flex items-center space-x-2 p-2 rounded-md ${
									status.hasSubmitted
										? "bg-green-50 border border-green-200"
										: status.player.is_connected
										? "bg-yellow-50 border border-yellow-200"
										: "bg-gray-50 border border-gray-200"
								}`}
							>
								<div
									className={`w-3 h-3 rounded-full ${
										status.hasSubmitted
											? "bg-green-500"
											: status.player.is_connected
											? "bg-yellow-400"
											: "bg-gray-400"
									}`}
								/>
								<span
									className={`text-sm font-medium ${
										status.hasSubmitted
											? "text-green-800"
											: status.player.is_connected
											? "text-yellow-800"
											: "text-gray-600"
									}`}
								>
									{status.player.name}
								</span>
								<span
									className={`text-xs ${
										status.hasSubmitted
											? "text-green-600"
											: status.player.is_connected
											? "text-yellow-600"
											: "text-gray-500"
									}`}
								>
									{status.hasSubmitted
										? "✓ Submitted"
										: status.player.is_connected
										? "Thinking..."
										: "Offline"}
								</span>
							</motion.div>
						))}
					</div>
				</div>
			)}

			{/* Waiting message */}
			{progress.submitted < progress.total && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-2"
				>
					<p className="text-sm text-gray-600">
						Waiting for {progress.total - progress.submitted} more player
						{progress.total - progress.submitted !== 1 ? "s" : ""} to submit...
					</p>
				</motion.div>
			)}

			{/* All submitted message */}
			{progress.submitted === progress.total && progress.total > 0 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center py-2 bg-green-50 border border-green-200 rounded-md"
				>
					<p className="text-sm font-medium text-green-800">
						All players have submitted! Moving to voting phase...
					</p>
				</motion.div>
			)}
		</motion.div>
	);
}
