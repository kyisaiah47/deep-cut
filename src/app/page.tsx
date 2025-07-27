"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import PlayerForm from "@/components/PlayerForm";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
	const [groupCode, setGroupCode] = useState<string | null>(null);
	const [manualCode, setManualCode] = useState("");
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [playerName, setPlayerName] = useState("");
	const [players, setPlayers] = useState<string[]>([]);
	const [phase, setPhase] = useState<"entry" | "name" | "lobby" | "game">(
		"entry"
	);

	const handleReturnHome = () => {
		setPhase("entry");
		setGroupCode(null);
		setPlayerName("");
		setPlayers([]);
		setManualCode("");
		setError("");
		setCopied(false);
	};

	const handleJoin = async () => {
		if (manualCode.length !== 6) return;

		const { data, error } = await supabase
			.from("rooms")
			.select("*")
			.eq("code", manualCode.toUpperCase())
			.maybeSingle();

		if (error || !data) {
			setError("Room not found. Please check the code.");
		} else {
			setGroupCode(data.code);
			setError("");
			setPhase("name");
		}
	};

	const handleCopy = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Copy failed silently
		}
	};

	const handleNewGroup = async () => {
		const code = nanoid(6).toUpperCase();
		const { error } = await supabase.from("rooms").insert([{ code }]);

		if (error) {
			setError("Failed to create group. Please try again.");
			return;
		}

		setGroupCode(code);
		handleCopy(code);
		setPhase("name");
		confetti({ spread: 90, particleCount: 150, origin: { y: 0.6 } });
	};

	if (phase === "name" && groupCode) {
		return (
			<PlayerForm
				onSubmit={(name) => {
					setPlayerName(name);
					setPhase("lobby");
				}}
			/>
		);
	}

	if (phase === "lobby" && groupCode && playerName) {
		return (
			<Lobby
				groupCode={groupCode}
				playerName={playerName}
				onReady={(players) => {
					setPlayers(players);
					setPhase("game");
				}}
			/>
		);
	}

	if (phase === "game" && groupCode && playerName) {
		return (
			<GameRoom
				groupCode={groupCode}
				playerName={playerName}
				players={players}
				onReturnHome={handleReturnHome}
			/>
		);
	}

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-lg space-y-4"
			>
				<h1 className="text-4xl font-bold">🎭 Join or Create a Group</h1>
				<p className="text-zinc-300">Share or enter a code to play together.</p>

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
		</main>
	);
}
