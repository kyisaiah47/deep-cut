import React from "react";
import { motion } from "framer-motion";
import { Card as CardType } from "../types/game";
import {
	ANIMATION_DURATIONS,
	ANIMATION_VARIANTS,
	CARD_TYPES,
} from "../lib/constants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useResponsive, useTouchDevice } from "../hooks/useResponsive";

interface CardProps {
	card: CardType;
	isSelected?: boolean;
	isSelectable?: boolean;
	onClick?: (cardId: string) => void;
	animationDelay?: number;
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function Card({
	card,
	isSelected = false,
	isSelectable = false,
	onClick,
	animationDelay = 0,
	className = "",
	size = "md",
}: CardProps) {
	const isPrompt = card.type === CARD_TYPES.PROMPT;
	const prefersReducedMotion = useReducedMotion();
	const { isMobile } = useResponsive();
	const isTouchDevice = useTouchDevice();

	const handleClick = () => {
		if (isSelectable && onClick) {
			onClick(card.id);
		}
	};

	// Size-based classes
	const sizeClasses = {
		sm: "p-3 text-xs",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};

	// Responsive padding adjustments
	const responsivePadding = isMobile ? "p-3" : sizeClasses[size];

	const baseClasses = `
		relative rounded-lg border-2 transition-all duration-200 cursor-pointer
		${responsivePadding}
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
		${isTouchDevice && isSelectable ? "touch-manipulation" : ""}
		${className}
	`
		.trim()
		.replace(/\s+/g, " ");

	// Animation variants based on user preferences
	const cardVariant = prefersReducedMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: { duration: 0.01, delay: animationDelay },
		  }
		: {
				...ANIMATION_VARIANTS.cardStagger,
				transition: {
					duration: ANIMATION_DURATIONS.CARD_SELECT,
					delay: animationDelay,
					ease: "easeOut" as const,
				},
		  };

	const hoverVariant =
		prefersReducedMotion || isTouchDevice
			? {}
			: {
					scale: 1.02,
					y: -2,
					transition: { duration: ANIMATION_DURATIONS.CARD_HOVER },
			  };

	const tapVariant = prefersReducedMotion
		? {}
		: {
				scale: 0.98,
				transition: { duration: 0.1 },
		  };

	return (
		<motion.div
			{...cardVariant}
			whileHover={isSelectable ? hoverVariant : {}}
			whileTap={isSelectable ? tapVariant : {}}
			className={baseClasses}
			onClick={handleClick}
			// Touch-friendly attributes
			role={isSelectable ? "button" : "article"}
			tabIndex={isSelectable ? 0 : -1}
			onKeyDown={(e) => {
				if (isSelectable && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					handleClick();
				}
			}}
			aria-pressed={isSelectable ? isSelected : undefined}
			aria-label={
				isSelectable
					? `${isSelected ? "Deselect" : "Select"} card: ${card.text}`
					: card.text
			}
		>
			{/* Selection indicator */}
			{isSelected && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={
						prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }
					}
					className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
						isPrompt ? "bg-blue-500" : "bg-gray-500"
					}`}
				>
					✓
				</motion.div>
			)}

			{/* Card content */}
			<div className="relative z-10">
				<p
					className={`font-medium leading-relaxed ${
						isMobile ? "text-sm" : sizeClasses[size].split(" ")[1]
					} ${isPrompt ? "text-blue-900" : "text-gray-900"}`}
				>
					{card.text}
				</p>
			</div>

			{/* Hover glow effect - disabled on touch devices */}
			{isSelectable && !isTouchDevice && !prefersReducedMotion && (
				<motion.div
					className={`absolute inset-0 rounded-lg opacity-0 ${
						isPrompt ? "bg-blue-200" : "bg-gray-200"
					}`}
					whileHover={{ opacity: 0.1 }}
					transition={{ duration: ANIMATION_DURATIONS.CARD_HOVER }}
				/>
			)}

			{/* Touch feedback for mobile */}
			{isSelectable && isTouchDevice && (
				<motion.div
					className={`absolute inset-0 rounded-lg opacity-0 ${
						isPrompt ? "bg-blue-300" : "bg-gray-300"
					}`}
					whileTap={{ opacity: 0.2 }}
					transition={{ duration: 0.1 }}
				/>
			)}
		</motion.div>
	);
}
