// components/PlayerForm.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PlayerForm({
	onSubmit,
}: {
	onSubmit: (name: string) => void;
}) {
	const [name, setName] = useState("");

	const handleSubmit = () => {
		if (name.trim()) {
			onSubmit(name.trim());
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			<div className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-sm w-full space-y-4">
				<h2 className="text-xl font-bold">Enter Your Name</h2>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Your name..."
					className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center"
				/>
				<Button
					onClick={handleSubmit}
					className="w-full"
				>
					Continue
				</Button>
			</div>
		</main>
	);
}
