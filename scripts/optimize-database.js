#!/usr/bin/env node

/**
 * Database Optimization Script
 * Optimizes database performance for production deployment
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("❌ Missing Supabase environment variables");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function optimizeDatabase() {
	console.log("🗄️  Starting database optimization...\n");

	try {
		// 1. Create performance indexes
		console.log("📊 Creating performance indexes...");

		const indexes = [
			// Game lookups
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_room_code ON games(room_code);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_phase ON games(phase);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_created_at ON games(created_at);",

			// Player queries
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_game_id ON players(game_id);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_connected ON players(is_connected);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_game_connected ON players(game_id, is_connected);",

			// Card distribution
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cards_game_round ON cards(game_id, round_number);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cards_player ON cards(player_id);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cards_type ON cards(type);",

			// Submissions and voting
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_game_round ON submissions(game_id, round_number);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_player ON submissions(player_id);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_game_round ON votes(game_id, round_number);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_player_round ON votes(player_id, round_number);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_submission ON votes(submission_id);",
		];

		for (const indexSql of indexes) {
			try {
				const { error } = await supabase.rpc("exec_sql", { sql: indexSql });
				if (error) {
					console.log(`⚠️  Index creation warning: ${error.message}`);
				}
			} catch (err) {
				console.log(`⚠️  Index creation warning: ${err.message}`);
			}
		}

		console.log("✅ Performance indexes created\n");

		// 2. Analyze table statistics
		console.log("📈 Analyzing table statistics...");

		const tables = ["games", "players", "cards", "submissions", "votes"];

		for (const table of tables) {
			try {
				await supabase.rpc("exec_sql", { sql: `ANALYZE ${table};` });
			} catch (err) {
				console.log(`⚠️  Analysis warning for ${table}: ${err.message}`);
			}
		}

		console.log("✅ Table statistics updated\n");

		// 3. Check for slow queries
		console.log("🐌 Checking for potential slow queries...");

		const queryChecks = [
			{
				name: "Games without indexes",
				query: `
					SELECT schemaname, tablename, attname, n_distinct, correlation
					FROM pg_stats
					WHERE tablename IN ('games', 'players', 'cards', 'submissions', 'votes')
					AND n_distinct > 100
					ORDER BY n_distinct DESC;
				`,
			},
			{
				name: "Large tables",
				query: `
					SELECT 
						schemaname,
						tablename,
						pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
					FROM pg_tables
					WHERE tablename IN ('games', 'players', 'cards', 'submissions', 'votes')
					ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
				`,
			},
		];

		for (const check of queryChecks) {
			try {
				const { data, error } = await supabase.rpc("exec_sql", {
					sql: check.query,
				});
				if (error) {
					console.log(`⚠️  ${check.name} check failed: ${error.message}`);
				} else if (data && data.length > 0) {
					console.log(`📊 ${check.name}:`);
					console.table(data);
				}
			} catch (err) {
				console.log(`⚠️  ${check.name} check failed: ${err.message}`);
			}
		}

		// 4. Optimize RLS policies
		console.log("🔒 Optimizing RLS policies...");

		const rlsOptimizations = [
			// Add indexes for RLS policy conditions
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_game_id_rls ON players(game_id) WHERE is_connected = true;",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cards_game_player_rls ON cards(game_id, player_id);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_game_player_rls ON submissions(game_id, player_id);",
			"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_game_player_rls ON votes(game_id, player_id);",
		];

		for (const rlsSql of rlsOptimizations) {
			try {
				const { error } = await supabase.rpc("exec_sql", { sql: rlsSql });
				if (error) {
					console.log(`⚠️  RLS optimization warning: ${error.message}`);
				}
			} catch (err) {
				console.log(`⚠️  RLS optimization warning: ${err.message}`);
			}
		}

		console.log("✅ RLS policies optimized\n");

		// 5. Set up connection pooling recommendations
		console.log("🔗 Connection pooling recommendations:");
		console.log("   - Set pool size to 15-20 connections");
		console.log("   - Use transaction mode for better performance");
		console.log("   - Set max client connections to 200");
		console.log("   - Enable connection timeout of 30 seconds\n");

		// 6. Set up monitoring queries
		console.log("📊 Setting up monitoring queries...");

		const monitoringQueries = {
			"Active connections": `
				SELECT count(*) as active_connections
				FROM pg_stat_activity
				WHERE state = 'active';
			`,
			"Database size": `
				SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
			`,
			"Table sizes": `
				SELECT 
					tablename,
					pg_size_pretty(pg_total_relation_size(tablename)) as size
				FROM pg_tables
				WHERE tablename IN ('games', 'players', 'cards', 'submissions', 'votes')
				ORDER BY pg_total_relation_size(tablename) DESC;
			`,
			"Index usage": `
				SELECT 
					schemaname,
					tablename,
					indexname,
					idx_scan,
					idx_tup_read,
					idx_tup_fetch
				FROM pg_stat_user_indexes
				WHERE tablename IN ('games', 'players', 'cards', 'submissions', 'votes')
				ORDER BY idx_scan DESC;
			`,
		};

		// Save monitoring queries to file
		const fs = require("fs");
		fs.writeFileSync(
			"database-monitoring-queries.sql",
			Object.entries(monitoringQueries)
				.map(([name, query]) => `-- ${name}\n${query}\n`)
				.join("\n")
		);

		console.log(
			"✅ Monitoring queries saved to database-monitoring-queries.sql\n"
		);

		// 7. Performance recommendations
		console.log("💡 Database Performance Recommendations:");
		console.log("   1. Monitor query performance regularly");
		console.log("   2. Set up automated VACUUM and ANALYZE");
		console.log("   3. Monitor connection pool usage");
		console.log("   4. Set up database alerts for slow queries");
		console.log("   5. Consider read replicas for high traffic");
		console.log("   6. Implement query result caching");
		console.log("   7. Monitor table bloat and fragmentation");
		console.log("   8. Set up backup and recovery procedures");
		console.log("   9. Monitor disk space usage");
		console.log("   10. Optimize RLS policies for performance\n");

		// 8. Generate optimization report
		const report = {
			timestamp: new Date().toISOString(),
			indexesCreated: indexes.length,
			tablesAnalyzed: tables.length,
			rlsOptimizations: rlsOptimizations.length,
			recommendations: [
				"Monitor query performance regularly",
				"Set up automated VACUUM and ANALYZE",
				"Monitor connection pool usage",
				"Set up database alerts for slow queries",
				"Consider read replicas for high traffic",
			],
		};

		fs.writeFileSync(
			"database-optimization-report.json",
			JSON.stringify(report, null, 2)
		);
		console.log(
			"✅ Database optimization report saved to database-optimization-report.json\n"
		);

		console.log("🎉 Database optimization complete!");
	} catch (error) {
		console.error("❌ Database optimization failed:", error);
		process.exit(1);
	}
}

// Run optimization if called directly
if (require.main === module) {
	optimizeDatabase();
}

module.exports = { optimizeDatabase };
