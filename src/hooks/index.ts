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

// Re-export context hooks for convenience
export {
	useGame,
	useCurrentPlayer,
	useIsHost,
	useGamePhase,
} from "../contexts/GameContext";
