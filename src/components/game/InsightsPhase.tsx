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
	isFinalInsights: boolean;
	onContinue: () => void;
	onReturnHome?: () => void;
}

export default function InsightsPhase({
	allRoundData,
	players,
	isFinalInsights,
	onContinue,
	onReturnHome,
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

	// Analyze group vibes and chemistry for final insights
	const analyzeGroupVibes = () => {
		const { playerVoteHistory } = getVotingTrends();
		const submissions = Object.values(allRoundData).flatMap((round) =>
			Object.values(round.submissions)
		);

		// Calculate engagement metrics
		const avgSubmissionLength =
			submissions.reduce((sum, sub) => sum + sub.length, 0) /
			submissions.length;
		const uniqueVoters = new Set(Object.keys(playerVoteHistory)).size;

		// Analyze voting diversity (good vibes = varied voting)
		const votingDiversity = Object.values(playerVoteHistory).map((votes) =>
			votes.length > 0 ? new Set(votes).size / votes.length : 0
		);
		const avgVotingDiversity =
			votingDiversity.reduce((sum, div) => sum + div, 0) /
			Math.max(votingDiversity.length, 1);

		// Check for mutual appreciation (players voting for each other)
		const mutualVotes = Object.entries(playerVoteHistory).filter(
			([voter, votes]) =>
				votes.some((votedFor) => playerVoteHistory[votedFor]?.includes(voter))
		).length;

		const vibeScore =
			((avgSubmissionLength > 30 ? 1 : 0) + // Detailed responses
				(uniqueVoters / players.length > 0.8 ? 1 : 0) + // High participation
				(avgVotingDiversity > 0.6 ? 1 : 0) + // Diverse voting
				(mutualVotes > players.length * 0.3 ? 1 : 0)) / // Mutual appreciation
			4;

		return {
			vibeScore,
			avgSubmissionLength,
			votingDiversity: avgVotingDiversity,
			mutualVotes,
		};
	};

	// Generate typed insights based on game data
	const generateInsights = (): Insight[] => {
		const insights: Insight[] = [];
		const { mostVotedPlayer, voteCounts } = getVotingTrends();
		const roundsPlayed = Object.keys(allRoundData).length;

		if (isFinalInsights) {
			// Final comprehensive insights (2-3 insights)
			const vibes = analyzeGroupVibes();

			// Overall game summary
			insights.push({
				type: "meta",
				message: `🎯 What a journey! ${roundsPlayed} rounds completed with ${players.length} creative minds at work!`,
				triggeredBy: players,
			});

			// Champion insight
			if (mostVotedPlayer && voteCounts[mostVotedPlayer] > 2) {
				insights.push({
					type: "spotlight",
					message: `👑 ${mostVotedPlayer} dominated with ${voteCounts[mostVotedPlayer]} total votes - the undisputed champion!`,
					triggeredBy: [mostVotedPlayer],
				});
			}

			// Group chemistry insight based on vibes
			if (vibes.vibeScore > 0.7) {
				insights.push({
					type: "pattern",
					message: `✨ Amazing chemistry! This group has incredible synergy with diverse voting and engaging responses.`,
					triggeredBy: players.filter((_, i) => i < 3),
				});
			} else if (vibes.vibeScore > 0.4) {
				insights.push({
					type: "pattern",
					message: `🤔 Interesting dynamics... some players seem to click more than others.`,
					triggeredBy: players.filter((_, i) => i < 3),
				});
			} else {
				insights.push({
					type: "pattern",
					message: `😬 The group seems to be feeling each other out... different wavelengths perhaps?`,
					triggeredBy: players.filter((_, i) => i < 3),
				});
			}
		} else {
			// Mid-game insight (1 insight after round 3)
			if (mostVotedPlayer && voteCounts[mostVotedPlayer] > 1) {
				insights.push({
					type: "spotlight",
					message: `🏆 Halfway point! ${mostVotedPlayer} is leading the pack with ${voteCounts[mostVotedPlayer]} votes so far!`,
					triggeredBy: [mostVotedPlayer],
				});
			} else {
				insights.push({
					type: "pattern",
					message: `🎲 It's anyone's game! The votes are spread out - no clear frontrunner yet!`,
					triggeredBy: players.filter((_, i) => i < 3),
				});
			}
		}

		return insights;
	};

	const insights = generateInsights();
	const vibes = isFinalInsights ? analyzeGroupVibes() : null;

	// Determine actions based on vibes for final insights
	const getVibeBasedActions = () => {
		if (!vibes || !isFinalInsights) return null;

		if (vibes.vibeScore > 0.7) {
			return {
				sentiment: "positive",
				message: "This group has amazing chemistry! 🔥",
				showContinue: true,
			};
		} else if (vibes.vibeScore > 0.4) {
			return {
				sentiment: "neutral",
				message: "Some good moments, but maybe try a new theme? 🤷‍♂️",
				showContinue: true,
			};
		} else {
			return {
				sentiment: "negative",
				message: "Time for a fresh start with a new theme! 🔄",
				showContinue: false,
			};
		}
	};

	const vibeActions = getVibeBasedActions();

	return (
		<div className="text-center py-10 max-w-2xl mx-auto">
			<h2 className="text-3xl font-bold mb-2">
				{isFinalInsights ? "🏁 Final Insights" : "📊 Mid-Game Insights"}
			</h2>
			<p className="text-zinc-400 mb-8">
				{isFinalInsights
					? "Here's how your epic journey unfolded..."
					: "Here's what Kiro has observed so far..."}
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
			</div>

			{isFinalInsights && vibeActions ? (
				<div className="space-y-4">
					<div
						className={`p-4 rounded-lg border ${
							vibeActions.sentiment === "positive"
								? "border-green-500/30 bg-green-900/10"
								: vibeActions.sentiment === "neutral"
								? "border-yellow-500/30 bg-yellow-900/10"
								: "border-red-500/30 bg-red-900/10"
						}`}
					>
						<p className="text-lg mb-4">{vibeActions.message}</p>
					</div>

					<div className="flex gap-4 justify-center">
						{vibeActions.showContinue ? (
							<>
								<button
									onClick={() => {
										// Continue with same theme - reset rounds
										if (onReturnHome) onReturnHome();
									}}
									className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									Same Theme, New Round! 🔄
								</button>
								<button
									onClick={() => {
										if (onReturnHome) onReturnHome();
									}}
									className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									New Theme 🎨
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => {
										if (onReturnHome) onReturnHome();
									}}
									className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									Try New Theme 🎨
								</button>
								<button
									onClick={() => {
										if (onReturnHome) onReturnHome();
									}}
									className="px-6 py-3 bg-zinc-500 text-white font-semibold rounded-lg hover:bg-zinc-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
								>
									Exit Game 👋
								</button>
							</>
						)}
					</div>
				</div>
			) : (
				<button
					onClick={onContinue}
					className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-400 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
				>
					Continue Playing 🎮
				</button>
			)}
		</div>
	);
}
