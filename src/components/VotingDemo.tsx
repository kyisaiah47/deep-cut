import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VotingInterface } from "./VotingInterface";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// Mock data for demonstration
const mockGameState = {
	id: "demo-game",
	room_code: "DEMO01",
	phase: "voting" as const,
	current_round: 1,
	target_score: 7,
	max_players: 8,
	submission_timer: 60,
	voting_timer: 30,
	host_id: "player-1",
	created_at: "2023-01-01T00:00:00Z",
	updated_at: "2023-01-01T00:00:00Z",
};

const mockPlayers = [
	{
		id: "player-1",
		game_id: "demo-game",
		name: "You",
		score: 2,
		is_connected: true,
		joined_at: "2023-01-01T00:00:00Z",
	},
	{
		id: "player-2",
		game_id: "demo-game",
		name: "Alice",
		score: 1,
		is_connected: true,
		joined_at: "2023-01-01T00:00:00Z",
	},
	{
		id: "player-3",
		game_id: "demo-game",
		name: "Bob",
		score: 3,
		is_connected: true,
		joined_at: "2023-01-01T00:00:00Z",
	},
	{
		id: "player-4",
		game_id: "demo-game",
		name: "Charlie",
		score: 0,
		is_connected: true,
		joined_at: "2023-01-01T00:00:00Z",
	},
];

const mockSubmissions = [
	{
		id: "submission-1",
		game_id: "demo-game",
		player_id: "player-2",
		round_number: 1,
		prompt_card_id: "prompt-1",
		response_cards: [
			{
				id: "response-1",
				text: "A confused penguin",
				type: "response" as const,
			},
			{
				id: "response-2",
				text: "My grandmother's secret recipe",
				type: "response" as const,
			},
		],
		votes: 0,
		submitted_at: "2023-01-01T00:00:00Z",
	},
	{
		id: "submission-2",
		game_id: "demo-game",
		player_id: "player-3",
		round_number: 1,
		prompt_card_id: "prompt-1",
		response_cards: [
			{ id: "response-3", text: "A rubber duck", type: "response" as const },
			{
				id: "response-4",
				text: "The last slice of pizza",
				type: "response" as const,
			},
		],
		votes: 0,
		submitted_at: "2023-01-01T00:00:00Z",
	},
	{
		id: "submission-3",
		game_id: "demo-game",
		player_id: "player-4",
		round_number: 1,
		prompt_card_id: "prompt-1",
		response_cards: [
			{ id: "response-5", text: "My pet hamster", type: "response" as const },
		],
		votes: 0,
		submitted_at: "2023-01-01T00:00:00Z",
	},
];

const mockCurrentRoundCards = [
	{
		id: "prompt-1",
		game_id: "demo-game",
		round_number: 1,
		type: "prompt" as const,
		text: "What would make the worst wedding gift?",
		created_at: "2023-01-01T00:00:00Z",
	},
];

