import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface GenerateCardsRequest {
	gameId: string;
	roundNumber: number;
	playerCount: number;
	theme?: string;
}

interface Card {
	type: "prompt" | "response";
	text: string;
	gameId: string;
	roundNumber: number;
	playerId?: string;
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { gameId, roundNumber, playerCount, theme } =
			(await req.json()) as GenerateCardsRequest;

		if (!gameId || !roundNumber || !playerCount) {
			return new Response(
				JSON.stringify({ error: "Missing required parameters" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		// Initialize Supabase client
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Generate cards using AI or fallback
		const cards = await generateCardsWithFallback(
			gameId,
			roundNumber,
			playerCount,
			theme
		);

		// Store cards in database
		const { error: insertError } = await supabase.from("cards").insert(cards);

		if (insertError) {
			console.error("Database insert error:", insertError);
			return new Response(JSON.stringify({ error: "Failed to store cards" }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				cardsGenerated: cards.length,
				promptCard: cards.find((card) => card.type === "prompt"),
				responseCardsCount: cards.filter((card) => card.type === "response")
					.length,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Edge function error:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});

async function generateCardsWithFallback(
	gameId: string,
	roundNumber: number,
	playerCount: number,
	theme?: string
): Promise<Card[]> {
	try {
		// Try AI generation first
		return await generateCardsWithAI(gameId, roundNumber, playerCount, theme);
	} catch (error) {
		console.error("AI generation failed, using fallback:", error);
		// Fall back to pre-written cards
		return generateFallbackCards(gameId, roundNumber, playerCount);
	}
}

async function generateCardsWithAI(
	gameId: string,
	roundNumber: number,
	playerCount: number,
	theme?: string
): Promise<Card[]> {
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

	if (!openaiApiKey) {
		throw new Error("OpenAI API key not configured");
	}

	const themePrompt = theme ? ` with a ${theme} theme` : "";

	// Generate prompt card
	const promptResponse = await fetch(
		"https://api.openai.com/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${openaiApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content: `You are generating prompt cards for a Cards Against Humanity-style game${themePrompt}. Create funny, engaging prompts that have blank spaces for responses. Keep them appropriate but humorous. The prompt should be a single sentence with one or more blanks indicated by underscores.`,
					},
					{
						role: "user",
						content:
							"Generate one funny prompt card with blanks for responses.",
					},
				],
				max_tokens: 100,
				temperature: 0.8,
			}),
		}
	);

	if (!promptResponse.ok) {
		throw new Error(`OpenAI API error: ${promptResponse.status}`);
	}

	const promptData = await promptResponse.json();
	const promptText = promptData.choices[0]?.message?.content?.trim();

	if (!promptText) {
		throw new Error("Failed to generate prompt text");
	}

	// Generate response cards (need more responses than players for variety)
	const responseCount = Math.max(playerCount * 6, 20); // Ensure enough for distribution

	const responseResponse = await fetch(
		"https://api.openai.com/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${openaiApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content: `You are generating response cards for a Cards Against Humanity-style game${themePrompt}. Create funny, unexpected responses that could fill in blanks in prompt cards. Each response should be a short phrase or sentence. Keep them appropriate but humorous. Generate exactly ${responseCount} different responses, separated by newlines.`,
					},
					{
						role: "user",
						content: `Generate ${responseCount} funny response cards that could complete various prompts.`,
					},
				],
				max_tokens: 500,
				temperature: 0.9,
			}),
		}
	);

	if (!responseResponse.ok) {
		throw new Error(`OpenAI API error: ${responseResponse.status}`);
	}

	const responseData = await responseResponse.json();
	const responseText = responseData.choices[0]?.message?.content?.trim();

	if (!responseText) {
		throw new Error("Failed to generate response text");
	}

	// Parse responses and filter out empty ones
	const responses = responseText
		.split("\n")
		.map((r) => r.trim())
		.filter((r) => r.length > 0)
		.slice(0, responseCount);

	// Apply content moderation
	const moderatedPrompt = await moderateContent(promptText);
	const moderatedResponses = await Promise.all(
		responses.map((response) => moderateContent(response))
	);

	// Create card objects
	const cards: Card[] = [
		{
			type: "prompt",
			text: moderatedPrompt,
			gameId,
			roundNumber,
		},
		...moderatedResponses.map((response) => ({
			type: "response" as const,
			text: response,
			gameId,
			roundNumber,
		})),
	];

	return cards;
}

async function moderateContent(text: string): Promise<string> {
	// Basic content filtering - in production, you might want more sophisticated moderation
	const inappropriateWords = [
		// Add inappropriate words to filter out
		"explicit",
		"inappropriate",
		"offensive",
	];

	let moderatedText = text;

	inappropriateWords.forEach((word) => {
		const regex = new RegExp(word, "gi");
		moderatedText = moderatedText.replace(regex, "[FILTERED]");
	});

	return moderatedText;
}

function generateFallbackCards(
	gameId: string,
	roundNumber: number,
	playerCount: number
): Card[] {
	const fallbackPrompts = [
		"The secret to a happy marriage is ____.",
		"I never understood ____ until I tried it myself.",
		"My biggest fear is ____ combined with ____.",
		"The best part about being an adult is ____.",
		"If I could have any superpower, it would be ____.",
		"The worst advice I ever received was ____.",
		"My ideal vacation would involve ____.",
		"The most embarrassing thing that happened to me was ____.",
		"If aliens visited Earth, they would be confused by ____.",
		"The key to success is ____ and ____.",
	];

	const fallbackResponses = [
		"a really good sandwich",
		"my collection of rubber ducks",
		"the ability to speak to houseplants",
		"wearing socks with sandals",
		"my secret talent for interpretive dance",
		"a lifetime supply of bubble wrap",
		"the wisdom of fortune cookies",
		"my fear of butterflies",
		"an unhealthy obsession with organizing",
		"the power of positive thinking",
		"my grandmother's secret recipe",
		"a really comfortable chair",
		"the art of procrastination",
		"my ability to find parking spots",
		"a good cup of coffee",
		"the magic of friendship",
		"my collection of funny hats",
		"the perfect playlist",
		"a really good book",
		"the joy of small victories",
	];

	// Select random prompt
	const promptIndex = Math.floor(Math.random() * fallbackPrompts.length);
	const selectedPrompt = fallbackPrompts[promptIndex];

	// Select random responses (more than needed for variety)
	const responseCount = Math.max(playerCount * 6, 20); // Ensure enough for distribution
	const shuffledResponses = [...fallbackResponses].sort(
		() => Math.random() - 0.5
	);
	const selectedResponses = shuffledResponses.slice(0, responseCount);

	const cards: Card[] = [
		{
			type: "prompt",
			text: selectedPrompt,
			gameId,
			roundNumber,
		},
		...selectedResponses.map((response) => ({
			type: "response" as const,
			text: response,
			gameId,
			roundNumber,
		})),
	];

	return cards;
}
