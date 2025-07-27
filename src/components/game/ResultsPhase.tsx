interface ResultsPhaseProps {
	winnerId: string;
	submissions: Record<string, string>;
	votes: Record<string, string>;
	players: string[];
	onNextRound: () => void;
}

export default function ResultsPhase({
	winnerId,
	submissions,
	votes,
	players,
	onNextRound,
}: ResultsPhaseProps) {
	return (
		<div className="bg-zinc-800 p-6 rounded-xl w-full">
			<h3 className="text-2xl font-bold mb-2">🏆 Winner: {winnerId}</h3>
			<p className="text-zinc-300 mb-4 italic">
				&ldquo;{submissions[winnerId]}&rdquo;
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
				className="mt-6 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
				onClick={onNextRound}
			>
				➡️ Next Round
			</button>
		</div>
	);
}
