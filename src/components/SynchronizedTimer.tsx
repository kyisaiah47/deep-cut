"use client";

import React from "react";
import { Timer } from "./Timer";
import { useTimerManagement } from "@/hooks/useTimerManagement";
import { useAutoActions } from "@/hooks/useAutoActions";
import { useGame } from "@/contexts/GameContext";
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

	// Get phase-specific label
	const getPhaseLabel = (currentPhase: GameState["phase"] | null) => {
		switch (currentPhase) {
			case "submission":
				return "Submission Time";
			case "voting":
				return "Voting Time";
			default:
				return "Timer";
		}
	};

	// Only show controls for hosts
	const shouldShowControls = showControls && isHost;

	if (!gameState || !isActive) {
		return null;
	}

	return (
		<Timer
			duration={duration}
			timeRemaining={timeRemaining}
			onExpire={() => phase && handleTimerExpire(phase)}
			isActive={isActive}
			isPaused={isPaused}
			label={getPhaseLabel(phase)}
			showProgress={true}
			showControls={shouldShowControls}
			onPause={shouldShowControls ? pauseTimer : undefined}
			onResume={shouldShowControls ? resumeTimer : undefined}
			className={className}
		/>
	);
}
