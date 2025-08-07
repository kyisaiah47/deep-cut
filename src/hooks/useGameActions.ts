import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { GameState } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";
import {
	canPlayerPerformAction,
	canTransitionToPhase,
	getNextPhase,
} from "@/lib/game-utils";
import { useGame } from "@/contexts/GameContext";

interface UseGameActionsOptions {
	onError?: (error: GameError) => void;
}

interface GameActionsHook {
	// Game flow actions
	startGame: () => Promise<void>;
	transitionToNextPhase: () => Promise<void>;
	transitionToPhase: (phase: GameState["phase"]) => Promise<void>;

	// Player actions
	submitCards: (
		promptCardId: string,
		responseCardIds: string[]
	) => Promise<void>;
	voteForSubmission: (submissionId: string) => Promise<void>;

	// Host actions
	updateGameSettings: (settings: Partial<GameState>) => Promise<void>;
	kickPlayer: (playerId: string) => Promise<void>;

	// Utility actions
	leaveGame: () => Promise<void>;
	reconnectToGame: () => Promise<void>;
}

export function useGameActions({
	onError,
}: UseGameActionsOptions = {}): GameActionsHook {
	const {
		gameState,
		players,
		submissions,
		currentPlayer,
		isHost,
		updateGamePhase,
		refetchGameState,
		broadcastEvent,
	} = useGame();

	const handleError = useCallback(
		(error: GameError) => {
			onError?.(error);
		},
		[onError]
	);

	// Start the game (transition from lobby to distribution)
	const startGame = useCallback(async () => {
		if (!gameState || !currentPlayer) {
			throw new GameStateError("Game state not available");
		}

		const actionCheck = canPlayerPerformAction(
			"start_game",
			currentPlayer.id,
			gameState,
			players
		);

		if (!actionCheck.canPerform) {
			throw new GameStateError(actionCheck.reason || "Cannot start game");
		}

		try {
			await updateGamePhase("distribution");
			await broadcastEvent({
				type: "phase_change",
				data: { phase: "distribution", round: gameState.current_round },
			});
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to start game");
			handleError(gameError);
			throw gameError;
		}
	}, [
		gameState,
		currentPlayer,
		players,
		updateGamePhase,
		broadcastEvent,
		handleError,
	]);

	// Transition to a specific phase
	const transitionToPhase = useCallback(
		async (targetPhase: GameState["phase"]) => {
			if (!gameState || !currentPlayer) {
				throw new GameStateError("Game state not available");
			}

			const transitionCheck = canTransitionToPhase(
				gameState.phase,
				targetPhase,
				gameState,
				players,
				submissions
			);

			if (!transitionCheck.canTransition) {
				throw new GameStateError(
					transitionCheck.reason || "Cannot transition to phase"
				);
			}

			try {
				// Handle special phase transitions
				if (targetPhase === "distribution" && gameState.phase === "results") {
					// Starting new round
					const { error: roundError } = await supabase
						.from("games")
						.update({
							current_round: gameState.current_round + 1,
							phase: targetPhase,
							updated_at: new Date().toISOString(),
						})
						.eq("id", gameState.id);

					if (roundError) {
						throw new GameStateError(
							`Failed to start new round: ${roundError.message}`
						);
					}
				} else {
					await updateGamePhase(targetPhase);
				}

				await broadcastEvent({
					type: "phase_change",
					data: {
						phase: targetPhase,
						round: gameState.current_round,
						previousPhase: gameState.phase,
					},
				});
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to transition phase");
				handleError(gameError);
				throw gameError;
			}
		},
		[
			gameState,
			currentPlayer,
			players,
			submissions,
			updateGamePhase,
			broadcastEvent,
			handleError,
		]
	);

	// Transition to the next logical phase
	const transitionToNextPhase = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		const nextPhase = getNextPhase(gameState.phase) as GameState["phase"];
		await transitionToPhase(nextPhase);
	}, [gameState, transitionToPhase]);

	// Submit cards for the current round
	const submitCards = useCallback(
		async (promptCardId: string, responseCardIds: string[]) => {
			if (!gameState || !currentPlayer) {
				throw new GameStateError("Game state not available");
			}

			const actionCheck = canPlayerPerformAction(
				"submit",
				currentPlayer.id,
				gameState,
				players,
				submissions
			);

			if (!actionCheck.canPerform) {
				throw new GameStateError(actionCheck.reason || "Cannot submit cards");
			}

			if (responseCardIds.length === 0) {
				throw new GameStateError("Must select at least one response card");
			}

			try {
				// Get the response cards data
				const { data: responseCards, error: cardsError } = await supabase
					.from("cards")
					.select("*")
					.in("id", responseCardIds)
					.eq("player_id", currentPlayer.id);

				if (cardsError) {
					throw new GameStateError(
						`Failed to fetch response cards: ${cardsError.message}`
					);
				}

				if (!responseCards || responseCards.length !== responseCardIds.length) {
					throw new GameStateError("Invalid response cards selected");
				}

				// Create submission
				const { error: submissionError } = await supabase
					.from("submissions")
					.insert({
						game_id: gameState.id,
						player_id: currentPlayer.id,
						round_number: gameState.current_round,
						prompt_card_id: promptCardId,
						response_cards: responseCards,
						votes: 0,
					});

				if (submissionError) {
					throw new GameStateError(
						`Failed to submit cards: ${submissionError.message}`
					);
				}

				await broadcastEvent({
					type: "submission_received",
					data: {
						playerId: currentPlayer.id,
						playerName: currentPlayer.name,
						round: gameState.current_round,
					},
				});
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to submit cards");
				handleError(gameError);
				throw gameError;
			}
		},
		[
			gameState,
			currentPlayer,
			players,
			submissions,
			broadcastEvent,
			handleError,
		]
	);

	// Vote for a submission
	const voteForSubmission = useCallback(
		async (submissionId: string) => {
			if (!gameState || !currentPlayer) {
				throw new GameStateError("Game state not available");
			}

			const actionCheck = canPlayerPerformAction(
				"vote",
				currentPlayer.id,
				gameState,
				players
			);

			if (!actionCheck.canPerform) {
				throw new GameStateError(actionCheck.reason || "Cannot vote");
			}

			try {
				// Check if player already voted this round
				const { data: existingVote, error: voteCheckError } = await supabase
					.from("votes")
					.select("id")
					.eq("player_id", currentPlayer.id)
					.eq("game_id", gameState.id)
					.eq("round_number", gameState.current_round)
					.single();

				if (voteCheckError && voteCheckError.code !== "PGRST116") {
					// PGRST116 = no rows returned
					throw new GameStateError(
						`Failed to check existing vote: ${voteCheckError.message}`
					);
				}

				if (existingVote) {
					throw new GameStateError("You have already voted this round");
				}

				// Verify submission exists and is not from the same player
				const { data: submission, error: submissionError } = await supabase
					.from("submissions")
					.select("player_id")
					.eq("id", submissionId)
					.eq("game_id", gameState.id)
					.eq("round_number", gameState.current_round)
					.single();

				if (submissionError) {
					throw new GameStateError(
						`Invalid submission: ${submissionError.message}`
					);
				}

				if (submission.player_id === currentPlayer.id) {
					throw new GameStateError("Cannot vote for your own submission");
				}

				// Create vote
				const { error: voteError } = await supabase.from("votes").insert({
					game_id: gameState.id,
					player_id: currentPlayer.id,
					submission_id: submissionId,
					round_number: gameState.current_round,
				});

				if (voteError) {
					throw new GameStateError(
						`Failed to record vote: ${voteError.message}`
					);
				}

				// Update submission vote count
				const { error: updateError } = await supabase.rpc(
					"increment_submission_votes",
					{
						submission_id: submissionId,
					}
				);

				if (updateError) {
					throw new GameStateError(
						`Failed to update vote count: ${updateError.message}`
					);
				}

				await broadcastEvent({
					type: "submission_received", // Using generic event for vote updates
					data: {
						type: "vote",
						submissionId,
						voterId: currentPlayer.id,
						round: gameState.current_round,
					},
				});
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to vote");
				handleError(gameError);
				throw gameError;
			}
		},
		[gameState, currentPlayer, players, broadcastEvent, handleError]
	);

	// Update game settings (host only)
	const updateGameSettings = useCallback(
		async (settings: Partial<GameState>) => {
			if (!gameState || !currentPlayer) {
				throw new GameStateError("Game state not available");
			}

			const actionCheck = canPlayerPerformAction(
				"change_settings",
				currentPlayer.id,
				gameState,
				players
			);

			if (!actionCheck.canPerform) {
				throw new GameStateError(
					actionCheck.reason || "Cannot change settings"
				);
			}

			try {
				const { error: updateError } = await supabase
					.from("games")
					.update({
						...settings,
						updated_at: new Date().toISOString(),
					})
					.eq("id", gameState.id);

				if (updateError) {
					throw new GameStateError(
						`Failed to update settings: ${updateError.message}`
					);
				}

				await broadcastEvent({
					type: "phase_change", // Using phase_change for settings updates
					data: {
						type: "settings_updated",
						settings,
						updatedBy: currentPlayer.id,
					},
				});
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to update settings");
				handleError(gameError);
				throw gameError;
			}
		},
		[gameState, currentPlayer, players, broadcastEvent, handleError]
	);

	// Kick a player (host only)
	const kickPlayer = useCallback(
		async (playerId: string) => {
			if (!gameState || !currentPlayer || !isHost) {
				throw new GameStateError("Insufficient permissions to kick player");
			}

			if (playerId === currentPlayer.id) {
				throw new GameStateError("Cannot kick yourself");
			}

			try {
				const { error: kickError } = await supabase
					.from("players")
					.delete()
					.eq("id", playerId)
					.eq("game_id", gameState.id);

				if (kickError) {
					throw new GameStateError(
						`Failed to kick player: ${kickError.message}`
					);
				}

				await broadcastEvent({
					type: "player_left",
					data: {
						playerId,
						kicked: true,
						kickedBy: currentPlayer.id,
					},
				});
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to kick player");
				handleError(gameError);
				throw gameError;
			}
		},
		[gameState, currentPlayer, isHost, broadcastEvent, handleError]
	);

	// Leave the game
	const leaveGame = useCallback(async () => {
		if (!gameState || !currentPlayer) {
			throw new GameStateError("Game state not available");
		}

		try {
			// If host is leaving, transfer host to another player
			if (isHost && players.length > 1) {
				const nextHost = players.find(
					(p) => p.id !== currentPlayer.id && p.is_connected
				);
				if (nextHost) {
					const { error: hostError } = await supabase
						.from("games")
						.update({ host_id: nextHost.id })
						.eq("id", gameState.id);

					if (hostError) {
						console.error("Failed to transfer host:", hostError);
					}
				}
			}

			// Remove player from game
			const { error: leaveError } = await supabase
				.from("players")
				.delete()
				.eq("id", currentPlayer.id)
				.eq("game_id", gameState.id);

			if (leaveError) {
				throw new GameStateError(`Failed to leave game: ${leaveError.message}`);
			}

			await broadcastEvent({
				type: "player_left",
				data: {
					playerId: currentPlayer.id,
					playerName: currentPlayer.name,
				},
			});
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to leave game");
			handleError(gameError);
			throw gameError;
		}
	}, [gameState, currentPlayer, isHost, players, broadcastEvent, handleError]);

	// Reconnect to game
	const reconnectToGame = useCallback(async () => {
		try {
			await refetchGameState();
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to reconnect");
			handleError(gameError);
			throw gameError;
		}
	}, [refetchGameState, handleError]);

	return {
		startGame,
		transitionToNextPhase,
		transitionToPhase,
		submitCards,
		voteForSubmission,
		updateGameSettings,
		kickPlayer,
		leaveGame,
		reconnectToGame,
	};
}
