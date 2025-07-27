"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import PlayerForm from "@/components/PlayerForm";
import ThemeForm from "@/components/ThemeForm";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import FloatingBackground from "@/components/FloatingBackground";
import useSound from "use-sound";
import { useTypewriter } from "react-simple-typewriter";

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
	const [selectedTheme, setSelectedTheme] = useState("");
	const [players, setPlayers] = useState<string[]>([]);
	const [phase, setPhase] = useState<
		"entry" | "theme" | "name" | "lobby" | "game"
	>("entry");
	const [clickCount, setClickCount] = useState(0);
	const [easterEgg, setEasterEgg] = useState(false);

	const [playWhisper] = useSound("/sounds/whisper.mp3", { volume: 0.4 });

	const [kiroMessage] = useTypewriter({
		words: [
			"Kiro is sharpening the blade…",
			"Blood will be spilled.",
			"You sure you can handle this?",
		],
		loop: 0,
		delaySpeed: 2000,
	});

	const handleReturnHome = () => {
		setPhase("entry");
		setGroupCode(null);
		setPlayerName("");
		setSelectedTheme("");
		setPlayers([]);
		setManualCode("");
		setError("");
		setCopied(false);
		setClickCount(0);
		setEasterEgg(false);
	};

	const handleJoin = async () => {
		// Clear any existing errors
		setError("");

		// Validate input
		if (!manualCode.trim()) {
			setError("Please enter a group code.");
			return;
		}

		if (manualCode.length !== 6) {
			setError("Group code must be exactly 6 characters.");
			return;
		}

		try {
			const { data, error } = await supabase
				.from("rooms")
				.select("*")
				.eq("code", manualCode.toUpperCase())
				.maybeSingle();

			if (error) {
				setError("Failed to check room. Please try again.");
			} else if (!data) {
				setError("Room not found. Please check the code and try again.");
			} else {
				setGroupCode(data.code);
				setError("");
				setPhase("name");
			}
		} catch {
			setError("Network error. Please check your connection and try again.");
		}
	};

	const handleCopy = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	const handleNewGroup = async () => {
		playWhisper();
		const code = nanoid(6).toUpperCase();
		const { error } = await supabase.from("rooms").insert([{ code }]);

		if (error) {
			setError("Failed to create group. Please try again.");
			return;
		}

		setGroupCode(code);
		handleCopy(code);
		setPhase("theme");
		confetti({ spread: 90, particleCount: 150, origin: { y: 0.6 } });
	};

	const handleTaglineClick = () => {
		setClickCount((count) => {
			if (count + 1 === 5) setEasterEgg(true);
			return count + 1;
		});
	};

	if (phase === "theme" && groupCode) {
		return (
			<ThemeForm
				onSubmit={(theme) => {
					setSelectedTheme(theme);
					setPhase("name");
				}}
			/>
		);
	}

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
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
			<FloatingBackground />
			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="text-center p-8 rounded-2xl shadow-xl bg-zinc-800/90 max-w-lg space-y-5 z-10 border border-zinc-700"
			>
				<h1
					style={{ textShadow: "0 0 10px #ff0055aa, 0 0 20px #ff1f4baa" }}
					className="text-5xl font-extrabold text-center bg-gradient-to-r from-red-500 to-pink-500 text-transparent bg-clip-text animate-pulse"
				>
					Deep Cut
				</h1>

				<p
					onClick={handleTaglineClick}
					className="text-zinc-400 italic cursor-pointer select-none"
				>
					The party game where you cut deep — or get cut.
				</p>
				{easterEgg && (
					<p className="text-red-500 text-sm italic animate-pulse">
						👁 Chaos Mode Unlocked. Kiro is watching.
					</p>
				)}

				<div className="space-y-3">
					<input
						type="text"
						value={manualCode}
						onChange={(e) => setManualCode(e.target.value.toUpperCase())}
						maxLength={6}
						placeholder="Enter Group Code (e.g. X4Q7LB)"
						className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center tracking-widest uppercase hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
					/>
					<Button
						onClick={handleJoin}
						className="w-full text-lg transition-all duration-300 hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
					>
						Join the Cut
					</Button>
					{error && <p className="text-red-400 text-sm">{error}</p>}
				</div>

				<div className="relative py-3">
					<hr className="border-zinc-600" />
					<span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-2 text-sm text-zinc-500 bg-zinc-800">
						or
					</span>
				</div>

				<Button
					size="lg"
					className="w-full text-lg transition-all duration-300 hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
					onClick={handleNewGroup}
				>
					Summon Kiro
				</Button>

				<p className="text-xs text-zinc-500 italic mt-2">
					Coming soon: 😈 Dare Mode, 🙏 Confessional, 🕵️ Secret Prompts...
				</p>

				{copied && (
					<p className="text-green-400 text-sm">Code copied to clipboard!</p>
				)}

				{groupCode && phase === "name" && (
					<div className="mt-4 flex items-center justify-center gap-2">
						<span className="text-xl font-mono tracking-widest">
							{groupCode}
						</span>
						<button
							onClick={() => handleCopy(groupCode)}
							className="text-zinc-400 hover:text-white transition hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500 p-1 rounded"
						>
							📋
						</button>
					</div>
				)}

				<p className="text-sm text-zinc-400 mt-4 italic">{kiroMessage}</p>
			</motion.div>
		</main>
	);
}
