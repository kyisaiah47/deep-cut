import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./Card";
import { Card as CardType } from "../types/game";
import {
	ANIMATION_DURATIONS,
	ANIMATION_VARIANTS,
	CARD_TYPES,
} from "../lib/constants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useResponsive, useResponsiveGrid } from "../hooks/useResponsive";
import { CardSkeleton } from "./SkeletonLoader";

interface CardDisplayProps {
	cards: CardType[];
	selectedCardIds?: string[];
	onCardSelect?: (cardId: string) => void;
	selectable?: boolean;
	maxSelections?: number;
	title?: string;
	emptyMessage?: string;
	className?: string;
	loading?: boolean;
	cardSize?: "sm" | "md" | "lg";
}

export function CardDisplay({
	cards,
	selectedCardIds = [],
	onCardSelect,
	selectable = false,
	maxSelections,
	title,
	emptyMessage = "No cards available",
	className = "",
	loading = false,
	cardSize = "md",
}: CardDisplayProps) {
	const prefersReducedMotion = useReducedMotion();
	const { isMobile, isTablet } = useResponsive();
	const gridColumns = useResponsiveGrid(1, 2, 3, 4);

	const handleCardClick = (cardId: string) => {
		if (!selectable || !onCardSelect) return;

		const isCurrentlySelected = selectedCardIds.includes(cardId);

		// If card is already selected, deselect it
		if (isCurrentlySelected) {
			onCardSelect(cardId);
			return;
		}

		// If we have a max selection limit and it's reached, don't allow more selections
		if (maxSelections && selectedCardIds.length >= maxSelections) {
			return;
		}

		onCardSelect(cardId);
	};

	// Separate prompt and response cards
	const promptCards = cards.filter((card) => card.type === CARD_TYPES.PROMPT);
	const responseCards = cards.filter(
		(card) => card.type === CARD_TYPES.RESPONSE
	);

	// Loading state
	if (loading) {
		return (
			<div className={`space-y-6 ${className}`}>
				{title && (
					<div className="text-center">
						<div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
					</div>
				)}
				<div className="space-y-4">
					<div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
					<div
						className={`grid gap-4`}
						style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
					>
						{Array.from({ length: 6 }).map((_, i) => (
							<CardSkeleton key={i} />
						))}
					</div>
				</div>
			</div>
		);
	}

	// Empty state
	if (cards.length === 0) {
		return (
			<motion.div
				className={`text-center py-12 ${className}`}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<div className="text-6xl mb-4">🃏</div>
				<p className="text-gray-500 text-lg">{emptyMessage}</p>
			</motion.div>
		);
	}

	// Animation variants
	const containerVariant = prefersReducedMotion
		? { initial: { opacity: 0 }, animate: { opacity: 1 } }
		: ANIMATION_VARIANTS.pageEnter;

	const sectionVariant = prefersReducedMotion
		? { initial: { opacity: 0 }, animate: { opacity: 1 } }
		: {
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
		  };

	return (
		<motion.div
			className={`space-y-6 ${className}`}
			{...containerVariant}
		>
			{title && (
				<motion.h2
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className={`font-bold text-gray-900 text-center ${
						isMobile ? "text-xl" : "text-2xl"
					}`}
				>
					{title}
				</motion.h2>
			)}

			{/* Prompt Cards Section */}
			<AnimatePresence>
				{promptCards.length > 0 && (
					<motion.div
						{...sectionVariant}
						transition={{ delay: 0.1 }}
					>
						<h3
							className={`font-semibold text-gray-800 mb-3 ${
								isMobile ? "text-base" : "text-lg"
							}`}
						>
							Prompt Card{promptCards.length > 1 ? "s" : ""}
						</h3>
						<div className="grid grid-cols-1 gap-4">
							{promptCards.map((card, index) => (
								<Card
									key={card.id}
									card={card}
									isSelected={selectedCardIds.includes(card.id)}
									isSelectable={selectable}
									onClick={handleCardClick}
									animationDelay={
										prefersReducedMotion
											? 0
											: index * ANIMATION_DURATIONS.STAGGER_DELAY
									}
									className="max-w-2xl mx-auto"
									size={cardSize}
								/>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Response Cards Section */}
			<AnimatePresence>
				{responseCards.length > 0 && (
					<motion.div
						{...sectionVariant}
						transition={{ delay: promptCards.length > 0 ? 0.3 : 0.1 }}
					>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
							<h3
								className={`font-semibold text-gray-800 ${
									isMobile ? "text-base" : "text-lg"
								}`}
							>
								Response Cards ({responseCards.length})
							</h3>
							{maxSelections && selectable && (
								<motion.span
									className={`text-sm text-gray-600 ${
										isMobile ? "self-start" : ""
									}`}
									animate={
										selectedCardIds.length === maxSelections
											? {
													scale: [1, 1.05, 1],
													color: ["#4B5563", "#059669", "#4B5563"],
											  }
											: {}
									}
									transition={{ duration: 0.5 }}
								>
									{selectedCardIds.length}/{maxSelections} selected
								</motion.span>
							)}
						</div>

						{/* Responsive grid layout */}
						<div
							className="grid gap-4"
							style={{
								gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
								// Ensure minimum card width on very small screens
								minWidth: isMobile ? "280px" : "auto",
							}}
						>
							<AnimatePresence mode="popLayout">
								{responseCards.map((card, index) => {
									const isSelected = selectedCardIds.includes(card.id);
									const canSelect =
										selectable &&
										(isSelected ||
											!maxSelections ||
											selectedCardIds.length < maxSelections);

									return (
										<Card
											key={card.id}
											card={card}
											isSelected={isSelected}
											isSelectable={canSelect}
											onClick={handleCardClick}
											animationDelay={
												prefersReducedMotion
													? 0
													: (promptCards.length + index) *
													  ANIMATION_DURATIONS.STAGGER_DELAY
											}
											className={`
												${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
											`}
											size={cardSize}
										/>
									);
								})}
							</AnimatePresence>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Selection status - enhanced for mobile */}
			{selectable && maxSelections && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="text-center"
				>
					<motion.div
						className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
							selectedCardIds.length === maxSelections
								? "bg-green-100 text-green-800 border-2 border-green-300"
								: "bg-gray-100 text-gray-600 border-2 border-gray-300"
						}`}
						animate={
							selectedCardIds.length === maxSelections
								? {
										scale: [1, 1.05, 1],
								  }
								: {}
						}
						transition={{ duration: 0.3 }}
					>
						{selectedCardIds.length === maxSelections && "✓ "}
						{selectedCardIds.length}/{maxSelections} cards selected
						{selectedCardIds.length === maxSelections && " - Ready!"}
					</motion.div>
				</motion.div>
			)}

			{/* Touch instructions for mobile */}
			{isMobile && selectable && cards.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
					className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3"
				>
					💡 Tap cards to select them
				</motion.div>
			)}
		</motion.div>
	);
}
