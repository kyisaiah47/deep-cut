// pages/api/generate-random-theme.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { prompt } = req.body;
	if (!process.env.GEMINI_API_KEY) {
		return res.status(500).json({ error: "Missing Gemini API key" });
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

		res.status(200).json({ theme });
	} catch (error) {
		console.error("Gemini API error:", error);
		res.status(500).json({ error: "Failed to generate theme" });
	}
}
