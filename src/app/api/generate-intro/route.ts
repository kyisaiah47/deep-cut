import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { theme, prompt } = await request.json();

		// Check if OpenAI API key is available
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("OpenAI API key not configured");
		}

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content:
							"You are Kiro, a cryptic and poetic AI host for a psychological party game. You create atmospheric, slightly ominous welcome messages that set the mood. Be dramatic but not scary, poetic but not pretentious. Always end with subtle menace or mystery.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 100,
				temperature: 0.8,
			}),
		});

		if (!response.ok) {
			throw new Error("OpenAI API request failed");
		}

		const data = await response.json();
		const intro =
			data.choices[0]?.message?.content?.trim() ||
			`Welcome to the realm of ${theme}. Your truths await in the shadows.`;

		// Remove quotes if the AI added them
		const cleanIntro = intro.replace(/^["']|["']$/g, "");

		return NextResponse.json({ intro: cleanIntro });
	} catch (error) {
		console.error("Error generating intro:", error);

		// Fallback intros based on theme
		const { theme } = await request.json();
		const fallbackIntros = [
			`Welcome to the realm of ${theme}. Your truths await in the shadows.`,
			`The circle forms around ${theme}. None shall escape unchanged.`,
			`${theme} calls to you. Answer, and face what lies beneath.`,
			`Tonight, ${theme} becomes your mirror. Prepare to see clearly.`,
			`The void whispers of ${theme}. Listen closely, for it speaks truth.`,
			`${theme} surrounds you now. Let the unraveling begin.`,
			`Step into the domain of ${theme}. Your masks will not protect you here.`,
			`${theme} awaits your confession. Speak, and be transformed.`,
			`In the theater of ${theme}, you are both actor and audience.`,
			`${theme} is your stage tonight. Dance with the darkness within.`,
		];

		const randomIntro =
			fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];

		return NextResponse.json({ intro: randomIntro });
	}
}
