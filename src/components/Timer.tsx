"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TimerProps {
	duration: number; // Duration in seconds
	onExpire: () => void;
	isActive: boolean;
	label?: string;
	showProgress?: boolean;
	className?: string;
}

export function Timer({
	duration,
	onExpire,
	isActive,
	label,
	showProgress = true,
	className = "",
}: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [isExpired, setIsExpired] = useState(false);

	// Reset timer when duration changes or becomes active
	useEffect(() => {
		if (isActive) {
			setTimeLeft(duration);
			setIsExpired(false);
		}
	}, [duration, isActive]);

	// Timer countdown logic
	useEffect(() => {
		if (!isActive || isExpired) return;

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsExpired(true);
					onExpire();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isActive, isExpired, onExpire]);

	// Format time display
	const formatTime = useCallback((seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}, []);

	// Calculate progress percentage
	const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

	// Determine color based on time remaining
	const getTimerColor = () => {
		const percentage = (timeLeft / duration) * 100;
		if (percentage > 50) return "text-green-600";
		if (percentage > 25) return "text-yellow-600";
		return "text-red-600";
	};

	const getProgressColor = () => {
		const percentage = (timeLeft / duration) * 100;
		if (percentage > 50) return "bg-green-500";
		if (percentage > 25) return "bg-yellow-500";
		return "bg-red-500";
	};

	if (!isActive) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className={`flex flex-col items-center space-y-2 ${className}`}
		>
			{label && (
				<span className="text-sm font-medium text-gray-600">{label}</span>
			)}

			<motion.div
				className={`text-2xl font-bold ${getTimerColor()}`}
				animate={{
					scale: timeLeft <= 10 && timeLeft > 0 ? [1, 1.1, 1] : 1,
				}}
				transition={{
					duration: 0.5,
					repeat: timeLeft <= 10 && timeLeft > 0 ? Infinity : 0,
				}}
			>
				{formatTime(timeLeft)}
			</motion.div>

			{showProgress && (
				<div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
					<motion.div
						className={`h-full ${getProgressColor()}`}
						initial={{ width: "0%" }}
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.3 }}
					/>
				</div>
			)}

			{timeLeft <= 5 && timeLeft > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-xs text-red-600 font-medium"
				>
					Time running out!
				</motion.div>
			)}
		</motion.div>
	);
}
