"use client";

import { useState } from "react";

export default function PlayerSubmission({
	player,
	onSubmit,
	disabled,
}: {
	player: string;
	onSubmit: (answer: string) => void;
	disabled: boolean;
}) {
	const [answer, setAnswer] = useState("");
	const [error, setError] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = () => {
		if (!answer.trim()) {
			setError("Please enter a valid response.");
			return;
		}
		setError("");
		setSubmitted(true);
		onSubmit(answer.trim());
	};

	return (
		<div className="bg-zinc-900/90 backdrop-blur-lg p-6 rounded-xl shadow-[0_0_30px_#facc15aa] border border-zinc-700 max-w-md w-full transition-all duration-300 p-6 rounded-xl w-full max-w-md mx-auto">
			<h2 className="text-xl font-semibold mb-4 text-white">{player}</h2>
			<input
				type="text"
				value={answer}
				onChange={(e) => setAnswer(e.target.value)}
				className="w-full px-4 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 hover:shadow-lg hover:bg-zinc-700"
				placeholder="Enter your answer..."
				disabled={disabled}
			/>
			{error && <p className="text-red-400 mt-2 text-sm text-left">{error}</p>}
			<button
				onClick={handleSubmit}
				disabled={disabled || submitted}
				className="w-full mt-4 py-2 bg-yellow-300 text-black font-semibold rounded-md hover:bg-yellow-400 transition disabled:opacity-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
			>
				{submitted ? "Waiting for others..." : "Submit"}
			</button>
		</div>
	);
}
