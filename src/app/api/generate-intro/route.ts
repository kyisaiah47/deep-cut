import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
	const { theme, prompt } = await request.json();

	try {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error("Gemini API key not configured");
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction:
				"You are Kiro, a cryptic and poetic AI host for a psychological party game. You create atmospheric, slightly ominous welcome messages that set the mood. Be dramatic but not scary, poetic but not pretentious. Always end with subtle menace or mystery. Respond with the welcome message only, in 1-3 sentences.",
		});

		const result = await model.generateContent(prompt);
		const intro =
			result.response.text().trim() ||
			`Welcome to the realm of ${theme}. Your truths await in the shadows.`;

		// Remove quotes if the AI added them
		const cleanIntro = intro.replace(/^["']|["']$/g, "");

		return NextResponse.json({ intro: cleanIntro });
	} catch (error) {
		console.error("Error generating intro:", error);

		// Fallback intros based on theme
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
