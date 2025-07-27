import { NextRequest, NextResponse } from "next/server";

// Fallback choices for different types of prompts
const fallbackChoices = {
	law: [
		"No wearing socks with sandals",
		"Mandatory dad jokes on Mondays",
		"Pizza must be eaten with hands only",
		"No small talk in elevators",
		"Group naps are legally binding",
	],
	dance: [
		"The Awkward Penguin",
		"The WiFi Router Reset",
		"The Existential Crisis Shuffle",
		"The Overthinking Tango",
		"The Social Battery Drain",
	],
	date: [
		"So... do you believe in ghosts?",
		"I collect vintage spoons",
		"My ex was actually my cousin",
		"I'm technically still married",
		"Want to see my rash collection?",
	],
	holiday: [
		"National Procrastination Day",
		"Awkward Silence Appreciation Day",
		"Overthinking Everything Festival",
		"Bad Decision Tuesday",
		"Existential Dread Monday",
	],
	superpower: [
		"You can only fly backwards",
		"Reading minds but only negative thoughts",
		"Invisibility but only when sneezing",
		"Super strength but only for opening jars",
		"Time travel but only to embarrassing moments",
	],
	conspiracy: [
		"Birds are government drones charging on power lines",
		"Cats are interdimensional beings judging us",
		"Socks disappear to fund the sock mafia",
		"WiFi passwords are secret government codes",
		"Microwaves are portals to the condiment dimension",
	],
};

function getFallbackSet(prompt: string): string[] {
	const lowercasePrompt = prompt.toLowerCase();

	if (lowercasePrompt.includes("law")) return fallbackChoices.law;
	if (lowercasePrompt.includes("dance")) return fallbackChoices.dance;
	if (lowercasePrompt.includes("date")) return fallbackChoices.date;
	if (lowercasePrompt.includes("holiday")) return fallbackChoices.holiday;
	if (lowercasePrompt.includes("superpower")) return fallbackChoices.superpower;
	if (lowercasePrompt.includes("conspiracy")) return fallbackChoices.conspiracy;

	// Default fallback
	return [
		"Something mysteriously hilarious",
		"A chaotic neutral choice",
		"The void whispers this answer",
		"Kiro's personal favorite",
		"The choice that defies explanation",
	];
}

export async function POST(request: NextRequest) {
	try {
		const { prompt, theme, players } = await request.json();

		if (!prompt || !players || !Array.isArray(players)) {
			return NextResponse.json(
				{ error: "Missing required fields: prompt, players" },
				{ status: 400 }
			);
		}

		const playerChoices: Record<string, string[]> = {};

		// Generate choices for each player
		for (const player of players) {
			try {
				const response = await fetch(
					"https://api.openai.com/v1/chat/completions",
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							model: "gpt-3.5-turbo",
							messages: [
								{
									role: "system",
									content: `You are Kiro, a chaotic and darkly humorous AI game master. Generate exactly 5 unique, creative, and slightly twisted answer choices for a party game prompt. 

The theme is: ${theme || "General Chaos"}

Make each choice:
- Unique and memorable
- Slightly dark/twisted but still fun
- Different from typical responses
- Personalized with subtle variation for player: ${player}
- 2-8 words each
- No numbering or bullet points

Return ONLY the 5 choices, one per line.`,
								},
								{
									role: "user",
									content: `Generate 5 answer choices for: "${prompt}"`,
								},
							],
							max_tokens: 200,
							temperature: 0.9,
						}),
					}
				);

				if (response.ok) {
					const completion = await response.json();
					const choicesText = completion.choices[0]?.message?.content?.trim();
					if (choicesText) {
						const choices = choicesText
							.split("\n")
							.map((choice: string) => choice.trim())
							.filter((choice: string) => choice.length > 0)
							.slice(0, 5); // Ensure exactly 5 choices

						if (choices.length === 5) {
							playerChoices[player] = choices;
						} else {
							// Fallback if AI didn't generate exactly 5
							playerChoices[player] = getFallbackSet(prompt).slice(0, 5);
						}
					} else {
						playerChoices[player] = getFallbackSet(prompt).slice(0, 5);
					}
				} else {
					playerChoices[player] = getFallbackSet(prompt).slice(0, 5);
				}
			} catch (error) {
				console.error(`Error generating choices for ${player}:`, error);
				// Use fallback choices for this player
				playerChoices[player] = getFallbackSet(prompt).slice(0, 5);
			}
		}

		return NextResponse.json({ playerChoices });
	} catch (error) {
		console.error("Error generating choices:", error);

		// Fallback: generate choices for all players using fallback sets
		const { players, prompt } = await request
			.json()
			.catch(() => ({ players: [], prompt: "" }));
		const fallbackSet = getFallbackSet(prompt || "");
		const playerChoices: Record<string, string[]> = {};

		players.forEach((player: string) => {
			playerChoices[player] = [...fallbackSet]; // Copy array
		});

		return NextResponse.json({ playerChoices });
	}
}
