import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card as CardType } from "@/types/game";

interface SlotMachineRevealProps {
	cards: CardType[];
	isRevealing: boolean;
	onRevealComplete?: () => void;
	revealDelay?: number;
	className?: string;
}

export function SlotMachineReveal({
	cards,
	isRevealing,
	onRevealComplete,
	revealDelay = 200,
	className = "",
}: SlotMachineRevealProps) {
	const [revealedCards, setRevealedCards] = useState<CardType[]>([]);
	const [currentRevealIndex, setCurrentRevealIndex] = useState(0);

	useEffect(() => {
		if (!isRevealing) {
			setRevealedCards([]);
			setCurrentRevealIndex(0);
			return;
		}

		if (currentRevealIndex >= cards.length) {
			onRevealComplete?.();
			return;
		}

		const timer = setTimeout(() => {
			setRevealedCards((prev) => [...prev, cards[currentRevealIndex]]);
			setCurrentRevealIndex((prev) => prev + 1);
		}, revealDelay);

		return () => clearTimeout(timer);
	}, [isRevealing, currentRevealIndex, cards, revealDelay, onRevealComplete]);

	return (
		<div
			className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
		>
			<AnimatePresence>
				{revealedCards.map((card, index) => (
					<motion.div
						key={card.id}
						initial={{
							y: -200,
							opacity: 0,
							rotateX: -90,
							scale: 0.8,
						}}
						animate={{
							y: 0,
							opacity: 1,
							rotateX: 0,
							scale: 1,
						}}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 15,
							delay: index * 0.1,
						}}
						className="slot-reveal"
					>
						<div className="neon-card p-4 h-32 flex items-center justify-center">
							<p className="text-white text-center font-body">{card.text}</p>
						</div>
					</motion.div>
				))}
			</AnimatePresence>

			{/* Placeholder slots for unrevealed cards */}
			{Array.from({ length: cards.length - revealedCards.length }).map(
				(_, index) => (
					<motion.div
						key={`placeholder-${index}`}
						className="h-32 bg-surface-darker border-2 border-dashed border-electric-blue/30 rounded-arcade flex items-center justify-center"
						animate={{
							borderColor: isRevealing
								? [
										"rgba(77, 124, 255, 0.3)",
										"rgba(77, 124, 255, 0.8)",
										"rgba(77, 124, 255, 0.3)",
								  ]
								: "rgba(77, 124, 255, 0.3)",
						}}
						transition={{
							duration: 1,
							repeat: isRevealing ? Infinity : 0,
							ease: "easeInOut",
						}}
					>
						<div className="text-electric-blue/50 font-display text-2xl">?</div>
					</motion.div>
				)
			)}
		</div>
	);
}

// Preset slot machine reveals for different game contexts
export function CardDealReveal({
	cards,
	isDealing,
	onDealComplete,
}: {
	cards: CardType[];
	isDealing: boolean;
	onDealComplete?: () => void;
}) {
	return (
		<div className="space-y-4">
			<motion.div
				className="text-center"
				animate={
					isDealing
						? {
								scale: [1, 1.1, 1],
								textShadow: [
									"0 0 10px rgba(0, 229, 255, 0.5)",
									"0 0 20px rgba(0, 229, 255, 0.8)",
									"0 0 10px rgba(0, 229, 255, 0.5)",
								],
						  }
						: {}
				}
				transition={{
					duration: 0.8,
					repeat: isDealing ? Infinity : 0,
					ease: "easeInOut",
				}}
			>
				<h2 className="neon-heading neon-text-cyan text-2xl">
					{isDealing ? "DEALING CARDS..." : "YOUR CARDS"}
				</h2>
			</motion.div>

			<SlotMachineReveal
				cards={cards}
				isRevealing={isDealing}
				onRevealComplete={onDealComplete}
				revealDelay={300}
			/>
		</div>
	);
}

export function SubmissionReveal({
	submissions,
	isRevealing,
	onRevealComplete,
}: {
	submissions: Array<{ id: string; cards: CardType[]; playerName?: string }>;
	isRevealing: boolean;
	onRevealComplete?: () => void;
}) {
	return (
		<div className="space-y-6">
			<motion.div
				className="text-center"
				animate={
					isRevealing
						? {
								scale: [1, 1.05, 1],
						  }
						: {}
				}
				transition={{
					duration: 1,
					repeat: isRevealing ? Infinity : 0,
					ease: "easeInOut",
				}}
			>
				<h2 className="neon-heading neon-text-magenta text-2xl">
					{isRevealing ? "REVEALING SUBMISSIONS..." : "ALL SUBMISSIONS"}
				</h2>
			</motion.div>

			<div className="space-y-4">
				{submissions.map((submission, index) => (
					<motion.div
						key={submission.id}
						initial={{ opacity: 0, x: -100 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.2 }}
						className="bg-surface-dark border-2 border-neon-cyan/50 rounded-arcade p-4"
					>
						<div className="flex flex-wrap gap-2">
							{submission.cards.map((card, cardIndex) => (
								<motion.div
									key={card.id}
									initial={{ rotateY: 180, opacity: 0 }}
									animate={{ rotateY: 0, opacity: 1 }}
									transition={{
										delay: index * 0.2 + cardIndex * 0.1,
										duration: 0.5,
									}}
									className="neon-card p-3 min-w-[200px]"
								>
									<p className="text-white text-sm font-body">{card.text}</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
