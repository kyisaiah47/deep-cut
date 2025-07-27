"use client";

interface InsightsPhaseProps {
	allRoundData: {
		[round: number]: {
			submissions: Record<string, string>;
			votes: Record<string, string>;
			prompt: string;
		};
	};
	players: string[];
	onContinue: () => void;
}

export default function InsightsPhase({
	allRoundData,
	players,
	onContinue,
}: InsightsPhaseProps) {
	// Analyze voting patterns
	const getVotingTrends = () => {
		const voteCounts: Record<string, number> = {};
		const playerVoteHistory: Record<string, string[]> = {};

		Object.values(allRoundData).forEach((roundData) => {
			Object.entries(roundData.votes).forEach(([voter, votedFor]) => {
				voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
				if (!playerVoteHistory[voter]) playerVoteHistory[voter] = [];
				playerVoteHistory[voter].push(votedFor);
			});
		});

		const mostVotedPlayer = Object.keys(voteCounts).reduce((top, player) => {
			return voteCounts[player] > (voteCounts[top] || 0) ? player : top;
		}, "");

		return { voteCounts, mostVotedPlayer, playerVoteHistory };
	};

	// Analyze submission patterns
	const getSubmissionTrends = () => {
		const submissions = Object.values(allRoundData).flatMap((round) =>
			Object.values(round.submissions)
		);

		const avgLength =
			submissions.reduce((sum, sub) => sum + sub.length, 0) /
			submissions.length;
		const longestSubmission = submissions.reduce(
			(longest, current) =>
				current.length > longest.length ? current : longest,
			""
		);

		return { avgLength: Math.round(avgLength), longestSubmission };
	};

	const { mostVotedPlayer, voteCounts } = getVotingTrends();
	const { avgLength, longestSubmission } = getSubmissionTrends();
	const roundsPlayed = Object.keys(allRoundData).length;

	const insights = [
		`🏆 ${mostVotedPlayer} is the crowd favorite with ${
			voteCounts[mostVotedPlayer] || 0
		} votes total!`,
		`📝 Average answer length: ${avgLength} characters`,
		`📏 Longest answer so far: "${longestSubmission.slice(0, 60)}${
			longestSubmission.length > 60 ? "..." : ""
		}"`,
		`🎯 ${roundsPlayed} rounds completed - the game is heating up!`,
		`🤔 ${players.length} players are battling for supremacy`,
	];

	return (
		<div className="text-center py-10 max-w-2xl mx-auto">
			<h2 className="text-3xl font-bold mb-2">📊 Game Insights</h2>
			<p className="text-zinc-400 mb-8">
				Here&apos;s what Kiro has observed...
			</p>

			<div className="space-y-4 mb-8">
				{insights.map((insight, index) => (
					<div
						key={index}
						className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 text-left animate-pulse"
						style={{
							animationDelay: `${index * 0.5}s`,
							animationDuration: "2s",
							animationIterationCount: "3",
						}}
					>
						{insight}
					</div>
				))}
			</div>

			<button
				onClick={onContinue}
				className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
			>
				Continue Playing 🎮
			</button>
		</div>
	);
}
