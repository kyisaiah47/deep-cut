#!/usr/bin/env node

/**
 * Database setup script for AI Cards Game
 * This script helps with common database operations
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_DIR = path.join(__dirname, "..", "supabase");
const MIGRATIONS_DIR = path.join(SUPABASE_DIR, "migrations");

function readSQLFile(filename) {
	const filePath = path.join(SUPABASE_DIR, filename);
	if (!fs.existsSync(filePath)) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}
	return fs.readFileSync(filePath, "utf8");
}

function listMigrations() {
	console.log("Available migrations:");
	if (!fs.existsSync(MIGRATIONS_DIR)) {
		console.log("No migrations directory found.");
		return;
	}

	const files = fs
		.readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith(".sql"))
		.sort();

	files.forEach((file) => {
		console.log(`  - ${file}`);
	});
}

function generateSetupScript() {
	console.log("Generating complete setup script...");

	const migrations = [
		"001_initial_schema.sql",
		"002_rls_policies.sql",
		"003_functions_and_triggers.sql",
		"004_timer_synchronization.sql",
	];

	let setupScript = `-- Complete database setup script for AI Cards Game
-- Generated on ${new Date().toISOString()}
-- Run this script to set up the entire database schema, policies, and functions

`;

	migrations.forEach((migration, index) => {
		const migrationPath = path.join(MIGRATIONS_DIR, migration);
		if (fs.existsSync(migrationPath)) {
			setupScript += `-- Migration ${index + 1}: ${migration}\n`;
			setupScript += `-- ${"-".repeat(50)}\n\n`;
			setupScript += fs.readFileSync(migrationPath, "utf8");
			setupScript += "\n\n";
		} else {
			console.warn(`Warning: Migration file not found: ${migration}`);
		}
	});

	const outputPath = path.join(SUPABASE_DIR, "generated_setup.sql");
	fs.writeFileSync(outputPath, setupScript);
	console.log(`Setup script generated: ${outputPath}`);
}

function showHelp() {
	console.log(`
AI Cards Game Database Setup Script

Usage: node scripts/db-setup.js [command]

Commands:
  list        List all available migrations
  generate    Generate a complete setup script
  help        Show this help message

Files:
  supabase/migrations/     - Individual migration files
  supabase/setup.sql       - Manual setup script
  supabase/seed.sql        - Test data
  supabase/README.md       - Setup instructions

Examples:
  node scripts/db-setup.js list
  node scripts/db-setup.js generate
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
	case "list":
		listMigrations();
		break;
	case "generate":
		generateSetupScript();
		break;
	case "help":
	case "--help":
	case "-h":
		showHelp();
		break;
	default:
		if (command) {
			console.error(`Unknown command: ${command}`);
		}
		showHelp();
		process.exit(1);
}
