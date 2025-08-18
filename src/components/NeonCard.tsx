import React from "react";
import { motion } from "framer-motion";
import { Card as CardType } from "../types/game";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useResponsive, useTouchDevice } from "../hooks/useResponsive";

interface NeonCardProps {
	card: CardType;
	isSelected?: boolean;
	isSelectable?: boolean;
	onClick?: (cardId: string) => void;
	animationDelay?: number;
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "prompt" | "response" | "meme";
}

export function NeonCard({
	card,
	isSelected = false,
	isSelectable = false,
	onClick,
	animationDelay = 0,
	className = "",
	size = "md",
	variant = "response",
}: NeonCardProps) {
	const isPrompt = card.type === "prompt" || variant === "prompt";
	const isMeme = variant === "meme";
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
		sm: "p-3 text-xs min-h-[100px]",
		md: "p-4 text-sm min-h-[120px]",
		lg: "p-6 text-base min-h-[150px]",
	};

	// Responsive padding adjustments
	const responsivePadding = isMobile ? "p-3" : sizeClasses[size];

	// Neon card styling based on type
	const getCardStyling = () => {
		if (isPrompt) {
			return {
				base: "bg-gradient-to-br from-electric-blue/20 to-neon-cyan/20 border-electric-blue",
				selected: "border-neon-cyan shadow-neon-cyan animate-neon-pulse",
				text: "text-neon-cyan",
				glow: "shadow-neon-blue",
			};
		} else if (isMeme) {
			return {
				base: "bg-gradient-to-br from-neon-magenta/20 to-acid-lime/20 border-neon-magenta",
				selected: "border-acid-lime shadow-neon-lime animate-neon-pulse",
				text: "text-acid-lime",
				glow: "shadow-neon-magenta",
			};
		} else {
			return {
				base: "bg-gradient-to-br from-surface-dark to-surface-darker border-neon-cyan",
				selected: "border-neon-magenta shadow-neon-magenta animate-neon-pulse",
				text: "text-white",
				glow: "shadow-neon-cyan",
			};
		}
	};

	const styling = getCardStyling();

	const baseClasses = `
		neon-card relative cursor-pointer font-body backdrop-blur-sm
		border-2 rounded-arcade transition-all duration-300
		${responsivePadding}
		${styling.base}
		${isSelected ? styling.selected : styling.glow}
		${
			isSelectable
				? "hover:scale-105 hover:-translate-y-2 active:scale-95"
				: "cursor-default"
		}
		${isTouchDevice && isSelectable ? "touch-manipulation" : ""}
		${className}
	`
		.trim()
		.replace(/\s+/g, " ");

	// Slot machine flip animation
	const cardVariant = prefersReducedMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				transition: { duration: 0.01, delay: animationDelay },
		  }
		: {
				initial: {
					rotateY: -90,
					opacity: 0,
					y: -50,
					scale: 0.8,
				},
				animate: {
					rotateY: 0,
					opacity: 1,
					y: 0,
					scale: 1,
				},
				transition: {
					duration: 0.6,
					delay: animationDelay,
					type: "spring",
					stiffness: 100,
					damping: 15,
				},
		  };

	const hoverVariant =
		prefersReducedMotion || isTouchDevice
			? {}
			: {
					scale: 1.05,
					y: -8,
					rotateY: 5,
					transition: { duration: 0.3 },
			  };

	const tapVariant = prefersReducedMotion
		? {}
		: {
				scale: 0.95,
				rotateY: -5,
				transition: { duration: 0.1 },
		  };

	return (
		<motion.div
			{...cardVariant}
			whileHover={isSelectable ? hoverVariant : {}}
			whileTap={isSelectable ? tapVariant : {}}
			className={baseClasses}
			onClick={handleClick}
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
			{/* Neon rim lighting effect */}
			<div className="absolute inset-0 rounded-arcade border border-white/10 pointer-events-none" />

			{/* Selection indicator with meme energy */}
			{isSelected && (
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={
						prefersReducedMotion
							? { duration: 0.01 }
							: {
									duration: 0.5,
									type: "spring",
									stiffness: 200,
									damping: 15,
							  }
					}
					className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg ${
						isPrompt
							? "bg-electric-blue border-2 border-neon-cyan text-stage shadow-neon-cyan"
							: isMeme
							? "bg-acid-lime border-2 border-neon-magenta text-stage shadow-neon-lime"
							: "bg-neon-magenta border-2 border-white text-stage shadow-neon-magenta"
					}`}
				>
					{isMeme ? "💀" : isPrompt ? "⚡" : "🔥"}
				</motion.div>
			)}

			{/* Card content with enhanced styling */}
			<div className="relative z-10 h-full flex flex-col justify-center">
				<p
					className={`font-medium leading-relaxed text-center ${
						isMobile ? "text-sm" : sizeClasses[size].split(" ")[1]
					} ${styling.text} drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]`}
				>
					{card.text}
				</p>

				{/* Meme energy indicators */}
				{isMeme && (
					<div className="absolute top-2 right-2 text-xs opacity-60">
						{Math.random() > 0.5 ? "💯" : "🔥"}
					</div>
				)}
			</div>

			{/* Neon glow effects */}
			{isSelectable && !isTouchDevice && !prefersReducedMotion && (
				<motion.div
					className={`absolute inset-0 rounded-arcade opacity-0 ${
						isPrompt
							? "bg-gradient-to-br from-electric-blue/30 to-neon-cyan/30"
							: isMeme
							? "bg-gradient-to-br from-neon-magenta/30 to-acid-lime/30"
							: "bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30"
					}`}
					whileHover={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				/>
			)}

			{/* Touch feedback for mobile */}
			{isSelectable && isTouchDevice && (
				<motion.div
					className={`absolute inset-0 rounded-arcade opacity-0 ${
						isPrompt
							? "bg-electric-blue/40"
							: isMeme
							? "bg-acid-lime/40"
							: "bg-neon-cyan/40"
					}`}
					whileTap={{ opacity: 1 }}
					transition={{ duration: 0.1 }}
				/>
			)}

			{/* Floating particles for extra chaos */}
			{isSelected && !prefersReducedMotion && (
				<div className="absolute inset-0 pointer-events-none">
					{Array.from({ length: 3 }).map((_, i) => (
						<motion.div
							key={i}
							className="absolute w-1 h-1 bg-current rounded-full"
							style={{
								left: `${20 + i * 30}%`,
								top: `${20 + i * 20}%`,
							}}
							animate={{
								y: [-10, -20, -10],
								opacity: [0, 1, 0],
								scale: [0, 1, 0],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								delay: i * 0.3,
							}}
						/>
					))}
				</div>
			)}
		</motion.div>
	);
}
