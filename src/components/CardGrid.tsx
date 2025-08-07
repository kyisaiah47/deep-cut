import React from "react";
import { motion } from "framer-motion";

interface CardGridProps {
	children: React.ReactNode;
	columns?: {
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
	gap?: "sm" | "md" | "lg";
	className?: string;
}

export function CardGrid({
	children,
	columns = { sm: 1, md: 2, lg: 3, xl: 4 },
	gap = "md",
	className = "",
}: CardGridProps) {
	const gapClasses = {
		sm: "gap-2",
		md: "gap-4",
		lg: "gap-6",
	};

	const gridClasses = `
		grid
		${columns.sm ? `grid-cols-${columns.sm}` : "grid-cols-1"}
		${columns.md ? `sm:grid-cols-${columns.md}` : ""}
		${columns.lg ? `lg:grid-cols-${columns.lg}` : ""}
		${columns.xl ? `xl:grid-cols-${columns.xl}` : ""}
		${gapClasses[gap]}
		${className}
	`
		.trim()
		.replace(/\s+/g, " ");

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className={gridClasses}
		>
			{children}
		</motion.div>
	);
}

// Specialized grid for submissions during voting
interface SubmissionGridProps {
	children: React.ReactNode;
	className?: string;
}

export function SubmissionGrid({
	children,
	className = "",
}: SubmissionGridProps) {
	return (
		<CardGrid
			columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}
			gap="lg"
			className={className}
		>
			{children}
		</CardGrid>
	);
}

// Specialized grid for response cards
interface ResponseCardGridProps {
	children: React.ReactNode;
	className?: string;
}

export function ResponseCardGrid({
	children,
	className = "",
}: ResponseCardGridProps) {
	return (
		<CardGrid
			columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
			gap="md"
			className={className}
		>
			{children}
		</CardGrid>
	);
}
