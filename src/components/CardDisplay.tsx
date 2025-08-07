import React from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";
import { Card as CardType } from "../types/game";
import { ANIMATION_DURATIONS, CARD_TYPES } from "../lib/constants";

interface CardDisplayProps {
	cards: CardType[];
	selectedCardIds?: string[];
	onCardSelect?: (cardId: string) => void;
	selectable?: boolean;
	maxSelections?: number;
	title?: string;
	emptyMessage?: string;
	className?: string;
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
}: CardDisplayProps) {
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

	if (cards.length === 0) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<p className="text-gray-500 text-lg">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{title && (
				<motion.h2
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-2xl font-bold text-gray-900 text-center"
				>
					{title}
				</motion.h2>
			)}

			{/* Prompt Cards Section */}
			{promptCards.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1 }}
				>
					<h3 className="text-lg font-semibold text-gray-800 mb-3">
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
								animationDelay={index * ANIMATION_DURATIONS.STAGGER_DELAY}
								className="max-w-2xl mx-auto"
							/>
						))}
					</div>
				</motion.div>
			)}

			{/* Response Cards Section */}
			{responseCards.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: promptCards.length > 0 ? 0.3 : 0.1 }}
				>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold text-gray-800">
							Response Cards ({responseCards.length})
						</h3>
						{maxSelections && selectable && (
							<span className="text-sm text-gray-600">
								{selectedCardIds.length}/{maxSelections} selected
							</span>
						)}
					</div>

					{/* Responsive grid layout */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
										(promptCards.length + index) *
										ANIMATION_DURATIONS.STAGGER_DELAY
									}
									className={`
										${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
									`}
								/>
							);
						})}
					</div>
				</motion.div>
			)}

			{/* Selection status for mobile */}
			{selectable && maxSelections && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="sm:hidden text-center"
				>
					<div
						className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
							selectedCardIds.length === maxSelections
								? "bg-green-100 text-green-800"
								: "bg-gray-100 text-gray-600"
						}`}
					>
						{selectedCardIds.length}/{maxSelections} cards selected
					</div>
				</motion.div>
			)}
		</div>
	);
}
