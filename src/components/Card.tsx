import React from "react";
import { motion } from "framer-motion";
import { Card as CardType } from "../types/game";
import { ANIMATION_DURATIONS, CARD_TYPES } from "../lib/constants";

interface CardProps {
	card: CardType;
	isSelected?: boolean;
	isSelectable?: boolean;
	onClick?: (cardId: string) => void;
	animationDelay?: number;
	className?: string;
}

export function Card({
	card,
	isSelected = false,
	isSelectable = false,
	onClick,
	animationDelay = 0,
	className = "",
}: CardProps) {
	const isPrompt = card.type === CARD_TYPES.PROMPT;

	const handleClick = () => {
		if (isSelectable && onClick) {
			onClick(card.id);
		}
	};

	const baseClasses = `
		relative rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer
		${
			isPrompt
				? "bg-blue-50 border-blue-300 text-blue-900"
				: "bg-gray-50 border-gray-300 text-gray-900"
		}
		${
			isSelected
				? isPrompt
					? "border-blue-500 bg-blue-100 shadow-lg ring-2 ring-blue-200"
					: "border-gray-500 bg-gray-100 shadow-lg ring-2 ring-gray-200"
				: ""
		}
		${isSelectable ? "hover:shadow-md active:scale-95" : "cursor-default"}
		${className}
	`
		.trim()
		.replace(/\s+/g, " ");

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: ANIMATION_DURATIONS.CARD_SELECT,
				delay: animationDelay,
				ease: "easeOut",
			}}
			whileHover={
				isSelectable
					? {
							scale: 1.02,
							y: -2,
							transition: { duration: ANIMATION_DURATIONS.CARD_HOVER },
					  }
					: {}
			}
			whileTap={
				isSelectable
					? {
							scale: 0.98,
							transition: { duration: 0.1 },
					  }
					: {}
			}
			className={baseClasses}
			onClick={handleClick}
		>
			{/* Selection indicator */}
			{isSelected && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.2 }}
					className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
						isPrompt ? "bg-blue-500" : "bg-gray-500"
					}`}
				>
					✓
				</motion.div>
			)}

			{/* Card content */}
			<div className="relative z-10">
				<p
					className={`text-sm font-medium leading-relaxed ${
						isPrompt ? "text-blue-900" : "text-gray-900"
					}`}
				>
					{card.text}
				</p>
			</div>

			{/* Hover glow effect */}
			{isSelectable && (
				<motion.div
					className={`absolute inset-0 rounded-lg opacity-0 ${
						isPrompt ? "bg-blue-200" : "bg-gray-200"
					}`}
					whileHover={{ opacity: 0.1 }}
					transition={{ duration: ANIMATION_DURATIONS.CARD_HOVER }}
				/>
			)}
		</motion.div>
	);
}
