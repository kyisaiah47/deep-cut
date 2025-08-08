import { NextRequest, NextResponse } from "next/server";

interface ErrorLogEntry {
	error: {
		message: string;
		type: string;
		timestamp: string;
		context?: Record<string, unknown>;
	};
	gameId?: string;
	playerId?: string;
	userAgent: string;
	url: string;
	sessionId?: string;
}

export async function POST(request: NextRequest) {
	try {
		const errorLog: ErrorLogEntry = await request.json();

		// Validate the error log entry
		if (!errorLog.error?.message || !errorLog.error?.type) {
			return NextResponse.json(
				{ error: "Invalid error log format" },
				{ status: 400 }
			);
		}

		// In a production environment, you would:
		// 1. Store the error in a database
		// 2. Send to external monitoring service (e.g., Sentry, DataDog)
		// 3. Alert on critical errors
		// 4. Aggregate error metrics

		// For now, just log to console and return success
		console.error("Client Error Report:", {
			timestamp: new Date().toISOString(),
			error: errorLog.error,
			context: {
				gameId: errorLog.gameId,
				playerId: errorLog.playerId,
				userAgent: errorLog.userAgent,
				url: errorLog.url,
				sessionId: errorLog.sessionId,
			},
		});

		// Example: Send to external monitoring service
		// await sendToMonitoringService(errorLog);

		return NextResponse.json({
			success: true,
			message: "Error logged successfully",
		});
	} catch (err) {
		console.error("Failed to process error log:", err);
		return NextResponse.json(
			{ error: "Failed to process error log" },
			{ status: 500 }
		);
	}
}

// Example function for sending to external monitoring service
async function sendToMonitoringService(errorLog: ErrorLogEntry) {
	// Example implementation for Sentry, DataDog, etc.
	// This would be configured based on your monitoring service

	try {
		// Example: Send to webhook or API endpoint
		// await fetch('https://your-monitoring-service.com/api/errors', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(errorLog)
		// });
	} catch (err) {
		console.warn("Failed to send error to monitoring service:", err);
	}
}

// GET endpoint for retrieving error statistics (for admin/debugging)
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const gameId = searchParams.get("gameId");
	const hours = parseInt(searchParams.get("hours") || "24");

	try {
		// In a real implementation, you would query your error database
		// For now, return mock statistics
		const stats = {
			totalErrors: 0,
			errorsByType: {
				connection: 0,
				game_state: 0,
				ai_generation: 0,
				unknown: 0,
			},
			recentErrors: [],
			timeRange: `${hours} hours`,
			gameId: gameId || "all",
		};

		return NextResponse.json(stats);
	} catch (err) {
		console.error("Failed to retrieve error statistics:", err);
		return NextResponse.json(
			{ error: "Failed to retrieve error statistics" },
			{ status: 500 }
		);
	}
}
