"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PlayerSubmission from "../PlayerSubmission";

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
	onAllSubmissionsComplete,
}: SubmissionPhaseProps) {
	const [submissions, setSubmissions] = useState<Record<string, string>>({});

	useEffect(() => {
		console.log(
			`🔌 SubmissionPhase: Setting up submission channel for room ${groupCode}, round ${round}`
		);

		const fetchInitialSubmissions = async () => {
			console.log("📥 SubmissionPhase: Fetching initial submissions...");
			const { data } = await supabase
				.from("submissions")
				.select("player_name, answer")
				.eq("room_code", groupCode)
				.eq("round_number", round);

			console.log("📥 SubmissionPhase: Initial submissions data:", data);
			if (data) {
				const initial: Record<string, string> = {};
				for (const row of data) {
					initial[row.player_name] = row.answer;
				}
				setSubmissions(initial);
				console.log("📥 SubmissionPhase: Set initial submissions:", initial);
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
					console.log("🔥 SubmissionPhase: Realtime event received:", payload);
					const { player_name, answer } = payload.new as SubmissionRow;
					console.log(
						`📝 SubmissionPhase: ${player_name} submitted: ${answer}`
					);
					setSubmissions((prev) => ({ ...prev, [player_name]: answer }));
				}
			)
			.subscribe((status) => {
				console.log("🔗 SubmissionPhase: Channel subscription status:", status);
				if (status === "SUBSCRIBED") {
					console.log(
						"✅ SubmissionPhase: Successfully subscribed to submission changes"
					);
				} else if (status === "CHANNEL_ERROR") {
					console.error("❌ SubmissionPhase: Channel subscription error");
				}
			});

		console.log("🔗 SubmissionPhase: Submission channel created");

		return () => {
			console.log("🔌 SubmissionPhase: Cleaning up submission channel");
			supabase.removeChannel(channel);
		};
	}, [groupCode, round]);

	useEffect(() => {
		console.log("📊 SubmissionPhase: Submissions state updated:", submissions);
		console.log(
			`📊 SubmissionPhase: ${Object.keys(submissions).length}/${
				players.length
			} submissions received`
		);

		if (Object.keys(submissions).length === players.length) {
			console.log(
				"✅ SubmissionPhase: All submissions complete! Creating shuffled entries..."
			);
			const entries = Object.entries(submissions).map(([id, text]) => ({
				id,
				text,
			}));
			const shuffledEntries = entries.sort(() => Math.random() - 0.5);
			console.log("🔀 SubmissionPhase: Shuffled entries:", shuffledEntries);
			console.log("🔄 SubmissionPhase: Transitioning to voting phase...");
			onAllSubmissionsComplete(shuffledEntries);
		}
	}, [submissions, players.length, onAllSubmissionsComplete]);

	const handleSubmit = async (answer: string) => {
		console.log(`📝 SubmissionPhase: ${playerName} is submitting: ${answer}`);

		// Immediately update local state to disable the form
		setSubmissions((prev) => {
			const newSubmissions = { ...prev, [playerName]: answer };
			console.log("📝 SubmissionPhase: Local state updated:", newSubmissions);
			return newSubmissions;
		});

		try {
			const result = await supabase.from("submissions").upsert(
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
			console.log("💾 SubmissionPhase: Submission saved to database:", result);
		} catch (error) {
			console.error("❌ SubmissionPhase: Error saving submission:", error);
		}
	};

	return (
		<>
			<h2 className="text-xl mb-4">🧠 {prompt}</h2>
			<PlayerSubmission
				player={playerName}
				onSubmit={handleSubmit}
				disabled={!!submissions[playerName]}
			/>
		</>
	);
}
