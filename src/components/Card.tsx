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

	// Size-based classes for neon arcade theme
	const sizeClasses = {
		sm: "p-3 text-xs",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};

	// Responsive padding adjustments
	const responsivePadding = isMobile ? "p-3" : sizeClasses[size];

	const baseClasses = `
		neon-card relative cursor-pointer font-body
		${responsivePadding}
		${
			isPrompt
				? "border-electric-blue text-neon-cyan"
				: "border-neon-cyan text-white"
		}
		${isSelected ? "neon-card-selected" : ""}
		${
			isSelectable
				? "hover:scale-105 hover:-translate-y-1 active:scale-95"
				: "cursor-default"
		}
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
					scale: 1.05,
					y: -4,
					transition: { duration: ANIMATION_DURATIONS.CARD_HOVER },
			  };

	const tapVariant = prefersReducedMotion
		? {}
		: {
				scale: 0.95,
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
			{/* Neon selection indicator */}
			{isSelected && (
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={
						prefersReducedMotion
							? { duration: 0.01 }
							: {
									duration: 0.4,
									type: "spring",
									stiffness: 200,
									damping: 15,
							  }
					}
					className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-stage font-display font-bold text-sm shadow-neon-cyan ${
						isPrompt
							? "bg-electric-blue border-2 border-neon-cyan"
							: "bg-neon-cyan border-2 border-white"
					}`}
				>
					⚡
				</motion.div>
			)}

			{/* Card content with neon styling */}
			<div className="relative z-10">
				<p
					className={`font-medium leading-relaxed ${
						isMobile ? "text-sm" : sizeClasses[size].split(" ")[1]
					} ${
						isPrompt
							? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
							: "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
					}`}
				>
					{card.text}
				</p>
			</div>

			{/* Neon hover glow effect - disabled on touch devices */}
			{isSelectable && !isTouchDevice && !prefersReducedMotion && (
				<motion.div
					className={`absolute inset-0 rounded-arcade opacity-0 ${
						isPrompt
							? "bg-gradient-to-br from-electric-blue/20 to-neon-cyan/20"
							: "bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20"
					}`}
					whileHover={{ opacity: 1 }}
					transition={{ duration: ANIMATION_DURATIONS.CARD_HOVER }}
				/>
			)}

			{/* Neon touch feedback for mobile */}
			{isSelectable && isTouchDevice && (
				<motion.div
					className={`absolute inset-0 rounded-arcade opacity-0 ${
						isPrompt ? "bg-electric-blue/30" : "bg-neon-cyan/30"
					}`}
					whileTap={{ opacity: 1 }}
					transition={{ duration: 0.1 }}
				/>
			)}
		</motion.div>
	);
}
