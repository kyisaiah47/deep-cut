"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SubmissionInterface } from "@/components/SubmissionInterface";
import { SubmissionStatusIndicator } from "@/components/SubmissionStatusIndicator";
import { Timer } from "@/components/Timer";
import { Card, GameState, Player } from "@/types/game";
import { GAME_PHASES, CARD_TYPES } from "@/lib/constants";

// Mock data for demonstration
const mockGameState: GameState = {
	id: "demo-game",
	room_code: "DEMO01",
	phase: "submission" as const,
	current_round: 1,
	target_score: 7,
	max_players: 4,
	submission_timer: 60,
	voting_timer: 30,
	host_id: "player-1",
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

const mockPlayers: Player[] = [
	{
		id: "player-1",
		game_id: "demo-game",
		name: "Alice",
		score: 2,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
	{
		id: "player-2",
		game_id: "demo-game",
		name: "Bob",
		score: 1,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
	{
		id: "player-3",
		game_id: "demo-game",
		name: "Charlie",
		score: 3,
		is_connected: false,
		joined_at: new Date().toISOString(),
	},
];

const mockCards: Card[] = [
	{
		id: "prompt-1",
		game_id: "demo-game",
		round_number: 1,
		type: "prompt",
		text: "The best thing about being an adult is ___.",
		player_id: "player-1",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-1",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Paying taxes",
		player_id: "player-1",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-2",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Staying up late without consequences",
		player_id: "player-1",
		created_at: new Date().toISOString(),
	},
	{
		id: "response-3",
		game_id: "demo-game",
		round_number: 1,
		type: "response",
		text: "Having no idea what you're doing",
		player_id: "player-1",
		created_at: new Date().toISOString(),
	},
];

// Mock context provider for demo
const MockGameProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [submissions, setSubmissions] = useState<any[]>([]);
	const [gamePhase, setGamePhase] = useState<GameState["phase"]>("submission");

	// Mock context value
	const mockContextValue = {
		gameState: { ...mockGameState, phase: gamePhase },
		players: mockPlayers,
		cards: mockCards,
		submissions,
		loading: false,
		error: null,
		isConnected: true,
		currentPlayer: mockPlayers[0],
		isHost: true,
		updateGamePhase: async (phase: GameState["phase"]) => {
			setGamePhase(phase);
		},
		refetchGameState: async () => {},
		broadcastEvent: async () => {},
		transferHost: async () => {},
		handlePlayerLeave: async () => {},
		updateConnectionStatus: async () => {},
		canStartGame: false,
		isGameActive: true,
		currentRoundCards: mockCards,
		playerSubmissions: submissions.filter(
			(sub) => sub.player_id === "player-1"
		),
		connectedPlayers: mockPlayers.filter((p) => p.is_connected),
		disconnectedPlayers: mockPlayers.filter((p) => !p.is_connected),
	};

	// Mock the context
	React.createContext(mockContextValue);

	return <div>{children}</div>;
};

export default function SubmissionDemoPage() {
	const [timerActive, setTimerActive] = useState(true);
	const [timerDuration, setTimerDuration] = useState(60);

	const handleTimerExpire = () => {
		console.log("Timer expired!");
		setTimerActive(false);
	};

	const resetTimer = () => {
		setTimerActive(true);
		setTimerDuration(60);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4 space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center"
				>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Card Submission System Demo
					</h1>
					<p className="text-gray-600">
						Demonstration of the real-time card submission interface
					</p>
				</motion.div>

				{/* Demo Controls */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
					<div className="flex flex-wrap gap-4">
						<button
							onClick={resetTimer}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
						>
							Reset Timer
						</button>
						<button
							onClick={() => setTimerDuration(10)}
							className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
						>
							Set 10s Timer
						</button>
						<div className="flex items-center space-x-2">
							<span className="text-sm text-gray-600">Timer Duration:</span>
							<input
								type="number"
								value={timerDuration}
								onChange={(e) =>
									setTimerDuration(parseInt(e.target.value) || 60)
								}
								className="w-20 px-2 py-1 border rounded text-sm"
								min="5"
								max="300"
							/>
							<span className="text-sm text-gray-600">seconds</span>
						</div>
					</div>
				</motion.div>

				{/* Timer Component Demo */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">Timer Component</h2>
					<div className="flex justify-center">
						<Timer
							duration={timerDuration}
							onExpire={handleTimerExpire}
							isActive={timerActive}
							label="Submission Time Remaining"
							showProgress={true}
						/>
					</div>
					{!timerActive && (
						<div className="text-center mt-4">
							<p className="text-red-600 font-medium">Timer Expired!</p>
						</div>
					)}
				</motion.div>

				{/* Submission Status Indicator Demo */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-white rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">Submission Status</h2>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Full status indicator */}
						<div>
							<h3 className="text-lg font-medium mb-3">Full Status</h3>
							<MockGameProvider>
								<SubmissionStatusIndicator
									showPlayerNames={true}
									compact={false}
								/>
							</MockGameProvider>
						</div>

						{/* Compact status indicator */}
						<div>
							<h3 className="text-lg font-medium mb-3">Compact Status</h3>
							<MockGameProvider>
								<SubmissionStatusIndicator
									showPlayerNames={false}
									compact={true}
								/>
							</MockGameProvider>
						</div>
					</div>
				</motion.div>

				{/* Mock Cards Display */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-white rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">Sample Cards</h2>
					<div className="space-y-6">
						{/* Prompt Card */}
						<div>
							<h3 className="text-lg font-medium mb-3 text-blue-600">
								Prompt Card
							</h3>
							<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
								<p className="text-blue-900 font-medium">
									{
										mockCards.find((card) => card.type === CARD_TYPES.PROMPT)
											?.text
									}
								</p>
							</div>
						</div>

						{/* Response Cards */}
						<div>
							<h3 className="text-lg font-medium mb-3 text-green-600">
								Response Cards (Select One)
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{mockCards
									.filter((card) => card.type === CARD_TYPES.RESPONSE)
									.map((card) => (
										<div
											key={card.id}
											className="bg-green-50 border-2 border-green-200 rounded-lg p-4 hover:border-green-400 cursor-pointer transition-colors"
										>
											<p className="text-green-900">{card.text}</p>
										</div>
									))}
							</div>
						</div>
					</div>
				</motion.div>

				{/* Features List */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-white rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">
						Submission System Features
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h3 className="text-lg font-medium mb-3 text-blue-600">
								Core Features
							</h3>
							<ul className="space-y-2 text-gray-700">
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Real-time submission tracking
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Countdown timer with visual feedback
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Card selection validation
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Automatic submission on timeout
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Player status indicators
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-lg font-medium mb-3 text-purple-600">
								Advanced Features
							</h3>
							<ul className="space-y-2 text-gray-700">
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Duplicate submission prevention
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Connection status monitoring
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Smooth animations and transitions
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Responsive design for mobile
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									Error handling and recovery
								</li>
							</ul>
						</div>
					</div>
				</motion.div>

				{/* Implementation Notes */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="bg-gray-100 rounded-lg p-6 border"
				>
					<h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
					<div className="prose prose-gray max-w-none">
						<p className="text-gray-700 mb-4">
							This submission system implements all requirements from task 9:
						</p>
						<ul className="text-gray-700 space-y-1">
							<li>
								<strong>Submission interface:</strong> SubmissionInterface
								component with card selection and validation
							</li>
							<li>
								<strong>Timer system:</strong> Timer component with countdown
								display and automatic submission
							</li>
							<li>
								<strong>Real-time updates:</strong> SubmissionStatusIndicator
								shows live submission status
							</li>
							<li>
								<strong>Validation:</strong> Comprehensive submission validation
								with error handling
							</li>
							<li>
								<strong>Storage system:</strong> API routes and database
								integration for submission storage
							</li>
						</ul>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
