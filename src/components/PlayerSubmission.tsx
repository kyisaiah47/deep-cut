"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PlayerSubmission({
	player,
	onSubmit,
	disabled,
}: {
	player: string;
	onSubmit: (answer: string) => void;
	disabled: boolean;
}) {
	const [input, setInput] = useState("");

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			<div className="bg-zinc-700 p-4 rounded-xl">
				<h4 className="text-lg font-medium text-white mb-2">{player}</h4>
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					disabled={disabled}
					placeholder="Enter your answer..."
					className="w-full p-2 rounded bg-zinc-800 text-white outline-none disabled:opacity-50"
				/>
				<Button
					className="mt-2"
					onClick={() => {
						if (input.trim()) {
							onSubmit(input.trim());
							setInput("");
						}
					}}
					disabled={disabled}
				>
					Submit
				</Button>
			</div>
		</main>
	);
}
