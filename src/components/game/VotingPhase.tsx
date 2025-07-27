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
		console.log(
			`🔌 VotingPhase: Setting up vote channel for room ${groupCode}, round ${round}`
		);

		const fetchInitialVotes = async () => {
			console.log("📥 VotingPhase: Fetching initial votes...");
			const { data } = await supabase
				.from("votes")
				.select("voter_name, vote_for")
				.eq("room_code", groupCode)
				.eq("round_number", round);

			console.log("📥 VotingPhase: Initial votes data:", data);
			if (data) {
				const initial: Record<string, string> = {};
				for (const row of data) {
					initial[row.voter_name] = row.vote_for;
				}
				setVotes(initial);
				console.log("📥 VotingPhase: Set initial votes:", initial);
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
					console.log("🔥 VotingPhase: INSERT event received:", payload);
					console.log(
						"🔍 VotingPhase: Event room_code:",
						payload.new?.room_code,
						"Expected:",
						groupCode
					);
					console.log(
						"🔍 VotingPhase: Event round:",
						payload.new?.round_number,
						"Expected:",
						round
					);

					// Check if this event is for our room and round
					if (
						payload.new?.room_code === groupCode &&
						payload.new?.round_number === round
					) {
						const { voter_name, vote_for } = payload.new;
						console.log(`🗳️ VotingPhase: ${voter_name} voted for ${vote_for}`);
						setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
					} else {
						console.log(
							"🚫 VotingPhase: Event filtered out - wrong room or round"
						);
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
					console.log("🔄 VotingPhase: UPDATE event received:", payload);
					const { voter_name, vote_for } = payload.new;
					console.log(
						`🗳️ VotingPhase: ${voter_name} updated vote to ${vote_for}`
					);
					setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
				}
			)
			.subscribe((status) => {
				console.log("🔗 VotingPhase: Channel subscription status:", status);
				if (status === "SUBSCRIBED") {
					console.log(
						"✅ VotingPhase: Successfully subscribed to vote changes"
					);
				} else if (status === "CHANNEL_ERROR") {
					console.error("❌ VotingPhase: Channel subscription error");
				} else if (status === "CLOSED") {
					console.warn("⚠️ VotingPhase: Channel subscription closed");
				}
			});

		console.log("🔗 VotingPhase: Vote channel subscribed");

		return () => {
			console.log("🔌 VotingPhase: Cleaning up vote channel");
			supabase.removeChannel(voteChannel);
		};
	}, [groupCode, round]);

	useEffect(() => {
		console.log("📊 VotingPhase: Votes state updated:", votes);
		console.log(
			`📊 VotingPhase: ${Object.keys(votes).length}/${
				players.length
			} votes received`
		);

		if (Object.keys(votes).length >= players.length) {
			console.log(
				"✅ VotingPhase: All votes complete! Transitioning to results..."
			);
			onAllVotesComplete(votes);
		}
	}, [votes, players.length, onAllVotesComplete]);

	const handleVote = async (voteFor: string) => {
		console.log(`🗳️ VotingPhase: ${playerName} is voting for ${voteFor}`);

		// Immediately update local state to disable the form
		setVotes((prev) => {
			const newVotes = { ...prev, [playerName]: voteFor };
			console.log("🗳️ VotingPhase: Local state updated:", newVotes);
			return newVotes;
		});

		try {
			const result = await supabase.from("votes").upsert(
				{
					room_code: groupCode,
					round_number: round,
					voter_name: playerName,
					vote_for: voteFor,
				},
				{ onConflict: "room_code,round_number,voter_name" }
			);
			console.log("💾 VotingPhase: Vote saved to database:", result);

			if (result.error) {
				console.error("❌ VotingPhase: Database error:", result.error);
			} else {
				console.log("✅ VotingPhase: Vote upserted successfully:", result.data);
			}
		} catch (error) {
			console.error("❌ VotingPhase: Error saving vote:", error);
		}
	};

	return (
		<VoteSection
			player={playerName}
			entries={shuffledEntries.filter((e) => e.id !== playerName)}
			onVote={handleVote}
			disabled={!!votes[playerName]}
		/>
	);
}
