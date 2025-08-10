"use client";

import React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useResponsive } from "@/hooks/useResponsive";
import { ANIMATION_VARIANTS } from "@/lib/constants";

interface SkeletonProps {
	className?: string;
	width?: string | number;
	height?: string | number;
	rounded?: boolean;
}

export function Skeleton({
	className = "",
	width = "100%",
	height = "1rem",
	rounded = false,
}: SkeletonProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className={`bg-gray-200 ${
				rounded ? "rounded-full" : "rounded"
			} ${className}`}
			style={{ width, height }}
			animate={prefersReducedMotion ? {} : ANIMATION_VARIANTS.skeleton.animate}
		/>
	);
}

export function CardSkeleton({ className = "" }: { className?: string }) {
	return (
		<div
			className={`p-4 border-2 border-gray-200 rounded-lg bg-white ${className}`}
		>
			<Skeleton
				height="1.5rem"
				className="mb-3"
			/>
			<Skeleton
				height="1rem"
				className="mb-2"
			/>
			<Skeleton
				height="1rem"
				width="80%"
			/>
		</div>
	);
}

export function PlayerSkeleton({ className = "" }: { className?: string }) {
	return (
		<div
			className={`flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg bg-white ${className}`}
		>
			<Skeleton
				width="2.5rem"
				height="2.5rem"
				rounded
			/>
			<div className="flex-1">
				<Skeleton
					height="1rem"
					width="60%"
					className="mb-1"
				/>
				<Skeleton
					height="0.75rem"
					width="40%"
				/>
			</div>
			<Skeleton
				width="2rem"
				height="1.5rem"
			/>
		</div>
	);
}

export function GameInterfaceSkeleton() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
			{/* Header skeleton */}
			<div className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Skeleton
							width="8rem"
							height="1.5rem"
						/>
						<Skeleton
							width="6rem"
							height="2rem"
						/>
						<Skeleton
							width="4rem"
							height="1rem"
						/>
					</div>
				</div>
			</div>

			{/* Main content skeleton */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Main area skeleton */}
					<div className="lg:col-span-3 space-y-6">
						<Skeleton
							height="3rem"
							className="mb-4"
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<CardSkeleton key={i} />
							))}
						</div>
					</div>

					{/* Sidebar skeleton */}
					<div className="lg:col-span-1 space-y-6">
						<div className="bg-white rounded-lg shadow-sm border p-4">
							<Skeleton
								height="1.5rem"
								className="mb-4"
							/>
							<div className="space-y-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<PlayerSkeleton key={i} />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function LoadingSpinner({
	size = "md",
	className = "",
}: {
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	return (
		<motion.div
			className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizeClasses[size]} ${className}`}
			animate={{ rotate: 360 }}
			transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
		/>
	);
}

export function AIGenerationLoader({ className = "" }: { className?: string }) {
	const prefersReducedMotion = useReducedMotion();
	const { isMobile } = useResponsive();

	const loadingMessages = [
		"Creating hilarious prompts and responses...",
		"Teaching AI the art of comedy...",
		"Generating the perfect card combinations...",
		"Consulting the comedy database...",
		"Crafting witty responses...",
	];

	const [currentMessage, setCurrentMessage] = React.useState(0);

	React.useEffect(() => {
		if (prefersReducedMotion) return;

		const interval = setInterval(() => {
			setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
		}, 2000);

		return () => clearInterval(interval);
	}, [prefersReducedMotion, loadingMessages.length]);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			className={`text-center ${isMobile ? "py-6" : "py-8"} ${className}`}
		>
			{/* AI Robot Animation */}
			<motion.div
				animate={
					prefersReducedMotion
						? {}
						: {
								scale: [1, 1.1, 1],
								rotate: [0, 5, -5, 0],
						  }
				}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: "easeInOut",
				}}
				className={`${isMobile ? "text-4xl" : "text-6xl"} mb-4`}
			>
				🤖
			</motion.div>

			{/* Title */}
			<h3
				className={`font-semibold text-gray-900 mb-2 ${
					isMobile ? "text-base" : "text-lg"
				}`}
			>
				AI is Generating Cards
			</h3>

			{/* Dynamic loading message */}
			<motion.p
				key={currentMessage}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				className={`text-gray-600 mb-4 ${isMobile ? "text-sm" : "text-base"}`}
			>
				{loadingMessages[currentMessage]}
			</motion.p>

			{/* Loading dots */}
			<div className="flex justify-center space-x-1 mb-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<motion.div
						key={i}
						className="w-2 h-2 bg-purple-500 rounded-full"
						animate={
							prefersReducedMotion
								? {}
								: {
										y: [0, -10, 0],
								  }
						}
						transition={{
							duration: 0.6,
							repeat: Infinity,
							delay: i * 0.2,
						}}
					/>
				))}
			</div>

			{/* Progress indicator */}
			<div
				className={`mx-auto bg-gray-200 rounded-full overflow-hidden ${
					isMobile ? "w-32 h-1" : "w-48 h-2"
				}`}
			>
				<motion.div
					className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
					animate={
						prefersReducedMotion
							? {}
							: {
									x: ["-100%", "100%"],
							  }
					}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					style={{ width: "50%" }}
				/>
			</div>

			{/* Mobile tip */}
			{isMobile && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
					className="text-xs text-gray-500 mt-4 bg-gray-50 rounded-lg p-2"
				>
					💡 This usually takes 10-15 seconds
				</motion.p>
			)}
		</motion.div>
	);
}
