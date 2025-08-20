"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import VoteSection from "../VoteSection";

interface VotingPhaseProps {
	groupCode: string;
	playerName: string;
	players: string[];
	round: number;
	shuffledEntries: { id: string; text: string }[];
	onAllVotesComplete: (votes: Record<string, string>) => void;
}

export default function VotingPhase({
	groupCode,
	playerName,
	players,
	round,
	shuffledEntries,
	onAllVotesComplete,
}: VotingPhaseProps) {
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [voteCompletionChecked, setVoteCompletionChecked] = useState(false);

	useEffect(() => {
		const fetchInitialVotes = async () => {
			const { data } = await supabase
				.from("votes")
				.select("voter_name, vote_for")
				.eq("room_code", groupCode)
				.eq("round_number", round);

			if (data) {
				const initial: Record<string, string> = {};
				for (const row of data) {
					initial[row.voter_name] = row.vote_for;
				}
				setVotes(initial);
			}
		};

		fetchInitialVotes();

		const voteChannel = supabase
			.channel(`votes-${groupCode}-${round}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "votes",
					filter: `room_code=eq.${groupCode},round_number=eq.${round}`,
				},
				(payload) => {
					if (
						payload.new?.room_code === groupCode &&
						payload.new?.round_number === round
					) {
						const { voter_name, vote_for } = payload.new;
						setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "votes",
					filter: `room_code=eq.${groupCode},round_number=eq.${round}`,
				},
				(payload) => {
					if (
						payload.new?.room_code === groupCode &&
						payload.new?.round_number === round
					) {
						const { voter_name, vote_for } = payload.new;
						setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(voteChannel);
		};
	}, [groupCode, round]);

	// Periodic check for vote completion (fallback for real-time issues)
	useEffect(() => {
		if (voteCompletionChecked) return;

		const checkVotes = async () => {
			const { data } = await supabase
				.from("votes")
				.select("voter_name, vote_for")
				.eq("room_code", groupCode)
				.eq("round_number", round);

			if (data) {
				const current: Record<string, string> = {};
				for (const row of data) {
					current[row.voter_name] = row.vote_for;
				}
				setVotes(current);
			}
		};

		const interval = setInterval(checkVotes, 2000); // Check every 2 seconds

		return () => clearInterval(interval);
	}, [groupCode, round, voteCompletionChecked]);

	useEffect(() => {
		if (Object.keys(votes).length >= players.length && !voteCompletionChecked) {
			setVoteCompletionChecked(true);
			onAllVotesComplete(votes);
		}
	}, [votes, players, onAllVotesComplete, voteCompletionChecked]);

	const handleVote = async (voteFor: string) => {
		// Immediately update local state to disable the form
		setVotes((prev) => {
			const newVotes = { ...prev, [playerName]: voteFor };
			return newVotes;
		});

		try {
			await supabase.from("votes").upsert(
				{
					room_code: groupCode,
					round_number: round,
					voter_name: playerName,
					vote_for: voteFor,
				},
				{ onConflict: "room_code,round_number,voter_name" }
			);
		} catch (error) {
			console.error("VotingPhase: Vote submission failed", error);
		}
	};

	return (
		<VoteSection
			entries={shuffledEntries.filter((e) => e.id !== playerName)}
			onVote={handleVote}
			disabled={!!votes[playerName]}
			currentVoteCount={Object.keys(votes).length}
			totalPlayers={players.length}
		/>
	);
}
