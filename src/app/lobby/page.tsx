"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreateGameForm } from "@/components/CreateGameFormChaos";
import { JoinGameForm } from "@/components/JoinGameFormChaos";

// Meme-fueled chaos emojis and stickers
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
	"🤡",
	"💩",
	"🍕",
	"🦄",
	"🐸",
	"🔫",
	"💊",
	"🎮",
	"📱",
	"💻",
	"🖥️",
	"⌨️",
	"🖱️",
	"🕹️",
];
const GRAFFITI_WORDS = [
	"EPIC",
	"CHAOS",
	"WILD",
	"INSANE",
	"BOOM",
	"ZAP",
	"POW",
	"YEET",
	"BRUH",
	"SALTY",
	"NOOB",
	"GG",
	"REKT",
	"CRINGE",
];
const MEME_STICKERS = [
	"POGGERS",
	"BASED",
	"SUS",
	"NO CAP",
	"FR FR",
	"PERIODT",
	"SLAY",
	"VIBE CHECK",
	"MAIN CHARACTER",
	"IT'S GIVING",
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
			{/* Chaotic background effects */}
			<div className="absolute inset-0">
				{/* Glitchy neon blobs */}
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-magenta/10 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-blue/5 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>

				{/* Random scribbles and lines */}
				<svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
					<defs>
						<filter id="roughPaper">
							<feTurbulence
								baseFrequency="0.04"
								numOctaves="5"
								result="noise"
								seed="1"
							/>
							<feDisplacementMap
								in="SourceGraphic"
								in2="noise"
								scale="1"
							/>
						</filter>
					</defs>
					{/* Chaotic scribbles */}
					<path
						d="M100,200 Q200,100 300,200 T500,200"
						stroke="#FF3AF2"
						strokeWidth="3"
						fill="none"
						opacity="0.6"
						filter="url(#roughPaper)"
					/>
					<path
						d="M50,300 L150,250 L250,350 L350,300"
						stroke="#00E5FF"
						strokeWidth="2"
						fill="none"
						opacity="0.4"
					/>
					<path
						d="M400,150 Q500,50 600,150 Q700,250 800,150"
						stroke="#B6FF3A"
						strokeWidth="4"
						fill="none"
						opacity="0.5"
					/>
					<circle
						cx="150"
						cy="100"
						r="30"
						stroke="#FFD23A"
						strokeWidth="3"
						fill="none"
						opacity="0.3"
					/>
					<rect
						x="600"
						y="400"
						width="80"
						height="50"
						stroke="#4D7CFF"
						strokeWidth="2"
						fill="none"
						opacity="0.4"
						transform="rotate(15 640 425)"
					/>
				</svg>
			</div>

			{/* Floating chaos emojis */}
			<div className="absolute inset-0 pointer-events-none">
				{chaosElements.map((element) => (
					<motion.div
						key={element.id}
						className="absolute text-2xl select-none"
						style={{
							left: `${element.x}%`,
							top: `${element.y}%`,
							scale: element.scale,
						}}
						animate={{
							y: [-20, 20, -20],
							rotate: [
								element.rotation,
								element.rotation + 360,
								element.rotation,
							],
							opacity: [0.3, 0.8, 0.3],
						}}
						transition={{
							duration: element.duration,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						{element.emoji}
					</motion.div>
				))}
			</div>

			{/* Graffiti words scattered around */}
			<div className="absolute inset-0 pointer-events-none">
				{GRAFFITI_WORDS.map((word, i) => (
					<motion.div
						key={word}
						className="absolute font-display font-black text-neon-magenta/20 text-4xl transform -rotate-12"
						style={{
							left: `${10 + i * 15}%`,
							top: `${20 + i * 10}%`,
							textShadow: "0 0 20px rgba(255, 58, 242, 0.3)",
						}}
						animate={{
							scale: [0.8, 1.2, 0.8],
							opacity: [0.1, 0.3, 0.1],
						}}
						transition={{
							duration: 4 + i,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						{word}
					</motion.div>
				))}
			</div>

			{/* Meme stickers and glitch text overlays */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Meme stickers scattered around */}
				{MEME_STICKERS.map((sticker, i) => (
					<motion.div
						key={sticker}
						className="absolute font-body font-bold text-white bg-neon-magenta/80 px-2 py-1 rounded-lg text-xs transform"
						style={{
							left: `${15 + i * 12}%`,
							top: `${25 + i * 8}%`,
							rotate: `${-15 + i * 6}deg`,
						}}
						animate={{
							scale: [0.8, 1.1, 0.8],
							opacity: [0.6, 1, 0.6],
						}}
						transition={{
							duration: 3 + i,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						{sticker}
					</motion.div>
				))}

				{/* Glitch text overlays */}
				<motion.div
					className="absolute top-1/4 right-10 font-display text-neon-cyan/30 text-lg transform rotate-45"
					animate={{
						opacity: [0, 1, 0],
						scale: [0.5, 1.5, 0.5],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						repeatDelay: 5,
					}}
				>
					ERROR_404_VIBES_NOT_FOUND
				</motion.div>

				<motion.div
					className="absolute bottom-1/3 left-10 font-display text-acid-lime/40 text-sm transform -rotate-12"
					animate={{
						opacity: [0, 0.8, 0],
						x: [-10, 10, -10],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						repeatDelay: 7,
					}}
				>
					MEME_OVERLOAD.EXE
				</motion.div>

				<motion.div
					className="absolute top-1/2 left-1/4 font-display text-sun-yellow/25 text-xs"
					animate={{
						opacity: [0, 1, 0],
						rotate: [0, 360, 0],
					}}
					transition={{
						duration: 4,
						repeat: Infinity,
						repeatDelay: 3,
					}}
				>
					CHAOS_MODE_ACTIVATED
				</motion.div>

				<motion.div
					className="absolute top-3/4 right-1/4 font-display text-electric-blue/35 text-base transform rotate-12"
					animate={{
						opacity: [0, 0.6, 0],
						y: [-5, 5, -5],
					}}
					transition={{
						duration: 2.5,
						repeat: Infinity,
						repeatDelay: 4,
					}}
				>
					LOADING_MAYHEM.GIF
				</motion.div>

				<motion.div
					className="absolute top-10 left-1/2 font-body font-bold text-neon-magenta/40 text-sm transform -rotate-6"
					animate={{
						opacity: [0, 0.8, 0],
						scale: [0.8, 1.2, 0.8],
					}}
					transition={{
						duration: 4,
						repeat: Infinity,
						repeatDelay: 6,
					}}
				>
					BIG MOOD ENERGY
				</motion.div>
			</div>

			{/* Main container - broken rectangle, bleeding chaos */}
			<motion.div
				className="relative z-10 w-full max-w-lg scribble-overflow"
				initial={{ scale: 0.8, rotate: -2 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: "spring", stiffness: 200, damping: 20 }}
			>
				{/* CTRL+LOL Chaotic Branding */}
				<div className="relative mb-8 -mx-8">
					{/* Main CTRL+LOL title bleeding out */}
					<motion.div
						className="tilt-bleed mb-4"
						animate={{
							rotate: [-2, 1, -2],
							x: [-5, 5, -5],
						}}
						transition={{ duration: 4, repeat: Infinity }}
					>
						<div className="flex items-center justify-center gap-2">
							{/* CTRL as glowing keyboard key */}
							<motion.div
								className="relative"
								animate={{
									boxShadow: [
										"0 0 20px rgba(0, 229, 255, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
										"0 0 40px rgba(0, 229, 255, 1), inset 0 2px 8px rgba(255, 255, 255, 0.5)",
										"0 0 20px rgba(0, 229, 255, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
									],
								}}
								transition={{ duration: 2, repeat: Infinity }}
							>
								<div className="bg-gradient-to-b from-surface-dark to-surface-darker border-2 border-neon-cyan rounded-lg px-4 py-2 shadow-lg">
									<span className="punk-heading neon-text-cyan text-3xl">
										CTRL
									</span>
								</div>
								{/* Keyboard key highlight */}
								<div className="absolute top-1 left-1 right-1 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-lg"></div>
							</motion.div>

							{/* Plus symbol */}
							<motion.span
								className="punk-heading neon-text-lime text-4xl"
								animate={{ rotate: [0, 180, 360] }}
								transition={{ duration: 4, repeat: Infinity }}
							>
								+
							</motion.span>

							{/* LOL as neon graffiti */}
							<motion.div
								className="relative"
								animate={{
									textShadow: [
										"0 0 20px rgba(255, 58, 242, 0.8), 2px 2px 0px rgba(0, 0, 0, 0.8)",
										"0 0 40px rgba(255, 58, 242, 1), 3px 3px 0px rgba(0, 0, 0, 1)",
										"0 0 20px rgba(255, 58, 242, 0.8), 2px 2px 0px rgba(0, 0, 0, 0.8)",
									],
								}}
								transition={{ duration: 2, repeat: Infinity }}
							>
								<span className="punk-heading neon-text-magenta text-4xl transform -rotate-3">
									LOL
								</span>
								{/* Graffiti drips */}
								<svg className="absolute inset-0 w-full h-full pointer-events-none">
									<path
										d="M10,80% L10,95% M30,85% L30,100% M50,80% L50,90%"
										stroke="#FF3AF2"
										strokeWidth="2"
										opacity="0.6"
									/>
								</svg>
								{/* Spray paint texture */}
								<div className="absolute inset-0 bg-gradient-radial from-neon-magenta/20 via-transparent to-transparent opacity-50"></div>
							</motion.div>
						</div>

						{/* Multiple graffiti strikes across the whole title */}
						<svg className="absolute inset-0 w-full h-full pointer-events-none">
							<line
								x1="5%"
								y1="45%"
								x2="95%"
								y2="50%"
								stroke="#FF3AF2"
								strokeWidth="4"
								opacity="0.8"
							/>
							<line
								x1="10%"
								y1="55%"
								x2="90%"
								y2="48%"
								stroke="#B6FF3A"
								strokeWidth="2"
								opacity="0.6"
							/>
							<path
								d="M15%,40% Q50%,35% 85%,45%"
								stroke="#FFD23A"
								strokeWidth="3"
								fill="none"
								opacity="0.7"
							/>
						</svg>
					</motion.div>

					{/* Subtitle bleeding right */}
					<motion.div
						className="relative ml-8 -mr-4 transform rotate-1"
						animate={{
							rotate: [1, -0.5, 1],
							x: [0, 3, 0],
						}}
						transition={{ duration: 3, repeat: Infinity }}
					>
						<div className="punk-heading neon-text-magenta text-lg relative bg-surface-darker/80 px-4 py-2 border-l-4 border-neon-magenta">
							MEME ARCADE MAYHEM
							{/* Scribbled decorations */}
							<svg className="absolute -right-6 top-0 w-8 h-full pointer-events-none">
								<path
									d="M2,10% L6,90% M0,30% L8,70%"
									stroke="#B6FF3A"
									strokeWidth="2"
									opacity="0.6"
								/>
							</svg>
						</div>
					</motion.div>

					{/* Tagline bleeding left */}
					<motion.div
						className="relative -ml-6 mt-3 transform -rotate-1"
						animate={{
							rotate: [-1, 0.5, -1],
							x: [0, -2, 0],
						}}
						transition={{ duration: 5, repeat: Infinity }}
					>
						<p className="text-soft-lavender font-body text-sm bg-surface-dark/60 px-3 py-1 border-r-2 border-acid-lime">
							💀 Cards Against Humanity meets neon arcade chaos! 🔥
						</p>
					</motion.div>

					{/* Chaotic floating elements around header */}
					<div className="absolute -top-8 -right-12 text-3xl animate-bounce">
						⚡
					</div>
					<div className="absolute -bottom-4 -left-8 text-2xl animate-pulse">
						🔥
					</div>
					<div className="absolute top-1/2 -right-8 text-xl chaos-spin">💀</div>
					<div className="absolute -top-4 left-1/4 text-lg chaos-float">🎲</div>
				</div>

				{/* Bleeding Tab Navigation */}
				<div className="relative mb-6 -mx-4">
					<div className="bleed-border p-3 transform -rotate-1">
						<div className="flex bg-surface-darker/70 rounded-pill p-2 relative overflow-hidden">
							{/* Glitch effect overlay */}
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-neon-magenta/20 to-transparent"
								animate={{ x: ["-100%", "100%"] }}
								transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
							/>

							<button
								onClick={() => setActiveTab("create")}
								className={`flex-1 py-2 px-4 rounded-pill font-display font-bold uppercase text-xs transition-all duration-300 relative ${
									activeTab === "create"
										? "bg-neon-cyan text-stage shadow-neon-cyan"
										: "text-neon-cyan hover:text-white hover:bg-neon-cyan/20"
								}`}
							>
								⚡ CREATE CHAOS
							</button>
							<button
								onClick={() => setActiveTab("join")}
								className={`flex-1 py-2 px-4 rounded-pill font-display font-bold uppercase text-xs transition-all duration-300 relative ${
									activeTab === "join"
										? "bg-neon-magenta text-stage shadow-neon-magenta"
										: "text-neon-magenta hover:text-white hover:bg-neon-magenta/20"
								}`}
							>
								🎮 JOIN MAYHEM
							</button>
						</div>
					</div>

					{/* Tab bleeding decorations */}
					<div className="absolute -top-2 -left-2 text-lg chaos-spin">🎯</div>
					<div className="absolute -bottom-2 -right-2 text-lg animate-bounce">
						🎪
					</div>
				</div>

				{/* Irregular bleeding form container */}
				<div className="relative -mx-2">
					<motion.div
						className="irregular-section p-6 transform rotate-1"
						animate={{
							rotate: [1, -0.5, 1],
						}}
						transition={{ duration: 6, repeat: Infinity }}
					>
						{/* Bleeding corner chaos */}
						<div className="absolute -top-4 -left-4 text-2xl chaos-float">
							💥
						</div>
						<div className="absolute -top-4 -right-4 text-2xl animate-bounce">
							🎲
						</div>
						<div className="absolute -bottom-4 -left-4 text-2xl chaos-spin">
							👾
						</div>
						<div className="absolute -bottom-4 -right-4 text-2xl animate-pulse">
							😂
						</div>

						{/* Scribbles bleeding out */}
						<svg className="absolute -top-8 -left-8 w-16 h-16 pointer-events-none">
							<path
								d="M2,2 Q8,14 14,2 Q8,10 2,2"
								stroke="#FF3AF2"
								strokeWidth="2"
								fill="none"
								opacity="0.6"
							/>
						</svg>
						<svg className="absolute -bottom-8 -right-8 w-16 h-16 pointer-events-none">
							<circle
								cx="8"
								cy="8"
								r="6"
								stroke="#00E5FF"
								strokeWidth="2"
								fill="none"
								opacity="0.5"
							/>
							<line
								x1="2"
								y1="2"
								x2="14"
								y2="14"
								stroke="#B6FF3A"
								strokeWidth="1"
								opacity="0.7"
							/>
						</svg>

						{activeTab === "create" ? (
							<CreateGameForm onGameCreated={handleGameCreated} />
						) : (
							<JoinGameForm onGameJoined={handleGameJoined} />
						)}
					</motion.div>
				</div>

				{/* Chaotic Footer */}
				<motion.div
					className="mt-4 text-center border-t-2 border-electric-blue/30 pt-3 relative"
					animate={{ rotate: [0, 0.5, 0, -0.5, 0] }}
					transition={{ duration: 5, repeat: Infinity }}
				>
					<p className="text-soft-lavender text-xs font-body relative">
						🎪 GET READY FOR ABSOLUTE CHAOS! 🎪
						{/* Graffiti strike-through on footer */}
						<svg className="absolute inset-0 w-full h-full pointer-events-none">
							<path
								d="M10%,50% Q50%,30% 90%,50%"
								stroke="#FF3AF2"
								strokeWidth="1"
								fill="none"
								opacity="0.4"
							/>
						</svg>
					</p>
					{/* Multiple scribbled arrows */}
					<svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-4 pointer-events-none">
						<path
							d="M2,2 L8,8 L14,2 M8,8 L8,12"
							stroke="#FFD23A"
							strokeWidth="2"
							fill="none"
							opacity="0.6"
						/>
					</svg>
					<svg className="absolute -top-1 left-1/4 w-8 h-6 pointer-events-none">
						<path
							d="M1,3 L4,1 L7,3 M4,1 L4,5"
							stroke="#B6FF3A"
							strokeWidth="1"
							fill="none"
							opacity="0.5"
						/>
					</svg>
					<svg className="absolute -top-1 right-1/4 w-8 h-6 pointer-events-none">
						<path
							d="M1,3 L4,1 L7,3 M4,1 L4,5"
							stroke="#00E5FF"
							strokeWidth="1"
							fill="none"
							opacity="0.5"
						/>
					</svg>
				</motion.div>

				{/* Extra chaos doodles around the form */}
				<div className="absolute -inset-4 pointer-events-none">
					{/* Corner doodles */}
					<motion.div
						className="absolute -top-6 -left-6 text-2xl"
						animate={{ rotate: [0, 360] }}
						transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
					>
						💀
					</motion.div>
					<motion.div
						className="absolute -top-6 -right-6 text-2xl"
						animate={{ scale: [1, 1.3, 1] }}
						transition={{ duration: 2, repeat: Infinity }}
					>
						🔥
					</motion.div>
					<motion.div
						className="absolute -bottom-6 -left-6 text-2xl"
						animate={{ y: [-5, 5, -5] }}
						transition={{ duration: 3, repeat: Infinity }}
					>
						⚡
					</motion.div>
					<motion.div
						className="absolute -bottom-6 -right-6 text-2xl"
						animate={{ rotate: [0, -360] }}
						transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
					>
						🎲
					</motion.div>

					{/* Side doodles */}
					<motion.div
						className="absolute top-1/4 -left-8 text-xl"
						animate={{ x: [-3, 3, -3] }}
						transition={{ duration: 4, repeat: Infinity }}
					>
						👾
					</motion.div>
					<motion.div
						className="absolute top-3/4 -right-8 text-xl"
						animate={{ rotate: [0, 180, 0] }}
						transition={{ duration: 5, repeat: Infinity }}
					>
						😂
					</motion.div>
				</div>
			</motion.div>

			{/* Extra chaotic particles */}
			<div className="absolute inset-0 pointer-events-none">
				{Array.from({ length: 15 }).map((_, i) => (
					<motion.div
						key={`particle-${i}`}
						className="absolute w-1 h-1 bg-neon-magenta rounded-full"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
						}}
						animate={{
							scale: [0, 2, 0],
							opacity: [0, 1, 0],
						}}
						transition={{
							duration: 2 + Math.random() * 2,
							repeat: Infinity,
							delay: Math.random() * 3,
						}}
					/>
				))}
			</div>
		</div>
	);
}
