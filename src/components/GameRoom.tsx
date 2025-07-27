"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PlayerSubmission from "./PlayerSubmission";
import VoteSection from "./VoteSection";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Phase = "submission" | "voting" | "results";

type SubmissionRow = {
	player_name: string;
	answer: string;
};

export default function GameRoom({
	groupCode,
	playerName,
	players,
}: {
	groupCode: string;
	playerName: string;
	players: string[];
}) {
	const [phase, setPhase] = useState<Phase>("submission");
	const [prompt, setPrompt] = useState<string>("");
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);

	useEffect(() => {
		setPrompt("Invent a new law that only applies to your group.");
	}, []);

	useEffect(() => {
		if (phase !== "submission") return;

		const fetchInitialSubmissions = async () => {
			const { data, error } = await supabase
				.from("submissions")
				.select("player_name, answer")
				.eq("room_code", groupCode)
				.eq("round_number", 1);

			if (data) {
				const initial: Record<string, string> = {};
				for (const row of data) {
					initial[row.player_name] = row.answer;
				}
				setSubmissions(initial);
			}
		};

		fetchInitialSubmissions();

		const channel = supabase
			.channel("submissions")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "submissions",
					filter: `room_code=eq.${groupCode},round_number=eq.1`,
				},
				(payload) => {
					const { player_name, answer } = payload.new as SubmissionRow;
					setSubmissions((prev) => ({ ...prev, [player_name]: answer }));
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [groupCode, phase]);

	useEffect(() => {
		if (
			phase === "submission" &&
			Object.keys(submissions).length === players.length
		) {
			const entries = Object.entries(submissions).map(([id, text]) => ({
				id,
				text,
			}));
			setShuffledEntries(entries.sort(() => Math.random() - 0.5));
			setPhase("voting");
		}
	}, [submissions, phase, players.length]);

	useEffect(() => {
		if (phase === "voting" && Object.keys(votes).length === players.length) {
			setPhase("results");
		}
	}, [votes, phase, players.length]);

	const handleSubmit = async (answer: string) => {
		const { error } = await supabase.from("submissions").upsert(
			{
				room_code: groupCode,
				player_name: playerName,
				round_number: 1,
				answer,
				user_id: (await supabase.auth.getUser()).data.user?.id, // make sure you are signed in!
			},
			{
				onConflict: "room_code,player_name,round_number",
			}
		);

		if (error) {
			console.error("Submission failed:", error.message);
		}
	};

	const handleVote = async (voteFor: string) => {
		const { error } = await supabase.from("votes").upsert(
			{
				room_code: groupCode,
				round_number: 1,
				voter_name: playerName,
				vote_for: voteFor,
			},
			{ onConflict: "room_code,round_number,voter_name" }
		);

		if (error) {
			console.error("Vote failed:", error.message);
		}
	};

	useEffect(() => {
		if (phase !== "voting") return;

		const voteChannel = supabase
			.channel("votes")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "votes",
					filter: `room_code=eq.${groupCode},round_number=eq.1`,
				},
				(payload) => {
					const { voter_name, vote_for } = payload.new;
					setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(voteChannel);
		};
	}, [groupCode, phase]);

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return tally[id] > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<main className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900 text-white">
			<div className="p-4 flex justify-between items-center bg-zinc-800 text-sm text-zinc-300 border-b border-zinc-700">
				<span>👋 {playerName}</span>
				<span>
					Group Code:{" "}
					<code className="text-yellow-300 font-mono">{groupCode}</code>
				</span>
				<span>Mode: Classic</span>
			</div>

			<div className="flex-grow flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-4xl p-6 mx-auto text-center"
				>
					{phase === "submission" && (
						<PlayerSubmission
							player={playerName}
							onSubmit={handleSubmit}
							disabled={!!submissions[playerName]}
						/>
					)}

					{phase === "voting" && (
						<VoteSection
							player={playerName}
							entries={shuffledEntries.filter((e) => e.id !== playerName)}
							onVote={handleVote}
							disabled={!!votes[playerName]}
						/>
					)}

					{phase === "results" && (
						<div className="bg-zinc-800 p-6 rounded-xl w-full">
							<h3 className="text-2xl font-bold mb-2">🏆 Winner: {winnerId}</h3>
							<p className="text-zinc-300 mb-4 italic">
								"{submissions[winnerId]}"
							</p>
							<h4 className="text-lg font-semibold mt-4 mb-2">Final Votes</h4>
							<ul className="text-zinc-200 space-y-1">
								{players.map((p) => (
									<li key={p}>
										{p} voted for <strong>{votes[p]}</strong>
									</li>
								))}
							</ul>
						</div>
					)}
				</motion.div>
			</div>
		</main>
	);
}
