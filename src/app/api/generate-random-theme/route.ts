import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("🔑 Gemini API Key exists:", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: NextRequest) {
	try {
		const { prompt } = await request.json();

		console.log("📥 Random theme request received:", {
			prompt: prompt?.slice(0, 100) + "...",
		});

		if (!prompt) {
			console.error("❌ Missing prompt");
			return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
		}

		const enhancedPrompt = `
${prompt}

IMPORTANT: Return ONLY the theme name as a simple string. No quotes, no JSON, no explanation, no additional text. Just the theme name.

Examples of good responses:
- Daddy Issues & Deli Meats
- Corporate Nightmares
- Childhood Traumas & Snacks
- Toxic Ex Stories
- Family Drama & Fast Food
`;

		console.log("🚀 Sending prompt to Gemini for theme generation");

		let result;
		let text;

		try {
			result = await model.generateContent(enhancedPrompt);
			console.log("🎯 Gemini API call successful");

			text = await result.response.text();
			console.log("📝 Raw Gemini response:", text);
			console.log("📏 Response length:", text.length);
		} catch (geminiError) {
			console.error("❌ Gemini API call failed:", geminiError);
			throw new Error(`Gemini API failed: ${geminiError.message}`);
		}

		// Clean up the response - remove quotes, extra spaces, etc.
		let theme = text.trim();

		// Remove quotes if present
		if (
			(theme.startsWith('"') && theme.endsWith('"')) ||
			(theme.startsWith("'") && theme.endsWith("'"))
		) {
			theme = theme.slice(1, -1);
		}

		// Remove any JSON-like formatting
		theme = theme.replace(/^theme:\s*/i, "").trim();

		console.log("✨ Generated theme:", theme);

		// Fallback themes in case Gemini returns something weird
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
			"Therapy Sessions Gone Wrong",
			"Social Media Addiction",
			"Dating App Disasters",
			"Millennial Money Problems",
			"Gen Z Anxiety Attacks",
		];

		// Use fallback if theme is empty, too long, or seems invalid
		if (
			!theme ||
			theme.length > 100 ||
			theme.includes("\n") ||
			theme.toLowerCase().includes("sorry")
		) {
			console.warn(
				"⚠️ Using fallback theme, Gemini response was invalid:",
				theme
			);
			theme = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
		}

		console.log("✅ Final theme selected:", theme);
		return NextResponse.json({ theme });
	} catch (error) {
		console.error("💥 Random theme API error:", error);
		console.error("🔍 Error details:", {
			message: error.message,
			stack: error.stack,
			name: error.name,
		});

		// Return a fallback theme even on error
		const fallbackThemes = [
			"Daddy Issues & Deli Meats",
			"Corporate Nightmares",
			"Childhood Traumas & Snacks",
			"Toxic Ex Stories",
			"Family Drama & Fast Food",
		];

		const fallbackTheme =
			fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];

		return NextResponse.json({
			theme: fallbackTheme,
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
}
