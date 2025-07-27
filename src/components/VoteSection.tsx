"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VoteSection({
	player,
	entries,
	onVote,
	disabled,
}: {
	player: string;
	entries: { id: string; text: string }[];
	onVote: (id: string) => void;
	disabled: boolean;
}) {
	const [selected, setSelected] = useState("");

	return (
		<div className="bg-zinc-700 p-4 rounded-xl">
			<h4 className="text-lg font-medium text-white mb-2">{player}'s Vote</h4>
			<div className="space-y-2">
				{entries.map((entry) => (
					<label
						key={entry.id}
						className="flex items-center gap-2 text-white"
					>
						<input
							type="radio"
							value={entry.id}
							checked={selected === entry.id}
							onChange={() => setSelected(entry.id)}
							disabled={disabled}
						/>
						<span className="italic">"{entry.text}"</span>
					</label>
				))}
			</div>
			<Button
				className="mt-2"
				onClick={() => selected && onVote(selected)}
				disabled={disabled || !selected}
			>
				Vote
			</Button>
		</div>
	);
}
