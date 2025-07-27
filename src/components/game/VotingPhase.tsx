"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import VoteSection from "../VoteSection";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

	useEffect(() => {
		if (Object.keys(votes).length >= players.length) {
			onAllVotesComplete(votes);
		}
	}, [votes, players.length, onAllVotesComplete]);

	const handleVote = async (voteFor: string) => {
		// Immediately update local state to disable the form
		setVotes((prev) => ({ ...prev, [playerName]: voteFor }));

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
		} catch {
			// Handle error silently
		}
	};

	return (
		<VoteSection
			entries={shuffledEntries.filter((e) => e.id !== playerName)}
			onVote={handleVote}
			disabled={!!votes[playerName]}
		/>
	);
}
