// Export all game-related hooks
export { useGameState } from "./useGameState";
export {
	useRealtimeSubscription,
	broadcastGameEvent,
} from "./useRealtimeSubscription";
export { useGameActions } from "./useGameActions";

// Re-export context hooks for convenience
export {
	useGame,
	useCurrentPlayer,
	useIsHost,
	useGamePhase,
} from "../contexts/GameContext";
