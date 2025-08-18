/**
 * AI Configuration for Card Generation
 */

export interface AIConfig {
	geminiApiKey?: string;
	model: string;
	maxTokens: number;
	temperature: number;
	fallbackEnabled: boolean;
	cacheEnabled: boolean;
	cacheDurationMs: number;
	contentModerationEnabled: boolean;
}

export const defaultAIConfig: AIConfig = {
	model: "gpt-3.5-turbo",
	maxTokens: 500,
	temperature: 0.8,
	fallbackEnabled: true,
	cacheEnabled: true,
	cacheDurationMs: 5 * 60 * 1000, // 5 minutes
	contentModerationEnabled: true,
};

export function getAIConfig(): AIConfig {
	return {
		...defaultAIConfig,
		geminiApiKey: process.env.GEMINI_API_KEY,
	};
}

export interface PromptTemplates {
	promptGeneration: string;
	responseGeneration: string;
	contentModeration: string;
}

export const promptTemplates: PromptTemplates = {
	promptGeneration: `You are generating prompt cards for a Cards Against Humanity-style game{theme}. 
Create funny, engaging prompts that have blank spaces for responses. Keep them appropriate but humorous. 
The prompt should be a single sentence with one or more blanks indicated by underscores.

Examples:
- "The secret to a happy marriage is ____."
- "I never understood ____ until I tried it myself."
- "My biggest fear is ____ combined with ____."

Generate one funny prompt card with blanks for responses.`,

	responseGeneration: `You are generating response cards for a Cards Against Humanity-style game{theme}. 
Create funny, unexpected responses that could fill in blanks in prompt cards. Each response should be a short phrase or sentence. 
Keep them appropriate but humorous. Generate exactly {count} different responses, separated by newlines.

Examples:
- "a really good sandwich"
- "my collection of rubber ducks"
- "the ability to speak to houseplants"
- "wearing socks with sandals"

Generate {count} funny response cards that could complete various prompts.`,

	contentModeration: `Review the following text for inappropriate content. 
If the content is appropriate for a family-friendly card game, respond with "APPROVED". 
If it contains inappropriate content, respond with "REJECTED" followed by a brief reason.

Text to review: "{text}"`,
};

export function formatPromptTemplate(
	template: string,
	variables: Record<string, string | number>
): string {
	let formatted = template;

	Object.entries(variables).forEach(([key, value]) => {
		const placeholder = `{${key}}`;
		formatted = formatted.replace(new RegExp(placeholder, "g"), String(value));
	});

	return formatted;
}

export interface ContentModerationResult {
	isApproved: boolean;
	reason?: string;
	originalText: string;
	moderatedText?: string;
}

export function basicContentModeration(text: string): ContentModerationResult {
	const inappropriateWords = [
		"explicit",
		"inappropriate",
		"offensive",
		"vulgar",
		"profanity",
		"hate",
		"discrimination",
		"violence",
		"illegal",
		"harmful",
	];

	const lowerText = text.toLowerCase();
	const foundWords = inappropriateWords.filter((word) =>
		lowerText.includes(word)
	);

	if (foundWords.length > 0) {
		let moderatedText = text;
		foundWords.forEach((word) => {
			const regex = new RegExp(word, "gi");
			moderatedText = moderatedText.replace(regex, "[FILTERED]");
		});

		return {
			isApproved: false,
			reason: `Contains inappropriate content: ${foundWords.join(", ")}`,
			originalText: text,
			moderatedText,
		};
	}

	return {
		isApproved: true,
		originalText: text,
	};
}

export interface AIGenerationMetrics {
	requestCount: number;
	successCount: number;
	failureCount: number;
	fallbackCount: number;
	averageResponseTime: number;
	lastRequestTime: number;
}

class AIMetricsTracker {
	private metrics: AIGenerationMetrics = {
		requestCount: 0,
		successCount: 0,
		failureCount: 0,
		fallbackCount: 0,
		averageResponseTime: 0,
		lastRequestTime: 0,
	};

	private responseTimes: number[] = [];

	recordRequest(): void {
		this.metrics.requestCount++;
		this.metrics.lastRequestTime = Date.now();
	}

	recordSuccess(responseTime: number): void {
		this.metrics.successCount++;
		this.recordResponseTime(responseTime);
	}

	recordFailure(): void {
		this.metrics.failureCount++;
	}

	recordFallback(): void {
		this.metrics.fallbackCount++;
	}

	private recordResponseTime(time: number): void {
		this.responseTimes.push(time);

		// Keep only the last 100 response times for average calculation
		if (this.responseTimes.length > 100) {
			this.responseTimes.shift();
		}

		this.metrics.averageResponseTime =
			this.responseTimes.reduce((sum, time) => sum + time, 0) /
			this.responseTimes.length;
	}

	getMetrics(): AIGenerationMetrics {
		return { ...this.metrics };
	}

	reset(): void {
		this.metrics = {
			requestCount: 0,
			successCount: 0,
			failureCount: 0,
			fallbackCount: 0,
			averageResponseTime: 0,
			lastRequestTime: 0,
		};
		this.responseTimes = [];
	}
}

export const aiMetrics = new AIMetricsTracker();