export function VotingDemo() {
	const [demoPhase, setDemoPhase] = useState<"voting" | "results">("voting");
	const [submissions, setSubmissions] = useState(mockSubmissions);
	const [votes, setVotes] = useState<any[]>([]);
	const [hasVoted, setHasVoted] = useState(false);

	// Mock the useGame hook context
	const mockGameContext = {
		gameState: { ...mockGameState, phase: demoPhase },
		currentPlayer: mockPlayers[0], // "You" are the current player
		submissions,
		votes,
		players: mockPlayers,
		currentRoundCards: mockCurrentRoundCards,
		isHost: false,
		updateGamePhase: () => {},
		refetchGameState: () => {},
		broadcastEvent: () => {},
	};

	// Mock the useGameActions hook
	const mockGameActions = {
		submitVote: async (submissionId: string) => {
			// Simulate voting
			const newVote = {
				id: `vote-${Date.now()}`,
				game_id: "demo-game",
				player_id: "player-1",
				submission_id: submissionId,
				round_number: 1,
				voted_at: new Date().toISOString(),
			};

			setVotes((prev) => [...prev, newVote]);
			setHasVoted(true);

			// Update submission vote count
			setSubmissions((prev) =>
				prev.map((sub) =>
					sub.id === submissionId ? { ...sub, votes: sub.votes + 1 } : sub
				)
			);

			// Simulate other players voting after a delay
			setTimeout(() => {
				simulateOtherVotes();
			}, 2000);
		},
	};

	const simulateOtherVotes = () => {
		// Simulate other players voting
		const otherVotes = [
			{ id: "vote-2", player_id: "player-2", submission_id: "submission-2" },
			{ id: "vote-3", player_id: "player-3", submission_id: "submission-1" },
			{ id: "vote-4", player_id: "player-4", submission_id: "submission-1" },
		];

		otherVotes.forEach((vote, index) => {
			setTimeout(() => {
				setVotes((prev) => [
					...prev,
					{
						...vote,
						game_id: "demo-game",
						round_number: 1,
						voted_at: new Date().toISOString(),
					},
				]);

				setSubmissions((prev) =>
					prev.map((sub) =>
						sub.id === vote.submission_id
							? { ...sub, votes: sub.votes + 1 }
							: sub
					)
				);

				// Transition to results after all votes
				if (index === otherVotes.length - 1) {
					setTimeout(() => {
						setDemoPhase("results");
					}, 1000);
				}
			}, index * 1000);
		});
	};

	const resetDemo = () => {
		setDemoPhase("voting");
		setSubmissions(mockSubmissions);
		setVotes([]);
		setHasVoted(false);
	};

	// Mock the hooks for the VotingInterface component
	React.useEffect(() => {
		// This would normally be handled by the context providers
		(window as any).mockGameContext = mockGameContext;
		(window as any).mockGameActions = mockGameActions;
	}, [mockGameContext, mockGameActions]);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						🗳️ Voting Interface Demo
					</h1>
					<p className="text-lg text-gray-600 mb-6">
						Experience the complete voting mechanics and interface
					</p>

					<div className="flex justify-center gap-4 mb-8">
						<Badge variant={demoPhase === "voting" ? "default" : "secondary"}>
							Voting Phase
						</Badge>
						<Badge variant={demoPhase === "results" ? "default" : "secondary"}>
							Results Phase
						</Badge>
					</div>

					<Button
						onClick={resetDemo}
						variant="outline"
						className="mb-8"
					>
						Reset Demo
					</Button>
				</motion.div>

				{/* Game Info */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white rounded-lg shadow-sm p-6 mb-8"
				>
					<h2 className="text-xl font-semibold mb-4">Current Game State</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">
								{mockGameState.current_round}
							</div>
							<div className="text-sm text-gray-600">Round</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{mockPlayers.length}
							</div>
							<div className="text-sm text-gray-600">Players</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{submissions.length}
							</div>
							<div className="text-sm text-gray-600">Submissions</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{votes.length}
							</div>
							<div className="text-sm text-gray-600">Votes</div>
						</div>
					</div>
				</motion.div>

				{/* Players List */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-lg shadow-sm p-6 mb-8"
				>
					<h2 className="text-xl font-semibold mb-4">Players & Scores</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{mockPlayers.map((player, index) => (
							<div
								key={player.id}
								className="text-center p-3 bg-gray-50 rounded-lg"
							>
								<div className="font-medium">{player.name}</div>
								<div className="text-sm text-gray-600">
									Score: {player.score}
								</div>
								{player.id === "player-1" && (
									<Badge
										variant="outline"
										className="mt-1 text-xs"
									>
										You
									</Badge>
								)}
							</div>
						))}
					</div>
				</motion.div>

				{/* Voting Interface */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-white rounded-lg shadow-sm p-6"
				>
					<h2 className="text-xl font-semibold mb-6">Voting Interface</h2>

					{/* Demo-specific voting interface */}
					<div className="space-y-6">
						{demoPhase === "voting" ? (
							<div>
								<div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
									<h3 className="font-semibold text-purple-800 mb-2">
										Current Prompt
									</h3>
									<p className="text-purple-700">
										{mockCurrentRoundCards[0].text}
									</p>
								</div>

								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{submissions.map((submission, index) => (
										<motion.div
											key={submission.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all"
											onClick={() =>
												!hasVoted && mockGameActions.submitVote(submission.id)
											}
										>
											<div className="space-y-2">
												{submission.response_cards.map((card, cardIndex) => (
													<div
														key={cardIndex}
														className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
													>
														{card.text}
													</div>
												))}
											</div>

											{hasVoted && (
												<div className="mt-3 pt-3 border-t border-gray-200">
													<Badge
														variant="secondary"
														className="text-xs"
													>
														{submission.votes} vote
														{submission.votes !== 1 ? "s" : ""}
													</Badge>
												</div>
											)}
										</motion.div>
									))}
								</div>

								{hasVoted && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className="text-center py-8 bg-purple-50 border border-purple-200 rounded-lg"
									>
										<div className="text-purple-600 text-4xl mb-4">🗳️</div>
										<h3 className="text-lg font-semibold text-purple-800 mb-2">
											Vote Submitted Successfully!
										</h3>
										<p className="text-purple-700">
											Waiting for other players to vote...
										</p>
									</motion.div>
								)}
							</div>
						) : (
							<div>
								<h3 className="text-lg font-semibold mb-4">
									🏆 Voting Results
								</h3>

								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{submissions
										.sort((a, b) => b.votes - a.votes)
										.map((submission, index) => {
											const maxVotes = Math.max(
												...submissions.map((s) => s.votes)
											);
											const isWinner =
												submission.votes === maxVotes && submission.votes > 0;
											const player = mockPlayers.find(
												(p) => p.id === submission.player_id
											);

											return (
												<motion.div
													key={submission.id}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: index * 0.1 }}
													className={`p-4 border-2 rounded-lg ${
														isWinner
															? "border-yellow-400 bg-yellow-50"
															: "border-gray-200"
													}`}
												>
													{isWinner && (
														<div className="flex justify-center mb-3">
															<Badge className="bg-yellow-500 text-white">
																🏆 Winner
															</Badge>
														</div>
													)}

													<div className="space-y-2 mb-3">
														{submission.response_cards.map(
															(card, cardIndex) => (
																<div
																	key={cardIndex}
																	className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
																>
																	{card.text}
																</div>
															)
														)}
													</div>

													<div className="flex justify-between items-center text-sm">
														<span className="text-gray-600">
															Submitted by: <strong>{player?.name}</strong>
														</span>
														<Badge variant="secondary">
															{submission.votes} vote
															{submission.votes !== 1 ? "s" : ""}
														</Badge>
													</div>
												</motion.div>
											);
										})}
								</div>
							</div>
						)}
					</div>
				</motion.div>

				{/* Features Showcase */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="mt-8 bg-white rounded-lg shadow-sm p-6"
				>
					<h2 className="text-xl font-semibold mb-4">
						✨ Implemented Features
					</h2>
					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="font-medium text-green-700 mb-2">
								✅ Voting Mechanics
							</h3>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• Anonymous submission display</li>
								<li>• One vote per player per round</li>
								<li>• Real-time vote counting</li>
								<li>• Automatic vote tallying</li>
								<li>• Timer-based auto-submission</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium text-blue-700 mb-2">
								🏆 Winner Determination
							</h3>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• Proper tie-breaking rules</li>
								<li>• Multiple winner support</li>
								<li>• Score calculation</li>
								<li>• Player name reveal</li>
								<li>• Winner indicators</li>
							</ul>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
