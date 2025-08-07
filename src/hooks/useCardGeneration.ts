import { useState, useCallback, useEffect } from "react";
import {
	generateCards,
	getCardsForRound,
	getPromptCard,
	getResponseCards,
	getPlayerCards,
	distributeCardsToPlayers,
	clearExpiredCache,
	GenerateCardsOptions,
	GeneratedCardsResult,
} from "../lib/card-generation";
import { Database } from "../lib/database.types";

type Card = Database["public"]["Tables"]["cards"]["Row"];

export interface UseCardGenerationReturn {
	// State
	isGenerating: boolean;
	generationError: string | null;
	lastGenerationResult: GeneratedCardsResult | null;

	// Actions
	generateCardsForRound: (
		options: GenerateCardsOptions
	) => Promise<GeneratedCardsResult>;
	clearError: () => void;
	clearCache: () => void;
}

export function useCardGeneration(): UseCardGenerationReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [lastGenerationResult, setLastGenerationResult] =
		useState<GeneratedCardsResult | null>(null);

	const generateCardsForRound = useCallback(
		async (options: GenerateCardsOptions): Promise<GeneratedCardsResult> => {
			setIsGenerating(true);
			setGenerationError(null);

			try {
				const result = await generateCards(options);
				setLastGenerationResult(result);

				if (!result.success) {
					setGenerationError(result.error || "Failed to generate cards");
				}

				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error occurred";
				setGenerationError(errorMessage);

				const failureResult: GeneratedCardsResult = {
					success: false,
					cardsGenerated: 0,
					responseCardsCount: 0,
					error: errorMessage,
				};

				setLastGenerationResult(failureResult);
				return failureResult;
			} finally {
				setIsGenerating(false);
			}
		},
		[]
	);

	const clearError = useCallback(() => {
		setGenerationError(null);
	}, []);

	const clearCache = useCallback(() => {
		clearExpiredCache();
	}, []);

	// Clear expired cache entries periodically
	useEffect(() => {
		const interval = setInterval(() => {
			clearExpiredCache();
		}, 60000); // Clear every minute

		return () => clearInterval(interval);
	}, []);

	return {
		isGenerating,
		generationError,
		lastGenerationResult,
		generateCardsForRound,
		clearError,
		clearCache,
	};
}

export interface UseGameCardsReturn {
	// State
	cards: Card[];
	promptCard: Card | null;
	responseCards: Card[];
	playerCards: Card[];
	isLoading: boolean;
	error: string | null;

	// Actions
	loadCardsForRound: (gameId: string, roundNumber: number) => Promise<void>;
	loadPlayerCards: (
		gameId: string,
		roundNumber: number,
		playerId: string
	) => Promise<void>;
	distributeCards: (
		gameId: string,
		roundNumber: number,
		playerIds: string[],
		cardsPerPlayer?: number
	) => Promise<void>;
	refreshCards: () => Promise<void>;
	clearError: () => void;
}

