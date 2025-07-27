"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ChoiceSubmissionPhase from "../ChoiceSubmissionPhase";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SubmissionRow = { player_name: string; answer: string };

interface SubmissionPhaseProps {
	groupCode: string;
	playerName: string;
	players: string[];
	round: number;
	prompt: string;
	theme: string;
	onAllSubmissionsComplete: (
		shuffledEntries: { id: string; text: string }[]
	) => void;
}

export default function SubmissionPhase({
	groupCode,
	playerName,
	players,
	round,
	prompt,
	theme,
	onAllSubmissionsComplete,
}: SubmissionPhaseProps) {
	const [submissions, setSubmissions] = useState<Record<string, string>>({});

	useEffect(() => {
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
	}, [groupCode, round]);

	useEffect(() => {
		if (Object.keys(submissions).length === players.length) {
			const entries = Object.entries(submissions).map(([id, text]) => ({
				id,
				text,
			}));
			const shuffledEntries = entries.sort(() => Math.random() - 0.5);
			onAllSubmissionsComplete(shuffledEntries);
		}
	}, [submissions, players.length, onAllSubmissionsComplete]);

	const handleSubmit = async (answer: string) => {
		// Immediately update local state to disable the form
		setSubmissions((prev) => ({ ...prev, [playerName]: answer }));

		try {
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
		} catch (err) {
			// Handle error silently
			console.error("Submission error:", err);
		}
	};

	return (
		<>
			<ChoiceSubmissionPhase
				prompt={prompt}
				theme={theme}
				players={players}
				currentPlayer={playerName}
				onSubmit={handleSubmit}
				disabled={!!submissions[playerName]}
				submissionCount={Object.keys(submissions).length}
				totalPlayers={players.length}
			/>
		</>
	);
}
