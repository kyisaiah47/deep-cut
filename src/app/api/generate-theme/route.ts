import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase"; // adjust path if needed

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: NextRequest) {
	try {
		const { theme, roomCode } = await request.json();

		if (!theme || !roomCode) {
			return NextResponse.json(
				{ error: "Missing theme or roomCode" },
				{ status: 400 }
			);
		}

		const generationPrompt = `
Generate 10 Cards Against Humanity-style QUESTION cards and 30 ANSWER cards.
Theme: ${theme}
Return ONLY valid JSON in this format:
{
  "questions": ["..."],
  "answers": ["..."]
}
`;

		const result = await model.generateContent(generationPrompt);
		const text = await result.response.text();

		let questions: string[] = [];
		let answers: string[] = [];

		try {
			const parsed = JSON.parse(text);
			questions = parsed.questions || [];
			answers = parsed.answers || [];
		} catch (parseErr) {
			console.warn("Gemini response parse failed, using fallback deck.");
		}

		// Fallback in case Gemini messes up
		if (questions.length === 0 || answers.length === 0) {
			questions = [
				"What’s my toxic trait?",
				"Why did I ghost my therapist?",
				"What’s the real reason I’m single?",
			];
			answers = [
				"Drunk texts to my ex.",
				"Calling everything a 'trauma response'.",
				"Matching tattoos on the first date.",
			];
		}

		const { data, error } = await supabase
			.from("decks")
			.insert([{ theme, room_code: roomCode, questions, answers }])
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ deckId: data.id, theme: data.theme });
	} catch (error) {
		console.error("Error generating deck:", error);
		return NextResponse.json(
			{ error: "Deck generation failed" },
			{ status: 500 }
		);
	}
}
