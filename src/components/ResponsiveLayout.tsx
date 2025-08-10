"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ResponsiveLayoutProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Responsive layout wrapper that adapts to different screen sizes
 */
export function ResponsiveLayout({
	children,
	className = "",
}: ResponsiveLayoutProps) {
	const { isMobile, isTablet, width } = useResponsive();

	return (
		<div
			className={`
			min-h-screen bg-gradient-to-br from-purple-50 to-blue-50
			${isMobile ? "px-3 py-4" : isTablet ? "px-6 py-6" : "px-8 py-8"}
			safe-area-inset
			${className}
		`}
		>
			<div
				className={`
				mx-auto
				${isMobile ? "max-w-sm" : isTablet ? "max-w-4xl" : "max-w-7xl"}
			`}
			>
				{children}
			</div>
		</div>
	);
}

/**
 * Responsive grid component that adapts columns based on screen size
 */
interface ResponsiveGridProps {
	children: React.ReactNode;
	mobileColumns?: number;
	tabletColumns?: number;
	desktopColumns?: number;
	gap?: number;
	className?: string;
}

export function ResponsiveGrid({
	children,
	mobileColumns = 1,
	tabletColumns = 2,
	desktopColumns = 3,
	gap = 4,
	className = "",
}: ResponsiveGridProps) {
	const { isMobile, isTablet } = useResponsive();

	const columns = isMobile
		? mobileColumns
		: isTablet
		? tabletColumns
		: desktopColumns;

	return (
		<div
			className={`grid gap-${gap} ${className}`}
			style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
		>
			{children}
		</div>
	);
}

/**
 * Responsive card component with enhanced mobile interactions
 */
interface ResponsiveCardProps {
	children: React.ReactNode;
	className?: string;
	interactive?: boolean;
	onClick?: () => void;
	selected?: boolean;
}

export function ResponsiveCard({
	children,
	className = "",
	interactive = false,
	onClick,
	selected = false,
}: ResponsiveCardProps) {
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	const baseClasses = `
		bg-white rounded-lg shadow-sm border-2 transition-all duration-200
		${isMobile ? "p-3" : "p-4"}
		${interactive ? "cursor-pointer touch-manipulation" : ""}
		${
			selected
				? "border-blue-500 bg-blue-50 shadow-md"
				: "border-gray-200 hover:border-gray-300"
		}
		${className}
	`;

	if (!interactive) {
		return <div className={baseClasses}>{children}</div>;
	}

	return (
		<motion.div
			className={baseClasses}
			whileHover={
				prefersReducedMotion
					? {}
					: {
							scale: 1.02,
							boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
					  }
			}
			whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
			onClick={onClick}
		>
			{children}
		</motion.div>
	);
}

/**
 * Responsive modal/drawer component
 */
interface ResponsiveModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
	className?: string;
}

export function ResponsiveModal({
	isOpen,
	onClose,
	children,
	title,
	className = "",
}: ResponsiveModalProps) {
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-40"
						onClick={onClose}
					/>

					{/* Modal/Drawer */}
					<motion.div
						initial={
							prefersReducedMotion
								? { opacity: 0 }
								: isMobile
								? { opacity: 0, y: "100%" }
								: { opacity: 0, scale: 0.9, y: 20 }
						}
						animate={
							prefersReducedMotion
								? { opacity: 1 }
								: isMobile
								? { opacity: 1, y: 0 }
								: { opacity: 1, scale: 1, y: 0 }
						}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: isMobile
								? { opacity: 0, y: "100%" }
								: { opacity: 0, scale: 0.9, y: 20 }
						}
						transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
						className={`
							fixed z-50 bg-white
							${
								isMobile
									? "bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] overflow-y-auto"
									: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
							}
							${className}
						`}
					>
						{/* Header */}
						{title && (
							<div
								className={`flex items-center justify-between border-b ${
									isMobile ? "p-4" : "p-6"
								}`}
							>
								<h2
									className={`font-semibold text-gray-900 ${
										isMobile ? "text-lg" : "text-xl"
									}`}
								>
									{title}
								</h2>
								<button
									onClick={onClose}
									className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						)}

						{/* Content */}
						<div className={isMobile ? "p-4" : "p-6"}>{children}</div>

						{/* Mobile handle */}
						{isMobile && (
							<div className="absolute top-2 left-1/2 transform -translate-x-1/2">
								<div className="w-8 h-1 bg-gray-300 rounded-full"></div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

/**
 * Responsive navigation component
 */
interface ResponsiveNavProps {
	items: Array<{
		label: string;
		icon?: React.ReactNode;
		onClick: () => void;
		active?: boolean;
	}>;
	className?: string;
}

export function ResponsiveNav({ items, className = "" }: ResponsiveNavProps) {
	const { isMobile } = useResponsive();

	if (isMobile) {
		// Bottom navigation for mobile
		return (
			<div
				className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-30 ${className}`}
			>
				<div className="flex">
					{items.map((item, index) => (
						<button
							key={index}
							onClick={item.onClick}
							className={`
								flex-1 flex flex-col items-center justify-center py-2 px-1 touch-manipulation
								${
									item.active
										? "text-blue-600 bg-blue-50"
										: "text-gray-600 hover:text-gray-900"
								}
							`}
						>
							{item.icon && <div className="mb-1">{item.icon}</div>}
							<span className="text-xs font-medium">{item.label}</span>
						</button>
					))}
				</div>
			</div>
		);
	}

	// Horizontal navigation for desktop
	return (
		<nav className={`flex space-x-4 ${className}`}>
			{items.map((item, index) => (
				<button
					key={index}
					onClick={item.onClick}
					className={`
						flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
						${
							item.active
								? "bg-blue-100 text-blue-700"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
						}
					`}
				>
					{item.icon}
					<span>{item.label}</span>
				</button>
			))}
		</nav>
	);
}
