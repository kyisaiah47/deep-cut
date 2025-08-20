"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import PlayerForm from "@/components/PlayerForm";
import ThemeForm from "@/components/ThemeForm";
import KiroIntro from "@/components/KiroIntro";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";
import FloatingBackground from "@/components/FloatingBackground";
import useSound from "use-sound";
import { useTypewriter } from "react-simple-typewriter";
import { Syne } from "next/font/google";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const syne = Syne({ subsets: ["latin"], weight: ["800"] });

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
		"entry" | "theme" | "kiro-intro" | "name" | "lobby" | "game"
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
				.eq("room_code", manualCode.toUpperCase())
				.maybeSingle();

			console.log("Room data:", data);
			if (error) {
				setError("Failed to check room. Please try again.");
			} else if (!data) {
				setError("Room not found. Please check the code and try again.");
			} else {
				setGroupCode(data.room_code);
				// Set the theme from the database if it exists
				if (data.theme) {
					setSelectedTheme(data.theme);
				}
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
		const { error } = await supabase
			.from("rooms")
			.insert([{ room_code: code }]);

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
				onSubmit={async (theme) => {
					// First verify the room exists
					const { data: roomCheck } = await supabase
						.from("rooms")
						.select("room_code")
						.eq("room_code", groupCode)
						.maybeSingle();

					if (!roomCheck) {
						throw new Error("Room not found. Please try creating a new room.");
					}

					// Save theme to database
					const { error } = await supabase
						.from("rooms")
						.update({ theme })
						.eq("room_code", groupCode);

					if (error) {
						console.error("Failed to save theme:", error);
						throw new Error("Failed to save theme to database");
					}

					setSelectedTheme(theme);
					setPhase("kiro-intro");
				}}
			/>
		);
	}

	if (phase === "kiro-intro" && groupCode && selectedTheme) {
		return (
			<KiroIntro
				theme={selectedTheme}
				onContinue={() => setPhase("name")}
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
				selectedTheme={selectedTheme}
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
				theme={selectedTheme}
				onReturnHome={handleReturnHome}
			/>
		);
	}

	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
			<FloatingBackground />

			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.6 }}
				className="text-center mb-8"
			>
				<h1
					className={`${syne.className} text-5xl tracking-tight sm:text-6xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]`}
				>
					🎭 Deep Cut 💬
				</h1>
				<p className="mt-2 text-sm sm:text-base text-zinc-400 italic">
					The game starts where the truth ends.
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="text-center p-8 rounded-2xl shadow-xl bg-zinc-800/90 max-w-lg space-y-5 z-10 border border-zinc-700"
			>
				<p
					onClick={handleTaglineClick}
					className="text-zinc-400 italic cursor-pointer select-none"
				>
					The party game where you cut deep — or get cut.
				</p>
				{easterEgg && (
					<p className="text-red-500 text-sm italic animate-pulse">
						👁 Kiro is watching.
					</p>
				)}

				<div className="space-y-3">
					<div className="flex flex-col items-center mt-6">
						<p className="mb-3 text-sm text-zinc-400 italic tracking-wide">
							Paste your room code to enter the abyss.
						</p>

						<InputOTP
							maxLength={6}
							value={manualCode}
							onChange={(e) => setManualCode(e.toUpperCase())}
							className="flex gap-3 sm:gap-4"
						>
							<InputOTPGroup className="flex gap-3 sm:gap-4">
								{[...Array(6)].map((_, i) => (
									<InputOTPSlot
										key={i}
										index={i}
										className={cn(
											"w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black",
											"rounded-lg bg-zinc-900 text-white border border-zinc-700",
											"focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500",
											"focus:shadow-[0_0_15px_rgba(168,85,247,0.5)]",
											"transition-all duration-200 ease-in-out",
											"hover:scale-[1.05] hover:border-fuchsia-500"
										)}
									/>
								))}
							</InputOTPGroup>
						</InputOTP>
					</div>

					{/* <input
						type="text"
						value={manualCode}
						onChange={(e) => setManualCode(e.target.value.toUpperCase())}
						maxLength={6}
						placeholder="Enter Group Code (e.g. X4Q7LB)"
						className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center tracking-widest uppercase hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
					/> */}

					<motion.button
						whileHover={{
							scale: 1.03,
							rotate: [-0.5, 0.5, -0.5],
							transition: { repeat: Infinity, duration: 0.3 },
						}}
						onClick={handleJoin}
						className="relative w-full px-6 py-3 font-bold text-white rounded-md bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-500 shadow-[0_0_20px_rgba(180,0,255,0.5)]"
					>
						<span className={`relative z-10 ${syne.className} text-sm`}>
							🎭 Join the Cut
						</span>
						<div className="absolute inset-0 rounded-md bg-black opacity-30 blur-sm animate-pulse z-0" />
					</motion.button>

					{error && <p className="text-red-400 text-sm">{error}</p>}
				</div>

				<div className="relative py-3">
					<hr className="border-zinc-600" />
					<span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-2 text-sm text-zinc-500 bg-zinc-800">
						or
					</span>
				</div>

				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleNewGroup}
					className="relative px-6 py-3 font-bold text-white rounded-md bg-gradient-to-r from-red-700 via-orange-600 to-yellow-500 shadow-[0_0_20px_rgba(255,50,0,0.6)]"
				>
					<span className={`relative z-10 ${syne.className} text-sm`}>
						🔥 Summon Kiro 🔥
					</span>
					<div className="absolute inset-0 rounded-md bg-black opacity-30 blur-sm animate-pulse z-0" />
				</motion.button>

				{/* <Button
					size="lg"
					className="w-full text-lg transition-all duration-300 hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
				>
					Summon Kiro
				</Button> */}

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
