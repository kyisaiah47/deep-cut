"use client";

// Deep Cut Game - Initial Setup
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
	const [gameStarted, setGameStarted] = useState(false);

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			{!gameStarted ? (
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-lg"
				>
					<h1 className="text-4xl font-bold mb-4">🎭 Welcome to Deep Cut</h1>
					<p className="mb-6 text-zinc-300">
						The chaotic party game powered by Kiro. Submit, vote, and laugh
						until your vibe shifts.
					</p>
					<Button
						size="lg"
						onClick={() => setGameStarted(true)}
					>
						Start Game
					</Button>
				</motion.div>
			) : (
				<GameRoom />
			)}
		</main>
	);
}

function GameRoom() {
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const players = ["Player 1", "Player 2", "Player 3"];
	const prompt = "Invent a new law that only applies to your group.";

	const handleSubmit = (player: string, answer: string) => {
		setSubmissions((prev) => ({ ...prev, [player]: answer }));
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4 }}
			className="w-full max-w-4xl p-6"
		>
			<h2 className="text-3xl font-semibold mb-4">Round 1: Classic Mode</h2>
			<p className="text-lg mb-6 text-zinc-300">{prompt}</p>

			<div className="grid gap-6">
				{players.map((player) => (
					<PlayerSubmission
						key={player}
						player={player}
						onSubmit={(answer) => handleSubmit(player, answer)}
						disabled={!!submissions[player]}
					/>
				))}
			</div>

			{Object.keys(submissions).length === players.length && (
				<div className="mt-8 bg-zinc-800 p-4 rounded-xl">
					<h3 className="text-xl font-semibold mb-2">Submissions</h3>
					<ul className="list-disc list-inside text-zinc-200 space-y-1">
						{players.map((p) => (
							<li key={p}>
								<strong>{p}:</strong> {submissions[p]}
							</li>
						))}
					</ul>
				</div>
			)}
		</motion.div>
	);
}

function PlayerSubmission({
	player,
	onSubmit,
	disabled,
}: {
	player: string;
	onSubmit: (answer: string) => void;
	disabled: boolean;
}) {
	const [input, setInput] = useState("");

	return (
		<div className="bg-zinc-700 p-4 rounded-xl">
			<h4 className="text-lg font-medium text-white mb-2">{player}</h4>
			<input
				type="text"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				disabled={disabled}
				placeholder="Enter your answer..."
				className="w-full p-2 rounded bg-zinc-800 text-white outline-none disabled:opacity-50"
			/>
			<Button
				className="mt-2"
				onClick={() => {
					if (input.trim()) {
						onSubmit(input.trim());
						setInput("");
					}
				}}
				disabled={disabled}
			>
				Submit
			</Button>
		</div>
	);
}
