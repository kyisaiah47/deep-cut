import { useState, useEffect, useCallback, useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "./useGameActions";
import { Submission, Vote, Card } from "@/types/game";
import { supabase } from "@/lib/supabase";
import { GAME_PHASES } from "@/lib/constants";
import { GameError, GameStateError } from "@/lib/error-handling";

interface SubmissionWithCards extends Submission {
	promptCard: Card;
	responseCardsData: Card[];
}

interface VotingStatus {
	hasVoted: boolean;
	canVote: boolean;
	timeRemaining: number;
	voteCount: number;
	eligibleVoters: number;
	allVoted: boolean;
}

interface VoteResults {
	submissions: SubmissionWithCards[];
	winners: SubmissionWithCards[];
	maxVotes: number;
	totalVotes: number;
}

interface UseVotingManagementOptions {
	onVotingComplete?: () => void;
	onError?: (error: GameError) => void;
	autoVoteOnTimeout?: boolean;
}

interface VotingManagementHook {
	// State
	selectedSubmissionId: string | null;
	isVoting: boolean;
	votingError: string | null;
	votingStatus: VotingStatus;

	// Data
	availableSubmissions: SubmissionWithCards[];
	voteResults: VoteResults | null;
	playerVote: Vote | null;

	// Actions
	selectSubmission: (submissionId: string) => void;
	clearSelection: () => void;
	submitVote: () => Promise<void>;
	getSubmissionVotes: (submissionId: string) => number;

	// Computed values
	canVote: boolean;
	hasValidSelection: boolean;
	isVotingPhase: boolean;
	showResults: boolean;
}

export function useVotingManagement({
	onVotingComplete,
	onError,
	autoVoteOnTimeout = true,
}: UseVotingManagementOptions = {}): VotingManagementHook {
	const { gameState, currentPlayer, submissions, players, currentRoundCards } =
		useGame();

	// TODO: This should be moved to GameContext for better performance
	const [votes, setVotes] = useState<Vote[]>([]);

	// Fetch votes for current game
	useEffect(() => {
		if (!gameState) return;

		const fetchVotes = async () => {
			const { data, error } = await supabase
				.from("votes")
				.select("*")
				.eq("game_id", gameState.id);

			if (!error && data) {
				setVotes(data);
			}
		};

		fetchVotes();
	}, [gameState]);

	const { submitVote: submitVoteAction } = useGameActions({ onError });

	const [selectedSubmissionId, setSelectedSubmissionId] = useState<
		string | null
	>(null);
	const [isVoting, setIsVoting] = useState(false);
	const [votingError, setVotingError] = useState<string | null>(null);

	// Reset state when round changes
	useEffect(() => {
		setSelectedSubmissionId(null);
		setVotingError(null);
		setIsVoting(false);
	}, [gameState?.current_round]);

	// Check if in voting phase
	const isVotingPhase = useMemo(() => {
		return gameState?.phase === GAME_PHASES.VOTING;
	}, [gameState?.phase]);

	// Get current player's vote for this round
	const playerVote = useMemo(() => {
		if (!currentPlayer || !gameState) return null;

		return (
			votes.find(
				(vote) =>
					vote.player_id === currentPlayer.id &&
					vote.round_number === gameState.current_round
			) || null
		);
	}, [votes, currentPlayer, gameState]);

	// Get submissions available for voting (excluding player's own)
	const availableSubmissions = useMemo((): SubmissionWithCards[] => {
		if (!gameState || !currentPlayer) return [];

		return submissions
			.filter(
				(sub) =>
					sub.round_number === gameState.current_round &&
					sub.player_id !== currentPlayer.id
			)
			.map((submission) => {
				// Find the prompt card
				const promptCard = currentRoundCards.find(
					(card) => card.id === submission.prompt_card_id
				);

				// Get response cards from submission data
				const responseCardsData = submission.response_cards || [];

				return {
					...submission,
					promptCard: promptCard || {
						id: submission.prompt_card_id,
						game_id: submission.game_id,
						round_number: submission.round_number,
						type: "prompt" as const,
						text: "Unknown prompt",
						created_at: "",
					},
					responseCardsData,
				};
			});
	}, [submissions, gameState, currentPlayer, currentRoundCards]);

	// Calculate voting status
	const votingStatus = useMemo((): VotingStatus => {
		if (!gameState || !currentPlayer) {
			return {
				hasVoted: false,
				canVote: false,
				timeRemaining: 0,
				voteCount: 0,
				eligibleVoters: 0,
				allVoted: false,
			};
		}

		const hasVoted = !!playerVote;

		// Eligible voters are players who didn't submit in this round
		const submissionPlayerIds = submissions
			.filter((sub) => sub.round_number === gameState.current_round)
			.map((sub) => sub.player_id);

		const eligibleVoters = players.filter(
			(player) =>
				!submissionPlayerIds.includes(player.id) && player.is_connected
		);

		const currentRoundVotes = votes.filter(
			(vote) => vote.round_number === gameState.current_round
		);

		const canVote =
			!hasVoted &&
			isVotingPhase &&
			availableSubmissions.length > 0 &&
			eligibleVoters.some((voter) => voter.id === currentPlayer.id);

		return {
			hasVoted,
			canVote,
			timeRemaining: gameState.voting_timer || 0,
			voteCount: currentRoundVotes.length,
			eligibleVoters: eligibleVoters.length,
			allVoted: currentRoundVotes.length >= eligibleVoters.length,
		};
	}, [
		gameState,
		currentPlayer,
		playerVote,
		submissions,
		players,
		votes,
		isVotingPhase,
		availableSubmissions,
	]);

	// Calculate vote results
	const voteResults = useMemo((): VoteResults | null => {
		if (!gameState || availableSubmissions.length === 0) return null;

		// Sort submissions by vote count
		const sortedSubmissions = [...availableSubmissions].sort(
			(a, b) => b.votes - a.votes
		);

		const maxVotes = sortedSubmissions[0]?.votes || 0;
		const winners = sortedSubmissions.filter((sub) => sub.votes === maxVotes);
		const totalVotes = sortedSubmissions.reduce(
			(sum, sub) => sum + sub.votes,
			0
		);

		return {
			submissions: sortedSubmissions,
			winners,
			maxVotes,
			totalVotes,
		};
	}, [gameState, availableSubmissions]);

	// Determine if should show results
	const showResults = useMemo(() => {
		return votingStatus.allVoted || gameState?.phase === GAME_PHASES.RESULTS;
	}, [votingStatus.allVoted, gameState?.phase]);

	// Check if current selection is valid
	const hasValidSelection = useMemo(() => {
		return (
			selectedSubmissionId !== null &&
			availableSubmissions.some((sub) => sub.id === selectedSubmissionId)
		);
	}, [selectedSubmissionId, availableSubmissions]);

	// Check if can vote
	const canVote = useMemo(() => {
		return votingStatus.canVote && hasValidSelection && !isVoting;
	}, [votingStatus.canVote, hasValidSelection, isVoting]);

	// Select a submission
	const selectSubmission = useCallback(
		(submissionId: string) => {
			if (votingStatus.hasVoted) return;

			const submission = availableSubmissions.find(
				(sub) => sub.id === submissionId
			);
			if (!submission) return;

			setSelectedSubmissionId(submissionId);
			setVotingError(null);
		},
		[votingStatus.hasVoted, availableSubmissions]
	);

	// Clear selection
	const clearSelection = useCallback(() => {
		setSelectedSubmissionId(null);
		setVotingError(null);
	}, []);

	// Submit vote
	const submitVote = useCallback(async () => {
		if (!hasValidSelection || !gameState || !currentPlayer) {
			setVotingError("Please select a submission to vote for");
			return;
		}

		if (votingStatus.hasVoted) {
			setVotingError("You have already voted this round");
			return;
		}

		setIsVoting(true);
		setVotingError(null);

		try {
			await submitVoteAction(selectedSubmissionId!);
			onVotingComplete?.();
		} catch (error) {
			const errorMessage =
				error instanceof GameError ? error.message : "Failed to submit vote";
			setVotingError(errorMessage);
			onError?.(
				error instanceof GameError ? error : new GameStateError(errorMessage)
			);
		} finally {
			setIsVoting(false);
		}
	}, [
		hasValidSelection,
		gameState,
		currentPlayer,
		votingStatus.hasVoted,
		selectedSubmissionId,
		submitVoteAction,
		onVotingComplete,
		onError,
	]);

	// Get vote count for a specific submission
	const getSubmissionVotes = useCallback(
		(submissionId: string): number => {
			const submission = availableSubmissions.find(
				(sub) => sub.id === submissionId
			);
			return submission?.votes || 0;
		},
		[availableSubmissions]
	);

	// Auto-vote when timer expires (if enabled)
	useEffect(() => {
		if (
			!autoVoteOnTimeout ||
			votingStatus.hasVoted ||
			!votingStatus.canVote ||
			availableSubmissions.length === 0
		) {
			return;
		}

		// Auto-select first submission if none selected
		if (!selectedSubmissionId) {
			setSelectedSubmissionId(availableSubmissions[0].id);
		}
	}, [
		autoVoteOnTimeout,
		votingStatus.hasVoted,
		votingStatus.canVote,
		availableSubmissions,
		selectedSubmissionId,
	]);

	// Handle automatic vote tallying when all votes are in
	useEffect(() => {
		if (votingStatus.allVoted && gameState?.phase === "voting") {
			// All votes are in, trigger completion
			onVotingComplete?.();
		}
	}, [votingStatus.allVoted, gameState?.phase, onVotingComplete]);

	return {
		// State
		selectedSubmissionId,
		isVoting,
		votingError,
		votingStatus,

		// Data
		availableSubmissions,
		voteResults,
		playerVote,

		// Actions
		selectSubmission,
		clearSelection,
		submitVote,
		getSubmissionVotes,

		// Computed values
		canVote,
		hasValidSelection,
		isVotingPhase,
		showResults,
	};
}
