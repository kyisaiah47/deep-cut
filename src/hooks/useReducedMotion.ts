"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect user's reduced motion preference
 * Respects the prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		// Check if we're in a browser environment
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

		// Set initial value
		setPrefersReducedMotion(mediaQuery.matches);

		// Listen for changes
		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches);
		};

		mediaQuery.addEventListener("change", handleChange);

		// Cleanup
		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, []);

	return prefersReducedMotion;
}

/**
 * Hook to get animation variants that respect reduced motion preferences
 */
export function useAnimationVariants() {
	const prefersReducedMotion = useReducedMotion();

	const getVariant = (variant: Record<string, any>) => {
		if (prefersReducedMotion) {
			// Return simplified variants for reduced motion
			return {
				...variant,
				transition: { duration: 0.01 }, // Nearly instant
				animate: {
					...variant.animate,
					scale: 1, // Remove scaling
					y: 0, // Remove vertical movement
					x: 0, // Remove horizontal movement
				},
			};
		}
		return variant;
	};

	return { getVariant, prefersReducedMotion };
}
