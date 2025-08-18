"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/ui/button";
import { NeonTimer } from "@/components/NeonTimer";
import { NeonScoreboard } from "@/components/NeonScoreboard";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { SlotMachineReveal } from "@/components/SlotMachineReveal";

export default function NeonDemoPage() {
	const [showConfetti, setShowConfetti] = useState(false);
	const [isTimerActive, setIsTimerActive] = useState(false);
	const [isRevealing, setIsRevealing] = useState(false);

	const demoCards = [
		{
			id: "1",
			text: "A robot that only speaks in haikus",
			type: "response" as const,
			game_id: "demo",
			round_number: 1,
			created_at: new Date().toISOString(),
		},
		{
			id: "2",
			text: "The most awkward superhero power",
			type: "prompt" as const,
			game_id: "demo",
			round_number: 1,
			created_at: new Date().toISOString(),
		},
		{
			id: "3",
			text: "Something you'd find in a mad scientist's fridge",
			type: "response" as const,
			game_id: "demo",
			round_number: 1,
			created_at: new Date().toISOString(),
		},
		{
			id: "4",
			text: "The worst possible wedding gift",
			type: "response" as const,
			game_id: "demo",
			round_number: 1,
			created_at: new Date().toISOString(),
		},
	];

	const demoPlayers = [
		{ id: "1", name: "NeonMaster", score: 15, previousScore: 12 },
		{ id: "2", name: "ArcadeKing", score: 12, previousScore: 10 },
		{ id: "3", name: "CyberPlayer", score: 8, previousScore: 8 },
		{ id: "4", name: "RetroGamer", score: 5, previousScore: 3 },
	];

	return (
		<div className="min-h-screen bg-stage p-8">
			<ConfettiBurst isActive={showConfetti} />

			<div className="max-w-6xl mx-auto space-y-12">
				{/* Header */}
				<div className="text-center space-y-4">
					<div className="flex items-center justify-center gap-4">
						<div className="keyboard-key px-6 py-3 rounded-lg">
							<span className="punk-heading neon-text-cyan text-4xl">CTRL</span>
						</div>
						<span className="punk-heading neon-text-lime text-5xl">+</span>
						<span className="punk-heading graffiti-text text-5xl">LOL</span>
					</div>
					<h1 className="punk-heading neon-text-magenta text-3xl">
						MEME ARCADE DEMO
					</h1>
					<p className="text-soft-lavender font-body text-xl">
						Experience the chaotic meme-fueled mayhem! 💀🔥
					</p>
				</div>

				{/* Button Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-magenta text-2xl">
						🎮 BUTTON STYLES
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Button
							variant="neon"
							neonColor="cyan"
						>
							Neon Cyan
						</Button>
						<Button
							variant="neon"
							neonColor="magenta"
						>
							Neon Magenta
						</Button>
						<Button
							variant="neon"
							neonColor="blue"
						>
							Electric Blue
						</Button>
						<Button variant="arcade">Arcade Special</Button>
					</div>
				</section>

				{/* Card Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-lime text-2xl">
						🃏 NEON CARDS
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{demoCards.map((card, index) => (
							<Card
								key={card.id}
								card={card}
								isSelected={index === 0}
								isSelectable={true}
								animationDelay={index * 0.1}
							/>
						))}
					</div>
				</section>

				{/* Timer Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-blue text-2xl">
						⏱️ NEON TIMERS
					</h2>
					<div className="flex justify-center items-center space-x-8">
						<div className="text-center space-y-4">
							<NeonTimer
								duration={30}
								isActive={isTimerActive}
								color="cyan"
								onComplete={() => setIsTimerActive(false)}
							/>
							<Button
								variant="outline"
								neonColor="cyan"
								onClick={() => setIsTimerActive(!isTimerActive)}
							>
								{isTimerActive ? "Stop" : "Start"} Timer
							</Button>
						</div>
					</div>
				</section>

				{/* Scoreboard Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-yellow text-2xl">
						🏆 NEON SCOREBOARD
					</h2>
					<div className="max-w-md mx-auto">
						<NeonScoreboard
							players={demoPlayers}
							currentPlayerId="1"
							targetScore={20}
							title="LEADERBOARD"
						/>
					</div>
				</section>

				{/* Slot Machine Reveal */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-cyan text-2xl">
						🎰 SLOT MACHINE REVEAL
					</h2>
					<div className="space-y-4">
						<div className="text-center">
							<Button
								variant="neon"
								neonColor="magenta"
								onClick={() => setIsRevealing(!isRevealing)}
							>
								{isRevealing ? "Stop" : "Start"} Reveal
							</Button>
						</div>
						<SlotMachineReveal
							cards={demoCards}
							isRevealing={isRevealing}
							onRevealComplete={() => setIsRevealing(false)}
						/>
					</div>
				</section>

				{/* Effects Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-magenta text-2xl">
						🎉 SPECIAL EFFECTS
					</h2>
					<div className="text-center space-y-4">
						<Button
							variant="arcade"
							onClick={() => {
								setShowConfetti(true);
								setTimeout(() => setShowConfetti(false), 3000);
							}}
						>
							🎊 Trigger Confetti
						</Button>
					</div>
				</section>

				{/* Typography Showcase */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-lime text-2xl">
						✨ NEON TYPOGRAPHY
					</h2>
					<div className="space-y-4 text-center">
						<div className="neon-heading neon-text-cyan text-4xl">
							NEON CYAN HEADING
						</div>
						<div className="neon-heading neon-text-magenta text-3xl">
							NEON MAGENTA TITLE
						</div>
						<div className="neon-heading neon-text-blue text-2xl">
							ELECTRIC BLUE TEXT
						</div>
						<div className="neon-heading neon-text-lime text-xl">
							ACID LIME ACCENT
						</div>
						<div className="text-soft-lavender font-body text-lg">
							Soft lavender body text for readability
						</div>
					</div>
				</section>

				{/* Color Palette */}
				<section className="space-y-6">
					<h2 className="neon-heading neon-text-cyan text-2xl">
						🎨 COLOR PALETTE
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="bg-neon-cyan h-20 rounded-arcade flex items-center justify-center text-stage font-display font-bold">
							NEON CYAN
						</div>
						<div className="bg-neon-magenta h-20 rounded-arcade flex items-center justify-center text-stage font-display font-bold">
							NEON MAGENTA
						</div>
						<div className="bg-electric-blue h-20 rounded-arcade flex items-center justify-center text-white font-display font-bold">
							ELECTRIC BLUE
						</div>
						<div className="bg-acid-lime h-20 rounded-arcade flex items-center justify-center text-stage font-display font-bold">
							ACID LIME
						</div>
						<div className="bg-sun-yellow h-20 rounded-arcade flex items-center justify-center text-stage font-display font-bold">
							SUN YELLOW
						</div>
						<div className="bg-soft-lavender h-20 rounded-arcade flex items-center justify-center text-stage font-display font-bold">
							SOFT LAVENDER
						</div>
						<div className="bg-surface-dark h-20 rounded-arcade flex items-center justify-center text-white font-display font-bold border-2 border-neon-cyan">
							SURFACE DARK
						</div>
						<div className="bg-stage h-20 rounded-arcade flex items-center justify-center text-white font-display font-bold border-2 border-electric-blue">
							STAGE BG
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
