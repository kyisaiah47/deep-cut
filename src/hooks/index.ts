// Export all game-related hooks
export { useGameState } from "./useGameState";
export {
	useRealtimeSubscription,
	broadcastGameEvent,
} from "./useRealtimeSubscription";
export { useGameActions } from "./useGameActions";
export { usePlayerManagement } from "./usePlayerManagement";
export { usePlayerEvents, usePlayerNotifications } from "./usePlayerEvents";
export {
	useCardGeneration,
	useGameCards,
	useCardDistribution,
} from "./useCardGeneration";
export { useRoundManagement } from "./useRoundManagement";
export { useRoundOrchestrator } from "./useRoundOrchestrator";
export { useSubmissionManagement } from "./useSubmissionManagement";
export { useVotingManagement } from "./useVotingManagement";
export { useScoringManagement } from "./useScoringManagement";
export { useHostControls } from "./useHostControls";
export { useErrorRecovery, useAutoErrorRecovery } from "./useErrorRecovery";
export { useReducedMotion, useAnimationVariants } from "./useReducedMotion";
export {
	useResponsive,
	useResponsiveGrid,
	useTouchDevice,
} from "./useResponsive";

// Re-export context hooks for convenience
export {
	useGame,
	useCurrentPlayer,
	useIsHost,
	useGamePhase,
} from "../contexts/GameContext";
