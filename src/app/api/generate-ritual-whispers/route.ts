import { NextRequest, NextResponse } from "next/server";

// Fallback ritual whispers by theme category
const fallbackWhispers = {
	default: [
		"The circle is forming. Your choices will echo in eternity.",
		"Welcome to the threshold. What you reveal cannot be unseen.",
		"The void awaits your confessions. Speak your truth.",
		"You've opened the door. There's no going back now.",
		"The ritual begins. Your souls are laid bare.",
		"Welcome to the meat grinder of truth.",
		"Step into the abyss. Kiro is watching.",
		"The game knows your secrets. Play anyway.",
		"You've entered the confession booth. No prayers here.",
		"Welcome to where honesty goes to die.",
	],
	dark: [
		"You've opened the meat door. There's no going back.",
		"The darkness recognizes its own. Welcome home.",
		"Your shadows have found their playground.",
		"Step into the void. It's been waiting for you.",
		"The abyss blinks first. You've already lost.",
		"Welcome to the theater of broken souls.",
		"The ritual hungers. Feed it your truth.",
		"You've crossed the threshold. Abandon hope.",
		"The game begins. Your innocence ends.",
		"Welcome to the confession of the damned.",
	],
	chaos: [
		"Chaos has chosen you. Embrace the madness.",
		"Order is an illusion. Welcome to reality.",
		"The universe is laughing. Join the joke.",
		"You've entered the cosmic blender. Hold tight.",
		"Reality is optional here. Choose wisely.",
		"Welcome to the beautiful disaster zone.",
		"Sanity is overrated. Leave it at the door.",
		"You've found the glitch in the matrix. Enjoy.",
		"The game is rigged. Play anyway.",
		"Welcome to the carnival of broken logic.",
	],
	mystery: [
		"The answers you seek will only bring more questions.",
		"Welcome to the labyrinth of hidden truths.",
		"The secrets you reveal will reveal you.",
		"You've entered the hall of mirrors. Nothing is real.",
		"The truth is a puzzle with missing pieces.",
		"Welcome to the archive of forgotten confessions.",
		"The mystery deepens with every choice.",
		"You've opened Pandora's box. Good luck.",
		"The game knows what you've forgotten.",
		"Welcome to the museum of buried secrets.",
	],
};

function getThemeCategory(theme: string): keyof typeof fallbackWhispers {
	const lowerTheme = theme.toLowerCase();

	if (
		lowerTheme.includes("dark") ||
		lowerTheme.includes("shadow") ||
		lowerTheme.includes("void")
	) {
		return "dark";
	}
	if (
		lowerTheme.includes("chaos") ||
		lowerTheme.includes("mad") ||
		lowerTheme.includes("wild")
	) {
		return "chaos";
	}
	if (
		lowerTheme.includes("mystery") ||
		lowerTheme.includes("secret") ||
		lowerTheme.includes("hidden")
	) {
		return "mystery";
	}

	return "default";
}

function selectRandomWhispers(whispers: string[], count: number = 3): string[] {
	const shuffled = [...whispers].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

export async function POST(request: NextRequest) {
	try {
		const { theme } = await request.json();

		if (!theme) {
			return NextResponse.json({ error: "Theme is required" }, { status: 400 });
		}

		// Try to generate AI whispers first
		let ritualWhispers: string[] = [];

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
								content: `You are Kiro, a darkly charismatic AI game master welcoming players to a twisted party game. 

Generate exactly 3 atmospheric "ritual whispers" that set the mood for a game session with theme: "${theme}"

Each whisper should be:
- One sentence, 8-15 words
- Darkly poetic but not genuinely disturbing
- Creates anticipation and atmosphere
- Uses "you/your" to address players directly
- Hints at confession, truth, or revelation themes

Examples:
"You've opened the meat door. There's no going back."
"The void awaits your confessions. Speak your truth."
"Welcome to the theater of broken souls."

Return ONLY the 3 whispers, one per line, no numbering.`,
							},
							{
								role: "user",
								content: `Generate 3 ritual whispers for theme: "${theme}"`,
							},
						],
						max_tokens: 150,
						temperature: 0.8,
					}),
				}
			);

			if (response.ok) {
				const completion = await response.json();
				const whispersText = completion.choices[0]?.message?.content?.trim();

				if (whispersText) {
					const whispers = whispersText
						.split("\n")
						.map((whisper: string) => whisper.trim())
						.filter((whisper: string) => whisper.length > 0)
						.slice(0, 3);

					if (whispers.length === 3) {
						ritualWhispers = whispers;
					}
				}
			}
		} catch (error) {
			console.error("Error generating AI whispers:", error);
		}

		// Use fallback if AI generation failed
		if (ritualWhispers.length === 0) {
			const themeCategory = getThemeCategory(theme);
			const fallbackSet = fallbackWhispers[themeCategory];
			ritualWhispers = selectRandomWhispers(fallbackSet, 3);
		}

		return NextResponse.json({ ritualWhispers });
	} catch (error) {
		console.error("Error in ritual whispers API:", error);

		// Emergency fallback
		const emergencyWhispers = selectRandomWhispers(fallbackWhispers.default, 3);
		return NextResponse.json({ ritualWhispers: emergencyWhispers });
	}
}
