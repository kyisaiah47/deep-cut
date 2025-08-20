import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const { prompt } = body;

	if (!process.env.GEMINI_API_KEY) {
		return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const result = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [{ text: prompt }],
						},
					],
				}),
			}
		);

		const data = await result.json();
		const theme = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

		if (!theme) {
			throw new Error("No theme returned");
		}

		return new Response(JSON.stringify({ theme }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Gemini API error:", error);
		return new Response(JSON.stringify({ error: "Failed to generate theme" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
