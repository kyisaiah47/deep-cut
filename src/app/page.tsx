"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const test = async () => {
	const { data: room, error: roomErr } = await supabase
		.from("rooms")
		.insert([{ code: "XYZ789" }]);

	const { data: player, error: playerErr } = await supabase
		.from("players")
		.insert([{ room_code: "XYZ789", name: "TestPlayer" }]);

	console.log("Room result:", room, roomErr);
	console.log("Player result:", player, playerErr);
};

// test();

export default function Home() {
	const [groupCode, setGroupCode] = useState<string | null>(null);
	const [manualCode, setManualCode] = useState("");
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [playerName, setPlayerName] = useState("");
	const [showNamePrompt, setShowNamePrompt] = useState(false);

	const handleJoin = async () => {
		if (manualCode.length !== 6) return;

		const { data } = await supabase
			.from("rooms")
			.select("*")
			.eq("code", manualCode.toUpperCase())
			.single();

		if (data) {
			setGroupCode(manualCode.toUpperCase());
			setError("");
			setShowNamePrompt(true);
		} else {
			setError("Room not found. Please check the code.");
		}
	};

	const handleCopy = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Copy failed", err);
		}
	};

	const handleNewGroup = async () => {
		const code = nanoid(6).toUpperCase();
		await supabase.from("rooms").insert([{ code }]);
		setGroupCode(code);
		handleCopy(code);
		setShowNamePrompt(true);
		confetti({ spread: 90, particleCount: 150, origin: { y: 0.6 } });
	};

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			{!groupCode ? (
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-lg space-y-4"
				>
					<h1 className="text-4xl font-bold">🎭 Join or Create a Group</h1>
					<p className="text-zinc-300">
						Share or enter a code to play together.
					</p>

					<div className="space-y-2">
						<input
							type="text"
							value={manualCode}
							onChange={(e) => setManualCode(e.target.value.toUpperCase())}
							maxLength={6}
							placeholder="Enter Code (e.g. X4Q7LB)"
							className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center tracking-widest uppercase"
						/>
						<Button
							onClick={handleJoin}
							className="w-full"
						>
							Join Group
						</Button>
						{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
					</div>

					<div className="relative py-3">
						<hr className="border-zinc-600" />
						<span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-2 text-sm text-zinc-500 bg-zinc-800">
							or
						</span>
					</div>

					<Button
						size="lg"
						className="w-full"
						onClick={handleNewGroup}
					>
						Generate New Group
					</Button>

					{copied && (
						<p className="text-green-400 text-sm">Code copied to clipboard!</p>
					)}
				</motion.div>
			) : showNamePrompt ? (
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-md w-full"
				>
					<h2 className="text-2xl font-semibold mb-4">Enter Your Name</h2>
					<input
						type="text"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						placeholder="Your name..."
						className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center"
					/>
					<Button
						className="mt-4 w-full"
						onClick={() => setShowNamePrompt(false)}
						disabled={!playerName.trim()}
					>
						Continue
					</Button>
				</motion.div>
			) : (
				<GameRoom
					groupCode={groupCode}
					playerName={playerName}
				/>
			)}
		</main>
	);
}

function GameRoom({
	groupCode,
	playerName,
}: {
	groupCode: string;
	playerName: string;
}) {
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);
	const players = ["Player 1", "Player 2", "Player 3"];
	const prompt = "Invent a new law that only applies to your group.";

	const handleSubmit = (player: string, answer: string) => {
		const updated = { ...submissions, [player]: answer };
		setSubmissions(updated);
		if (Object.keys(updated).length === players.length) {
			const entries = Object.entries(updated).map(([id, text]) => ({
				id,
				text,
			}));
			setShuffledEntries(entries.sort(() => Math.random() - 0.5));
		}
	};

	const handleVote = (voter: string, voteFor: string) => {
		setVotes((prev) => ({ ...prev, [voter]: voteFor }));
	};

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return tally[id] > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4 }}
			className="w-full max-w-4xl p-6"
		>
			<h2 className="text-2xl font-semibold">Welcome, {playerName}!</h2>
			<h2 className="text-2xl font-semibold mb-2">
				Group Code:{" "}
				<span className="font-mono bg-zinc-700 px-2 py-1 rounded text-yellow-300">
					{groupCode}
				</span>
			</h2>
			<h3 className="text-3xl font-semibold mb-4 mt-2">
				Round 1: Classic Mode
			</h3>
			<p className="text-lg mb-6 text-zinc-300">{prompt}</p>

			{Object.keys(submissions).length < players.length ? (
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
			) : Object.keys(votes).length < players.length ? (
				<div className="space-y-6">
					{players.map((player) => (
						<VoteSection
							key={player}
							player={player}
							entries={shuffledEntries.filter((e) => e.id !== player)}
							onVote={(voteFor) => handleVote(player, voteFor)}
							disabled={!!votes[player]}
						/>
					))}
				</div>
			) : (
				<div className="mt-8 bg-zinc-800 p-6 rounded-xl">
					<h3 className="text-2xl font-bold mb-2">🏆 Winner: {winnerId}</h3>
					<p className="text-zinc-300 mb-4 italic">"{submissions[winnerId]}"</p>
					<h4 className="text-lg font-semibold mt-4 mb-2">Final Votes</h4>
					<ul className="text-zinc-200 space-y-1">
						{players.map((p) => (
							<li key={p}>
								{p} voted for <strong>{votes[p]}</strong>
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

function VoteSection({
	player,
	entries,
	onVote,
	disabled,
}: {
	player: string;
	entries: { id: string; text: string }[];
	onVote: (id: string) => void;
	disabled: boolean;
}) {
	const [selected, setSelected] = useState("");

	return (
		<div className="bg-zinc-700 p-4 rounded-xl">
			<h4 className="text-lg font-medium text-white mb-2">{player}'s Vote</h4>
			<div className="space-y-2">
				{entries.map((entry) => (
					<label
						key={entry.id}
						className="flex items-center gap-2 text-white"
					>
						<input
							type="radio"
							value={entry.id}
							checked={selected === entry.id}
							onChange={() => setSelected(entry.id)}
							disabled={disabled}
						/>
						<span className="italic">"{entry.text}"</span>
					</label>
				))}
			</div>
			<Button
				className="mt-2"
				onClick={() => selected && onVote(selected)}
				disabled={disabled || !selected}
			>
				Vote
			</Button>
		</div>
	);
}
