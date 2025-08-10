"use client";

import React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTouchDevice, useResponsive } from "@/hooks/useResponsive";

interface TouchFeedbackProps {
	children: React.ReactNode;
	onTap?: () => void;
	disabled?: boolean;
	className?: string;
	hapticFeedback?: boolean;
	scaleOnTap?: boolean;
	glowOnHover?: boolean;
}

/**
 * Enhanced touch feedback component for mobile interactions
 * Provides visual and haptic feedback for touch interactions
 */
export function TouchFeedback({
	children,
	onTap,
	disabled = false,
	className = "",
	hapticFeedback = true,
	scaleOnTap = true,
	glowOnHover = true,
}: TouchFeedbackProps) {
	const prefersReducedMotion = useReducedMotion();
	const isTouchDevice = useTouchDevice();

	const handleTap = () => {
		if (disabled || !onTap) return;

		// Provide haptic feedback on supported devices
		if (hapticFeedback && "vibrate" in navigator) {
			navigator.vibrate(10); // Short vibration
		}

		onTap();
	};

	// Animation variants based on user preferences and device type
	const tapVariant = prefersReducedMotion || !scaleOnTap ? {} : { scale: 0.95 };

	const hoverVariant =
		prefersReducedMotion || isTouchDevice || !glowOnHover
			? {}
			: {
					scale: 1.02,
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
			  };

	return (
		<motion.div
			className={`${className} ${
				disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
			} ${isTouchDevice ? "touch-manipulation" : ""}`}
			whileHover={disabled ? {} : hoverVariant}
			whileTap={disabled ? {} : tapVariant}
			onTap={handleTap}
			transition={{ duration: 0.1 }}
		>
			{children}
		</motion.div>
	);
}

/**
 * Enhanced button component with touch feedback
 */
interface TouchButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: "primary" | "secondary" | "danger";
	size?: "sm" | "md" | "lg";
	className?: string;
	loading?: boolean;
}

export function TouchButton({
	children,
	onClick,
	disabled = false,
	variant = "primary",
	size = "md",
	className = "",
	loading = false,
}: TouchButtonProps) {
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	const baseClasses =
		"font-medium rounded-lg transition-all duration-200 touch-manipulation flex items-center justify-center";

	const variantClasses = {
		primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
		secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400",
		danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
	};

	const sizeClasses = {
		sm: isMobile ? "px-3 py-2 text-sm min-h-[44px]" : "px-3 py-2 text-sm",
		md: isMobile ? "px-4 py-3 text-base min-h-[48px]" : "px-4 py-2 text-base",
		lg: isMobile ? "px-6 py-4 text-lg min-h-[52px]" : "px-6 py-3 text-lg",
	};

	return (
		<TouchFeedback
			onTap={onClick}
			disabled={disabled || loading}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
			scaleOnTap={true}
			glowOnHover={true}
		>
			{loading && (
				<motion.div
					className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
					animate={prefersReducedMotion ? {} : { rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				/>
			)}
			{children}
		</TouchFeedback>
	);
}

/**
 * Floating Action Button for mobile interfaces
 */
interface FloatingActionButtonProps {
	icon: React.ReactNode;
	onClick: () => void;
	position?: "bottom-right" | "bottom-left" | "bottom-center";
	className?: string;
	disabled?: boolean;
}

export function FloatingActionButton({
	icon,
	onClick,
	position = "bottom-right",
	className = "",
	disabled = false,
}: FloatingActionButtonProps) {
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	if (!isMobile) return null;

	const positionClasses = {
		"bottom-right": "bottom-6 right-6",
		"bottom-left": "bottom-6 left-6",
		"bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2",
	};

	return (
		<motion.button
			className={`fixed z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg touch-manipulation flex items-center justify-center ${positionClasses[position]} ${className}`}
			whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
			whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
			onClick={onClick}
			disabled={disabled}
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			exit={{ scale: 0 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
		>
			{icon}
		</motion.button>
	);
}
