// 👇 Updated GameRoom to support multiple prompts and rounds

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

type Phase = "submission" | "voting" | "results" | "gameOver";
type SubmissionRow = { player_name: string; answer: string };

const prompts = [
	"Invent a new law that only applies to your group.",
	"Name a forbidden dance move.",
	"What’s the worst thing to say on a first date?",
];

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
	const [round, setRound] = useState(1);
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);

	useEffect(() => {
		if (round > prompts.length) {
			setPhase("gameOver");
		}
	}, [round]);

	const prompt = prompts[round - 1] ?? "";

	useEffect(() => {
		if (phase !== "submission") return;

		const fetchInitialSubmissions = async () => {
			const { data } = await supabase
				.from("submissions")
				.select("player_name, answer")
				.eq("room_code", groupCode)
				.eq("round_number", round);

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
					event: "*",
					schema: "public",
					table: "submissions",
					filter: `room_code=eq.${groupCode},round_number=eq.${round}`,
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
	}, [groupCode, phase, round]);

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
		if (phase === "voting" && Object.keys(votes).length >= players.length) {
			setPhase("results");
		}
	}, [votes, phase, players.length]);

	const handleSubmit = async (answer: string) => {
		// Immediately update local state to disable the form
		setSubmissions((prev) => ({ ...prev, [playerName]: answer }));

		await supabase.from("submissions").upsert(
			{
				room_code: groupCode,
				player_name: playerName,
				round_number: round,
				answer,
				user_id: (await supabase.auth.getUser()).data.user?.id,
			},
			{
				onConflict: "room_code,player_name,round_number",
			}
		);
	};

	const handleVote = async (voteFor: string) => {
		await supabase.from("votes").upsert(
			{
				room_code: groupCode,
				round_number: round,
				voter_name: playerName,
				vote_for: voteFor,
			},
			{ onConflict: "room_code,round_number,voter_name" }
		);
	};

	useEffect(() => {
		if (phase !== "voting") return;

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
			.channel("votes")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "votes",
					filter: `room_code=eq.${groupCode},round_number=eq.${round}`,
				},
				(payload) => {
					const { voter_name, vote_for } = payload.new;
					setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
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
					const { voter_name, vote_for } = payload.new;
					setVotes((prev) => ({ ...prev, [voter_name]: vote_for }));
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(voteChannel);
		};
	}, [groupCode, phase, round]);

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
				<span>Round {round}</span>
			</div>

			<div className="flex-grow flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-4xl p-6 mx-auto text-center"
				>
					{phase === "submission" && (
						<>
							<h2 className="text-xl mb-4">🧠 {prompt}</h2>
							<PlayerSubmission
								player={playerName}
								onSubmit={handleSubmit}
								disabled={!!submissions[playerName]}
							/>
						</>
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
							<button
								className="mt-6 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
								onClick={() => {
									setRound((prev) => prev + 1);
									setPhase("submission");
									setSubmissions({});
									setVotes({});
								}}
							>
								➡️ Next Round
							</button>
						</div>
					)}

					{phase === "gameOver" && (
						<div className="text-center py-10">
							<h2 className="text-3xl font-bold">🎉 Game Over!</h2>
							<p className="mt-2 text-zinc-400">Thanks for playing!</p>
						</div>
					)}
				</motion.div>
			</div>
		</main>
	);
}
