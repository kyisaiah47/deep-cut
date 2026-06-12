import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
	try {
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			generationConfig: { responseMimeType: "application/json" },
		});
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		);
		const { theme, roomCode } = await request.json();

		console.log("📥 API Request received:", { theme, roomCode });

		if (!theme || !roomCode) {
			console.error("❌ Missing required fields:", { theme, roomCode });
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

		console.log(
			"🚀 Sending prompt to Gemini:",
			generationPrompt.slice(0, 100) + "..."
		);

		let result;
		let text;

		try {
			result = await model.generateContent(generationPrompt);
			console.log("🎯 Gemini API call successful");

			text = await result.response.text();
			console.log("📝 Raw Gemini response:", text);
			console.log("📏 Response length:", text.length);
		} catch (geminiError) {
			console.error("❌ Gemini API call failed, using fallback deck:", geminiError);
			text = "";
		}

		let questions: string[] = [];
		let answers: string[] = [];

		try {
			const parsed = JSON.parse(text);
			console.log("✅ JSON parsed successfully:", {
				questionsCount: parsed.questions?.length || 0,
				answersCount: parsed.answers?.length || 0,
			});
			questions = parsed.questions || [];
			answers = parsed.answers || [];
		} catch (parseErr) {
			console.error("❌ Gemini response parse failed:", parseErr);
			console.error("🔍 Raw response that failed to parse:", text);
		}

		// Fallback in case Gemini messes up
		if (questions.length === 0 || answers.length === 0) {
			console.warn("⚠️ Using fallback deck due to insufficient content:", {
				questionsReceived: questions.length,
				answersReceived: answers.length,
			});

			questions = [
				"What's my toxic trait?",
				"Why did I ghost my therapist?",
				"What's the real reason I'm single?",
			];
			answers = [
				"Drunk texts to my ex.",
				"Calling everything a 'trauma response'.",
				"Matching tattoos on the first date.",
			];
		} else {
			console.log("✅ Using Gemini-generated content:", {
				questionsCount: questions.length,
				answersCount: answers.length,
			});
		}

		console.log("💾 Saving to database...");
		const { data, error } = await supabase
			.from("decks")
			.insert([{ theme, room_code: roomCode, questions, answers }])
			.select()
			.single();

		if (error) {
			console.error("❌ Database save failed:", error);
			throw error;
		}

		console.log("✅ Deck saved successfully:", {
			deckId: data.id,
			theme: data.theme,
		});
		return NextResponse.json({ deckId: data.id, theme: data.theme });
	} catch (error) {
		console.error("💥 API route error:", error);
		if (error instanceof Error) {
			console.error("🔍 Error details:", {
				message: error.message,
				stack: error.stack,
				name: error.name,
			});
		} else {
			console.error("🔍 Error details:", error);
		}

		let errorMessage = "Deck generation failed";
		if (error instanceof Error && process.env.NODE_ENV === "development") {
			errorMessage += ": " + error.message;
		}
		return NextResponse.json(
			{
				error: errorMessage,
			},
			{ status: 500 }
		);
	}
}
