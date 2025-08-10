import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Health Check API Endpoint
 * Provides system health status for monitoring and load balancers
 */

export async function GET(request: NextRequest) {
	const startTime = Date.now();

	try {
		// Basic health check
		const health = {
			status: "healthy",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: process.env.npm_package_version || "unknown",
			environment: process.env.NODE_ENV || "unknown",
			checks: {
				database: "unknown",
				realtime: "unknown",
				memory: "unknown",
			},
		};

		// Check database connectivity
		try {
			const { data, error } = await supabase
				.from("games")
				.select("id")
				.limit(1);

			if (error) {
				health.checks.database = "unhealthy";
				health.status = "degraded";
			} else {
				health.checks.database = "healthy";
			}
		} catch (dbError) {
			health.checks.database = "unhealthy";
			health.status = "degraded";
		}

		// Check real-time connectivity
		try {
			const channel = supabase.channel("health-check");
			await channel.subscribe();
			await channel.unsubscribe();
			health.checks.realtime = "healthy";
		} catch (realtimeError) {
			health.checks.realtime = "unhealthy";
			health.status = "degraded";
		}

		// Check memory usage
		const memoryUsage = process.memoryUsage();
		const memoryUsageMB = {
			rss: Math.round(memoryUsage.rss / 1024 / 1024),
			heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
			heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
			external: Math.round(memoryUsage.external / 1024 / 1024),
		};

		// Consider unhealthy if heap usage is over 90%
		const heapUsagePercent =
			(memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
		if (heapUsagePercent > 90) {
			health.checks.memory = "unhealthy";
			health.status = "degraded";
		} else {
			health.checks.memory = "healthy";
		}

		// Add performance metrics
		const responseTime = Date.now() - startTime;
		const performanceMetrics = {
			responseTime,
			memory: memoryUsageMB,
			heapUsagePercent: Math.round(heapUsagePercent),
		};

		// Determine overall status
		if (health.checks.database === "unhealthy") {
			health.status = "unhealthy";
		}

		const statusCode =
			health.status === "healthy"
				? 200
				: health.status === "degraded"
				? 200
				: 503;

		return NextResponse.json(
			{
				...health,
				performance: performanceMetrics,
			},
			{ status: statusCode }
		);
	} catch (error) {
		console.error("Health check failed:", error);

		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Health check failed",
				responseTime: Date.now() - startTime,
			},
			{ status: 503 }
		);
	}
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
	try {
		// Quick database ping
		const { error } = await supabase.from("games").select("id").limit(1);

		if (error) {
			return new NextResponse(null, { status: 503 });
		}

		return new NextResponse(null, { status: 200 });
	} catch (error) {
		return new NextResponse(null, { status: 503 });
	}
}
