"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreateGameForm } from "@/components/CreateGameForm";
import { JoinGameForm } from "@/components/JoinGameForm";

// Chaotic floating emojis and icons
const CHAOS_EMOJIS = [
	"🔥",
	"💀",
	"😂",
	"⚡",
	"👾",
	"🎲",
	"💥",
	"🤖",
	"🎪",
	"🎯",
	"🚀",
	"💫",
	"🌟",
	"⭐",
	"🎊",
	"🎉",
];
const GRAFFITI_WORDS = [
	"EPIC",
	"CHAOS",
	"WILD",
	"INSANE",
	"BOOM",
	"ZAP",
	"POW",
];

export default function LobbyPage() {
	const [activeTab, setActiveTab] = useState<"create" | "join">("create");
	const [chaosElements, setChaosElements] = useState<
		Array<{
			id: number;
			emoji: string;
			x: number;
			y: number;
			rotation: number;
			scale: number;
			duration: number;
		}>
	>([]);
	const router = useRouter();

	// Generate chaotic floating elements
	useEffect(() => {
		const elements = Array.from({ length: 30 }, (_, i) => ({
			id: i,
			emoji: CHAOS_EMOJIS[Math.floor(Math.random() * CHAOS_EMOJIS.length)],
			x: Math.random() * 100,
			y: Math.random() * 100,
			rotation: Math.random() * 360,
			scale: 0.5 + Math.random() * 1.5,
			duration: 3 + Math.random() * 4,
		}));
		setChaosElements(elements);
	}, []);

	const handleGameCreated = (roomCode: string, playerId: string) => {
		// Navigate to game room
		router.push(`/game/${roomCode}?playerId=${playerId}`);
	};

	const handleGameJoined = (roomCode: string, playerId: string) => {
		// Navigate to game room
		router.push(`/game/${roomCode}?playerId=${playerId}`);
	};

	return (
		<div className="min-h-screen bg-stage flex items-center justify-center p-4 relative overflow-hidden">
			{/* Neon background effects */}
			<div className="absolute inset-0">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-magenta/10 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-blue/5 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			<div className="relative z-10 bg-surface-dark/80 backdrop-blur-neon border-2 border-neon-cyan rounded-arcade shadow-neon-cyan p-8 w-full max-w-lg">
				<div className="text-center mb-8">
					<h1 className="neon-heading neon-text-cyan text-5xl mb-4 animate-arcade-flicker">
						NEON CARDS
					</h1>
					<div className="neon-heading neon-text-magenta text-lg mb-2">
						ARCADE GAME SHOW
					</div>
					<p className="text-soft-lavender font-body">
						Create hilarious combinations with AI-generated cards
					</p>
				</div>

				{/* Neon Tab Navigation */}
				<div className="flex mb-8 bg-surface-darker/50 rounded-pill p-2 border border-electric-blue/30">
					<button
						onClick={() => setActiveTab("create")}
						className={`flex-1 py-3 px-6 rounded-pill font-display font-bold uppercase text-sm transition-all duration-300 ${
							activeTab === "create"
								? "bg-neon-cyan text-stage shadow-neon-cyan"
								: "text-neon-cyan hover:text-white hover:bg-neon-cyan/20"
						}`}
					>
						⚡ Create Game
					</button>
					<button
						onClick={() => setActiveTab("join")}
						className={`flex-1 py-3 px-6 rounded-pill font-display font-bold uppercase text-sm transition-all duration-300 ${
							activeTab === "join"
								? "bg-neon-magenta text-stage shadow-neon-magenta"
								: "text-neon-magenta hover:text-white hover:bg-neon-magenta/20"
						}`}
					>
						🎮 Join Game
					</button>
				</div>

				{/* Form Content */}
				<div className="space-y-6">
					{activeTab === "create" ? (
						<CreateGameForm onGameCreated={handleGameCreated} />
					) : (
						<JoinGameForm onGameJoined={handleGameJoined} />
					)}
				</div>

				{/* Neon Footer */}
				<div className="mt-8 text-center border-t border-electric-blue/30 pt-6">
					<p className="text-soft-lavender text-sm font-body">
						🎪 Gather your friends and get ready to laugh! 🎪
					</p>
				</div>
			</div>

			{/* Floating neon particles */}
			<div className="absolute inset-0 pointer-events-none">
				{Array.from({ length: 20 }).map((_, i) => (
					<div
						key={i}
						className="absolute w-2 h-2 bg-neon-cyan rounded-full animate-pulse"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 2}s`,
						}}
					/>
				))}
			</div>
		</div>
	);
}
