"use client";

import React from "react";
import { motion } from "framer-motion";
import { Timer } from "./Timer";
import { useTimerManagement } from "@/hooks/useTimerManagement";
import { useAutoActions } from "@/hooks/useAutoActions";
import { useGame } from "@/contexts/GameContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { GameState } from "@/types/game";

interface SynchronizedTimerProps {
	onPhaseTransition?: (phase: GameState["phase"]) => void;
	showControls?: boolean;
	className?: string;
}

export function SynchronizedTimer({
	onPhaseTransition,
	showControls = false,
	className = "",
}: SynchronizedTimerProps) {
	const { gameState, isHost } = useGame();
	const { handleAutoSubmission, handleAutoVoting } = useAutoActions();
	const { isMobile } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

	const handleTimerExpire = (phase: GameState["phase"]) => {
		console.log(`Timer expired for phase: ${phase}`);
		onPhaseTransition?.(phase);
	};

	const {
		timeRemaining,
		isActive,
		isPaused,
		phase,
		duration,
		pauseTimer,
		resumeTimer,
	} = useTimerManagement({
		gameId: gameState?.id || "",
		gameState,
		onTimerExpire: handleTimerExpire,
		onAutoSubmission: handleAutoSubmission,
		onAutoVoting: handleAutoVoting,
		onError: (error) => {
			console.error("Timer management error:", error);
		},
	});

	// Get phase-specific label and emoji
	const getPhaseInfo = (currentPhase: GameState["phase"] | null) => {
		switch (currentPhase) {
			case "submission":
				return { label: isMobile ? "Submit" : "Submission Time", emoji: "✏️" };
			case "voting":
				return { label: isMobile ? "Vote" : "Voting Time", emoji: "🗳️" };
			default:
				return { label: "Timer", emoji: "⏱️" };
		}
	};

	// Only show controls for hosts
	const shouldShowControls = showControls && isHost;

	if (!gameState || !isActive) {
		return null;
	}

	const phaseInfo = getPhaseInfo(phase);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className={`${className}`}
		>
			{/* Phase indicator for mobile */}
			{isMobile && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-2"
				>
					<span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
						{phaseInfo.emoji} {phaseInfo.label}
					</span>
				</motion.div>
			)}

			<Timer
				duration={duration}
				timeRemaining={timeRemaining}
				onExpire={() => phase && handleTimerExpire(phase)}
				isActive={isActive}
				isPaused={isPaused}
				label={!isMobile ? phaseInfo.label : undefined}
				showProgress={true}
				showControls={shouldShowControls}
				onPause={shouldShowControls ? pauseTimer : undefined}
				onResume={shouldShowControls ? resumeTimer : undefined}
				className="flex flex-col items-center"
			/>

			{/* Mobile-specific timer warnings */}
			{isMobile && timeRemaining <= 10 && timeRemaining > 0 && !isPaused && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={
						prefersReducedMotion
							? { opacity: 1, scale: 1 }
							: {
									opacity: 1,
									scale: [0.8, 1.1, 1],
							  }
					}
					transition={{
						duration: 0.3,
						repeat: prefersReducedMotion ? 0 : Infinity,
						repeatDelay: 1,
					}}
					className="mt-2 text-center"
				>
					<span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full animate-pulse">
						⚠️ Hurry up!
					</span>
				</motion.div>
			)}
		</motion.div>
	);
}
