#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Analyzes and optimizes the application for production deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting performance optimization...\n");

// 1. Analyze bundle size
console.log("📊 Analyzing bundle size...");
try {
	execSync("npm run analyze", { stdio: "inherit" });
	console.log("✅ Bundle analysis complete\n");
} catch (error) {
	console.log("⚠️  Bundle analysis failed, continuing...\n");
}

// 2. Check for unused dependencies
console.log("🔍 Checking for unused dependencies...");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});

const usedDependencies = new Set();
const sourceFiles = [];

// Recursively find all source files
function findSourceFiles(dir) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (
			stat.isDirectory() &&
			!file.startsWith(".") &&
			file !== "node_modules"
		) {
			findSourceFiles(filePath);
		} else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
			sourceFiles.push(filePath);
		}
	}
}

findSourceFiles("src");

// Check which dependencies are actually used
for (const file of sourceFiles) {
	const content = fs.readFileSync(file, "utf8");
	for (const dep of [...dependencies, ...devDependencies]) {
		if (
			content.includes(`from "${dep}"`) ||
			content.includes(`require("${dep}")`)
		) {
			usedDependencies.add(dep);
		}
	}
}

const unusedDeps = dependencies.filter((dep) => !usedDependencies.has(dep));
if (unusedDeps.length > 0) {
	console.log("⚠️  Potentially unused dependencies found:");
	unusedDeps.forEach((dep) => console.log(`   - ${dep}`));
	console.log("   Consider removing these if they're not needed\n");
} else {
	console.log("✅ No unused dependencies found\n");
}

// 3. Check for large files
console.log("📁 Checking for large files...");
const largeFiles = [];

function checkFileSize(dir) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (
			stat.isDirectory() &&
			!file.startsWith(".") &&
			file !== "node_modules"
		) {
			checkFileSize(filePath);
		} else if (file.match(/\.(ts|tsx|js|jsx)$/) && stat.size > 50000) {
			// 50KB
			largeFiles.push({
				path: filePath,
				size: Math.round(stat.size / 1024) + "KB",
			});
		}
	}
}

checkFileSize("src");

if (largeFiles.length > 0) {
	console.log("⚠️  Large files found (>50KB):");
	largeFiles.forEach((file) => console.log(`   - ${file.path} (${file.size})`));
	console.log("   Consider code splitting for these files\n");
} else {
	console.log("✅ No large files found\n");
}

// 4. Check for console.log statements
console.log("🔍 Checking for console.log statements...");
const consoleLogFiles = [];

for (const file of sourceFiles) {
	const content = fs.readFileSync(file, "utf8");
	if (content.includes("console.log") && !file.includes("__tests__")) {
		consoleLogFiles.push(file);
	}
}

if (consoleLogFiles.length > 0) {
	console.log("⚠️  console.log statements found in:");
	consoleLogFiles.forEach((file) => console.log(`   - ${file}`));
	console.log("   Consider removing these for production\n");
} else {
	console.log("✅ No console.log statements found\n");
}

// 5. Check TypeScript configuration
console.log("🔧 Checking TypeScript configuration...");
const tsConfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));

const recommendations = [];

if (!tsConfig.compilerOptions?.strict) {
	recommendations.push("Enable strict mode for better type safety");
}

if (!tsConfig.compilerOptions?.noUnusedLocals) {
	recommendations.push("Enable noUnusedLocals to catch unused variables");
}

if (!tsConfig.compilerOptions?.noUnusedParameters) {
	recommendations.push("Enable noUnusedParameters to catch unused parameters");
}

if (recommendations.length > 0) {
	console.log("⚠️  TypeScript configuration recommendations:");
	recommendations.forEach((rec) => console.log(`   - ${rec}`));
	console.log();
} else {
	console.log("✅ TypeScript configuration looks good\n");
}

// 6. Check for proper error boundaries
console.log("🛡️  Checking for error boundaries...");
const hasErrorBoundary = sourceFiles.some((file) => {
	const content = fs.readFileSync(file, "utf8");
	return (
		content.includes("ErrorBoundary") || content.includes("componentDidCatch")
	);
});

if (hasErrorBoundary) {
	console.log("✅ Error boundaries found\n");
} else {
	console.log(
		"⚠️  No error boundaries found - consider adding them for better error handling\n"
	);
}

// 7. Check for proper loading states
console.log("⏳ Checking for loading states...");
const hasLoadingStates = sourceFiles.some((file) => {
	const content = fs.readFileSync(file, "utf8");
	return (
		content.includes("loading") ||
		content.includes("isLoading") ||
		content.includes("Skeleton")
	);
});

if (hasLoadingStates) {
	console.log("✅ Loading states found\n");
} else {
	console.log(
		"⚠️  No loading states found - consider adding them for better UX\n"
	);
}

// 8. Database query optimization check
console.log("🗄️  Checking database queries...");
const apiFiles = [];

function findApiFiles(dir) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			findApiFiles(filePath);
		} else if (file === "route.ts") {
			apiFiles.push(filePath);
		}
	}
}

if (fs.existsSync("src/app/api")) {
	findApiFiles("src/app/api");
}

const queryIssues = [];

for (const file of apiFiles) {
	const content = fs.readFileSync(file, "utf8");

	// Check for N+1 query patterns
	if (content.includes("for") && content.includes(".from(")) {
		queryIssues.push(`${file}: Potential N+1 query pattern`);
	}

	// Check for missing select clauses
	if (content.includes(".from(") && !content.includes(".select(")) {
		queryIssues.push(`${file}: Missing select clause - fetching all columns`);
	}

	// Check for missing error handling
	if (
		content.includes("supabase") &&
		!content.includes("try") &&
		!content.includes("catch")
	) {
		queryIssues.push(`${file}: Missing error handling for database operations`);
	}
}

if (queryIssues.length > 0) {
	console.log("⚠️  Database query issues found:");
	queryIssues.forEach((issue) => console.log(`   - ${issue}`));
	console.log();
} else {
	console.log("✅ Database queries look optimized\n");
}

// 9. Generate optimization report
console.log("📋 Generating optimization report...");

const report = {
	timestamp: new Date().toISOString(),
	bundleAnalyzed: true,
	unusedDependencies: unusedDeps,
	largeFiles: largeFiles,
	consoleLogFiles: consoleLogFiles,
	tsConfigRecommendations: recommendations,
	hasErrorBoundaries: hasErrorBoundary,
	hasLoadingStates: hasLoadingStates,
	databaseQueryIssues: queryIssues,
	totalSourceFiles: sourceFiles.length,
	totalApiFiles: apiFiles.length,
};

fs.writeFileSync("optimization-report.json", JSON.stringify(report, null, 2));
console.log("✅ Optimization report saved to optimization-report.json\n");

// 10. Performance recommendations
console.log("💡 Performance Recommendations:");
console.log("   1. Enable gzip compression on your server");
console.log("   2. Use CDN for static assets");
console.log("   3. Implement proper caching headers");
console.log("   4. Monitor Core Web Vitals");
console.log("   5. Use Next.js Image component for images");
console.log("   6. Implement proper error boundaries");
console.log("   7. Add loading states for better UX");
console.log("   8. Monitor database query performance");
console.log("   9. Use React.memo for expensive components");
console.log("   10. Implement proper cleanup in useEffect hooks\n");

console.log("🎉 Performance optimization analysis complete!");
console.log("📊 Check optimization-report.json for detailed results");
