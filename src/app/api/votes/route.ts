import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { GameError, ValidationError } from "@/lib/error-handling";
import {
	determineVotingWinners,
	calculateVotingProgress,
} from "@/lib/game-utils";

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const { submissionId, playerId, gameId } = await request.json();

		// Validate required fields
		if (!submissionId || !playerId || !gameId) {
			return NextResponse.json(
				{ error: "Missing required fields: submissionId, playerId, gameId" },
				{ status: 400 }
			);
		}

		// Get game state to verify voting phase and get current round
		const { data: game, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("id", gameId)
			.single();

		if (gameError || !game) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Verify game is in voting phase
		if (game.phase !== "voting") {
			return NextResponse.json(
				{ error: "Game is not in voting phase" },
				{ status: 400 }
			);
		}

		// Verify player exists and is in the game
		const { data: player, error: playerError } = await supabase
			.from("players")
			.select("*")
			.eq("id", playerId)
			.eq("game_id", gameId)
			.single();

		if (playerError || !player) {
			return NextResponse.json(
				{ error: "Player not found in this game" },
				{ status: 404 }
			);
		}

		// Verify submission exists and is for current round
		const { data: submission, error: submissionError } = await supabase
			.from("submissions")
			.select("*")
			.eq("id", submissionId)
			.eq("game_id", gameId)
			.eq("round_number", game.current_round)
			.single();

		if (submissionError || !submission) {
			return NextResponse.json(
				{ error: "Submission not found" },
				{ status: 404 }
			);
		}

		// Verify player is not voting for their own submission
		if (submission.player_id === playerId) {
			return NextResponse.json(
				{ error: "Cannot vote for your own submission" },
				{ status: 400 }
			);
		}

		// Check if player has already voted this round
		const { data: existingVote, error: voteCheckError } = await supabase
			.from("votes")
			.select("id")
			.eq("player_id", playerId)
			.eq("game_id", gameId)
			.eq("round_number", game.current_round)
			.single();

		if (existingVote) {
			return NextResponse.json(
				{ error: "You have already voted this round" },
				{ status: 400 }
			);
		}

		// Start transaction to create vote and update submission vote count
		const { data: vote, error: voteError } = await supabase
			.from("votes")
			.insert({
				game_id: gameId,
				player_id: playerId,
				submission_id: submissionId,
				round_number: game.current_round,
			})
			.select()
			.single();

		if (voteError) {
			console.error("Error creating vote:", voteError);
			return NextResponse.json(
				{ error: "Failed to submit vote" },
				{ status: 500 }
			);
		}

		// Update submission vote count
		const { error: updateError } = await supabase
			.from("submissions")
			.update({ votes: submission.votes + 1 })
			.eq("id", submissionId);

		if (updateError) {
			console.error("Error updating submission vote count:", updateError);
			// Note: In a real application, we'd want to rollback the vote creation here
		}

		// Check if all eligible players have voted
		const { data: allPlayers, error: playersError } = await supabase
			.from("players")
			.select("id")
			.eq("game_id", gameId)
			.eq("is_connected", true);

		if (!playersError && allPlayers) {
			// Get all submissions for this round to exclude their authors from voting
			const { data: roundSubmissions, error: submissionsError } = await supabase
				.from("submissions")
				.select("player_id")
				.eq("game_id", gameId)
				.eq("round_number", game.current_round);

			if (!submissionsError && roundSubmissions) {
				const submissionPlayerIds = roundSubmissions.map(
					(sub) => sub.player_id
				);
				const eligibleVoters = allPlayers.filter(
					(p) => !submissionPlayerIds.includes(p.id)
				);

				// Get current vote count
				const { data: currentVotes, error: votesError } = await supabase
					.from("votes")
					.select("id")
					.eq("game_id", gameId)
					.eq("round_number", game.current_round);

				if (
					!votesError &&
					currentVotes &&
					currentVotes.length >= eligibleVoters.length
				) {
					// All eligible players have voted, trigger voting completion
					await handleVotingComplete(supabase, gameId, game.current_round);
				}
			}
		}

		return NextResponse.json({ vote }, { status: 201 });
	} catch (error) {
		console.error("Error in vote submission:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

async function handleVotingComplete(
	supabase: any,
	gameId: string,
	roundNumber: number
) {
	try {
		// Get all submissions for this round with their vote counts
		const { data: submissions, error: submissionsError } = await supabase
			.from("submissions")
			.select("*")
			.eq("game_id", gameId)
			.eq("round_number", roundNumber)
			.order("votes", { ascending: false });

		if (submissionsError || !submissions) {
			console.error(
				"Error fetching submissions for voting completion:",
				submissionsError
			);
			return;
		}

		// Determine winner(s) using utility function - handles ties properly
		const { winners, maxVotes, hasTie } = determineVotingWinners(submissions);

		// Award points to winner(s) - handle tie-breaking rules
		if (winners.length > 0 && maxVotes > 0) {
			// In case of ties, all tied players get 1 point each
			// This implements the tie-breaking rule from requirement 4.4
			const pointsPerWinner = 1;

			for (const winner of winners) {
				const { error: scoreError } = await supabase
					.from("players")
					.update({
						score: supabase.raw(`score + ${pointsPerWinner}`),
					})
					.eq("id", winner.player_id);

				if (scoreError) {
					console.error("Error updating winner score:", scoreError);
				}
			}

			// Log the winners for debugging
			console.log(
				`Round ${roundNumber} winners:`,
				winners.map((w) => w.player_id),
				`with ${maxVotes} votes each${hasTie ? " (TIE)" : ""}`
			);
		} else {
			// No votes case - no winners this round
			console.log(`Round ${roundNumber}: No votes received, no winners`);
		}

		// Check if any player has reached the target score
		const { data: game, error: gameError } = await supabase
			.from("games")
			.select("target_score")
			.eq("id", gameId)
			.single();

		if (!gameError && game) {
			const { data: topPlayers, error: playersError } = await supabase
				.from("players")
				.select("score")
				.eq("game_id", gameId)
				.order("score", { ascending: false })
				.limit(1);

			const gameComplete =
				topPlayers && topPlayers[0]?.score >= game.target_score;

			if (gameComplete) {
				// Game is complete, stay in results phase longer or transition to final results
				console.log(
					`Game ${gameId} complete! Winner reached target score of ${game.target_score}`
				);
			}
		}

		// Transition to results phase
		const { error: phaseError } = await supabase
			.from("games")
			.update({
				phase: "results",
				updated_at: new Date().toISOString(),
			})
			.eq("id", gameId);

		if (phaseError) {
			console.error("Error transitioning to results phase:", phaseError);
		}

		// Broadcast voting completion event
		// Note: In a real implementation, you'd want to use Supabase realtime or a pub/sub system
		console.log(`Voting complete for game ${gameId}, round ${roundNumber}`);
	} catch (error) {
		console.error("Error handling voting completion:", error);
	}
}

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();
		const { searchParams } = new URL(request.url);
		const gameId = searchParams.get("gameId");
		const roundNumber = searchParams.get("roundNumber");

		if (!gameId) {
			return NextResponse.json(
				{ error: "Missing gameId parameter" },
				{ status: 400 }
			);
		}

		let query = supabase
			.from("votes")
			.select(
				`
				*,
				player:players(id, name),
				submission:submissions(id, votes)
			`
			)
			.eq("game_id", gameId);

		if (roundNumber) {
			query = query.eq("round_number", parseInt(roundNumber));
		}

		const { data: votes, error } = await query.order("voted_at", {
			ascending: true,
		});

		if (error) {
			console.error("Error fetching votes:", error);
			return NextResponse.json(
				{ error: "Failed to fetch votes" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ votes });
	} catch (error) {
		console.error("Error in votes GET:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
