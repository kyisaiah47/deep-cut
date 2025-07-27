import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { prompt } = await request.json();

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
							"You are Kiro, a chaotic AI that generates weird, fun, and slightly unhinged game themes for adult friend groups. Be creative but keep it appropriate. Return only the theme name, nothing else.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 50,
				temperature: 0.9,
			}),
		});

		if (!response.ok) {
			throw new Error("OpenAI API request failed");
		}

		const data = await response.json();
		const theme =
			data.choices[0]?.message?.content?.trim() ||
			"Chaotic Friendship Dynamics";

		return NextResponse.json({ theme });
	} catch (error) {
		console.error("Error generating theme:", error);

		// Fallback themes if API fails
		const fallbackThemes = [
			"Daddy Issues & Deli Meats",
			"Corporate Nightmares",
			"Childhood Traumas & Snacks",
			"Toxic Ex Stories",
			"Family Drama & Fast Food",
			"Quarter Life Crisis Vibes",
			"Awkward First Dates",
			"Embarrassing College Memories",
			"Work Gossip & Wine",
			"Secret Guilty Pleasures",
			"Emotional Baggage Claims",
			"Millennial Anxiety Club",
			"Therapist's Nightmare",
			"Unresolved Friendship Drama",
			"College Regrets Anonymous",
		];

		const randomTheme =
			fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];

		return NextResponse.json({ theme: randomTheme });
	}
}
