"use client";

type Insight = {
	type: "pattern" | "meta" | "spotlight" | "stat";
	message: string;
	triggeredBy: string[]; // player names or themes
};

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

	// Generate typed insights based on game data
	const generateInsights = (): Insight[] => {
		const insights: Insight[] = [];
		const { mostVotedPlayer, voteCounts, playerVoteHistory } =
			getVotingTrends();
		const { avgLength, longestSubmission } = getSubmissionTrends();
		const roundsPlayed = Object.keys(allRoundData).length;

		// Spotlight insight for most voted player
		if (mostVotedPlayer && voteCounts[mostVotedPlayer] > 1) {
			insights.push({
				type: "spotlight",
				message: `🏆 ${mostVotedPlayer} is the crowd favorite with ${voteCounts[mostVotedPlayer]} votes total!`,
				triggeredBy: [mostVotedPlayer],
			});
		}

		// Pattern insight for voting behavior
		const loyalVoters = Object.entries(playerVoteHistory).filter(
			([, votes]) => new Set(votes).size === 1 && votes.length > 1
		);
		if (loyalVoters.length > 0) {
			insights.push({
				type: "pattern",
				message: `🤝 ${loyalVoters[0][0]} shows loyalty - always voting for the same person!`,
				triggeredBy: [loyalVoters[0][0], loyalVoters[0][1][0]],
			});
		}

		// Stat insight for submission length
		if (avgLength > 50) {
			insights.push({
				type: "stat",
				message: `📝 Players are getting wordy! Average answer length: ${avgLength} characters`,
				triggeredBy: players.filter((_, i) => i < 2), // Sample of players
			});
		} else {
			insights.push({
				type: "stat",
				message: `� Keeping it concise! Average answer length: ${avgLength} characters`,
				triggeredBy: players.filter((_, i) => i < 2), // Sample of players
			});
		}

		// Spotlight for longest submission
		const longestSubmissionAuthor = Object.values(allRoundData)
			.flatMap((round) => Object.entries(round.submissions))
			.find(([, submission]) => submission === longestSubmission)?.[0];

		if (longestSubmissionAuthor && longestSubmission.length > 30) {
			insights.push({
				type: "spotlight",
				message: `📏 ${longestSubmissionAuthor} wrote the longest answer: "${longestSubmission.slice(
					0,
					40
				)}${longestSubmission.length > 40 ? "..." : ""}"`,
				triggeredBy: [longestSubmissionAuthor],
			});
		}

		// Meta insight about game progress
		if (roundsPlayed >= 4) {
			insights.push({
				type: "meta",
				message: `🎯 ${roundsPlayed} rounds completed - this game is on fire! 🔥`,
				triggeredBy: players,
			});
		} else {
			insights.push({
				type: "meta",
				message: `🎯 ${roundsPlayed} rounds down, the competition is heating up!`,
				triggeredBy: players,
			});
		}

		// Pattern insight for theme variety
		const themes = Object.values(allRoundData).map((round) => round.prompt);
		const uniqueWords = new Set(
			themes.flatMap((theme) => theme.toLowerCase().split(" "))
		);
		if (uniqueWords.size > roundsPlayed * 3) {
			insights.push({
				type: "pattern",
				message: `🌈 Such creative themes! ${uniqueWords.size} unique words across all prompts`,
				triggeredBy: themes,
			});
		}

		return insights.slice(0, 5); // Limit to 5 insights
	};

	const insights = generateInsights();

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
						className={`bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 text-left animate-pulse ${
							insight.type === "spotlight"
								? "border-yellow-500/30 bg-yellow-900/10"
								: insight.type === "pattern"
								? "border-blue-500/30 bg-blue-900/10"
								: insight.type === "meta"
								? "border-purple-500/30 bg-purple-900/10"
								: "border-green-500/30 bg-green-900/10"
						}`}
						style={{
							animationDelay: `${index * 0.5}s`,
							animationDuration: "2s",
							animationIterationCount: "3",
						}}
					>
						<div className="flex justify-between items-start mb-2">
							<span className="text-sm text-zinc-400 uppercase tracking-wide">
								{insight.type}
							</span>
							{insight.triggeredBy.length > 0 && (
								<span className="text-xs text-zinc-500">
									{insight.triggeredBy.slice(0, 2).join(", ")}
									{insight.triggeredBy.length > 2 &&
										` +${insight.triggeredBy.length - 2}`}
								</span>
							)}
						</div>
						<div>{insight.message}</div>
					</div>
				))}
			</div>{" "}
			<button
				onClick={onContinue}
				className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
			>
				Continue Playing 🎮
			</button>
		</div>
	);
}