export function useGameCards(): UseGameCardsReturn {
	const [cards, setCards] = useState<Card[]>([]);
	const [promptCard, setPromptCard] = useState<Card | null>(null);
	const [responseCards, setResponseCards] = useState<Card[]>([]);
	const [playerCards, setPlayerCards] = useState<Card[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentGameId, setCurrentGameId] = useState<string | null>(null);
	const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(
		null
	);
	const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

	const loadCardsForRound = useCallback(
		async (gameId: string, roundNumber: number) => {
			setIsLoading(true);
			setError(null);
			setCurrentGameId(gameId);
			setCurrentRoundNumber(roundNumber);

			try {
				const [allCards, prompt, responses] = await Promise.all([
					getCardsForRound(gameId, roundNumber),
					getPromptCard(gameId, roundNumber),
					getResponseCards(gameId, roundNumber),
				]);

				setCards(allCards);
				setPromptCard(prompt);
				setResponseCards(responses);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load cards";
				setError(errorMessage);
				console.error("Error loading cards:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const loadPlayerCards = useCallback(
		async (gameId: string, roundNumber: number, playerId: string) => {
			setIsLoading(true);
			setError(null);
			setCurrentPlayerId(playerId);

			try {
				const cards = await getPlayerCards(gameId, roundNumber, playerId);
				setPlayerCards(cards);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load player cards";
				setError(errorMessage);
				console.error("Error loading player cards:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const distributeCards = useCallback(
		async (
			gameId: string,
			roundNumber: number,
			playerIds: string[],
			cardsPerPlayer: number = 5
		) => {
			setIsLoading(true);
			setError(null);

			try {
				await distributeCardsToPlayers(
					gameId,
					roundNumber,
					playerIds,
					cardsPerPlayer
				);

				// Refresh cards after distribution
				if (currentGameId === gameId && currentRoundNumber === roundNumber) {
					await loadCardsForRound(gameId, roundNumber);
				}

				// Refresh player cards if we have a current player
				if (currentPlayerId && playerIds.includes(currentPlayerId)) {
					await loadPlayerCards(gameId, roundNumber, currentPlayerId);
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to distribute cards";
				setError(errorMessage);
				console.error("Error distributing cards:", err);
			} finally {
				setIsLoading(false);
			}
		},
		[
			currentGameId,
			currentRoundNumber,
			currentPlayerId,
			loadCardsForRound,
			loadPlayerCards,
		]
	);

	const refreshCards = useCallback(async () => {
		if (currentGameId && currentRoundNumber) {
			await loadCardsForRound(currentGameId, currentRoundNumber);

			if (currentPlayerId) {
				await loadPlayerCards(
					currentGameId,
					currentRoundNumber,
					currentPlayerId
				);
			}
		}
	}, [
		currentGameId,
		currentRoundNumber,
		currentPlayerId,
		loadCardsForRound,
		loadPlayerCards,
	]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		cards,
		promptCard,
		responseCards,
		playerCards,
		isLoading,
		error,
		loadCardsForRound,
		loadPlayerCards,
		distributeCards,
		refreshCards,
		clearError,
	};
}

export interface UseCardDistributionReturn {
	// State
	isDistributing: boolean;
	distributionError: string | null;
	distributionComplete: boolean;

	// Actions
	distributeCardsToAllPlayers: (
		gameId: string,
		roundNumber: number,
		playerIds: string[],
		cardsPerPlayer?: number
	) => Promise<boolean>;
	resetDistribution: () => void;
	clearError: () => void;
}

export function useCardDistribution(): UseCardDistributionReturn {
	const [isDistributing, setIsDistributing] = useState(false);
	const [distributionError, setDistributionError] = useState<string | null>(
		null
	);
	const [distributionComplete, setDistributionComplete] = useState(false);

	const distributeCardsToAllPlayers = useCallback(
		async (
			gameId: string,
			roundNumber: number,
			playerIds: string[],
			cardsPerPlayer: number = 5
		): Promise<boolean> => {
			setIsDistributing(true);
			setDistributionError(null);
			setDistributionComplete(false);

			try {
				await distributeCardsToPlayers(
					gameId,
					roundNumber,
					playerIds,
					cardsPerPlayer
				);
				setDistributionComplete(true);
				return true;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to distribute cards";
				setDistributionError(errorMessage);
				console.error("Card distribution error:", error);
				return false;
			} finally {
				setIsDistributing(false);
			}
		},
		[]
	);

	const resetDistribution = useCallback(() => {
		setDistributionComplete(false);
		setDistributionError(null);
	}, []);

	const clearError = useCallback(() => {
		setDistributionError(null);
	}, []);

	return {
		isDistributing,
		distributionError,
		distributionComplete,
		distributeCardsToAllPlayers,
		resetDistribution,
		clearError,
	};
}
