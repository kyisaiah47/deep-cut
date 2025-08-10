"use client";

import { useState, useEffect } from "react";
import { RESPONSIVE_BREAKPOINTS } from "@/lib/constants";

interface ResponsiveState {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isLargeDesktop: boolean;
	width: number;
	height: number;
}

/**
 * Hook to track responsive breakpoints and screen dimensions
 */
export function useResponsive(): ResponsiveState {
	const [state, setState] = useState<ResponsiveState>({
		isMobile: false,
		isTablet: false,
		isDesktop: false,
		isLargeDesktop: false,
		width: 0,
		height: 0,
	});

	useEffect(() => {
		// Check if we're in a browser environment
		if (typeof window === "undefined") return;

		const updateState = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			setState({
				isMobile: width < RESPONSIVE_BREAKPOINTS.MD,
				isTablet:
					width >= RESPONSIVE_BREAKPOINTS.MD &&
					width < RESPONSIVE_BREAKPOINTS.LG,
				isDesktop:
					width >= RESPONSIVE_BREAKPOINTS.LG &&
					width < RESPONSIVE_BREAKPOINTS.XXL,
				isLargeDesktop: width >= RESPONSIVE_BREAKPOINTS.XXL,
				width,
				height,
			});
		};

		// Set initial state
		updateState();

		// Listen for resize events
		window.addEventListener("resize", updateState);

		// Cleanup
		return () => {
			window.removeEventListener("resize", updateState);
		};
	}, []);

	return state;
}

/**
 * Hook to get responsive grid columns based on screen size
 */
export function useResponsiveGrid(
	mobileColumns = 1,
	tabletColumns = 2,
	desktopColumns = 3,
	largeDesktopColumns = 4
) {
	const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();

	if (isMobile) return mobileColumns;
	if (isTablet) return tabletColumns;
	if (isDesktop) return desktopColumns;
	if (isLargeDesktop) return largeDesktopColumns;

	return desktopColumns; // fallback
}

/**
 * Hook to determine if touch interactions should be enabled
 */
export function useTouchDevice(): boolean {
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		// Check if we're in a browser environment
		if (typeof window === "undefined") return;

		const checkTouchDevice = () => {
			setIsTouchDevice(
				"ontouchstart" in window ||
					navigator.maxTouchPoints > 0 ||
					// @ts-ignore - for older browsers
					navigator.msMaxTouchPoints > 0
			);
		};

		checkTouchDevice();
	}, []);

	return isTouchDevice;
}
