import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Enable experimental features
	// experimental: {
	// 	// Enable React 19 features
	// 	reactCompiler: true,
	// 	// Optimize package imports
	// 	optimizePackageImports: ["framer-motion", "lucide-react"],
	// },

	// Compiler options
	compiler: {
		// Remove console.log in production
		removeConsole: process.env.NODE_ENV === "production",
	},

	// Image optimization
	images: {
		formats: ["image/webp", "image/avif"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},

	// Headers for security and performance
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, max-age=0",
					},
				],
			},
			{
				source: "/_next/static/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},

	// Webpack configuration
	webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
		// Bundle analyzer in development
		if (process.env.ANALYZE === "true") {
			try {
				const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
				config.plugins.push(
					new BundleAnalyzerPlugin({
						analyzerMode: "server",
						analyzerPort: isServer ? 8888 : 8889,
						openAnalyzer: true,
					})
				);
			} catch (error) {
				console.warn(
					"webpack-bundle-analyzer not available, skipping bundle analysis"
				);
			}
		}

		// Optimize for production
		if (!dev) {
			// Tree shaking optimization
			config.optimization.usedExports = true;
			config.optimization.sideEffects = false;

			// Split chunks for better caching
			config.optimization.splitChunks = {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
					},
					common: {
						name: "common",
						minChunks: 2,
						chunks: "all",
						enforce: true,
					},
				},
			};
		}

		// Resolve fallbacks for Node.js modules
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			net: false,
			tls: false,
		};

		return config;
	},

	// Output configuration for standalone deployment
	output: "standalone",

	// Enable source maps in production for debugging
	productionBrowserSourceMaps: false,

	// Redirect configuration
	async redirects() {
		return [
			{
				source: "/",
				destination: "/lobby",
				permanent: false,
			},
		];
	},

	// Environment variables validation
	env: {
		CUSTOM_KEY: process.env.CUSTOM_KEY,
	},

	// TypeScript configuration
	typescript: {
		// Dangerously allow production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: false,
	},

	// ESLint configuration
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: false,
	},

	// Logging configuration
	logging: {
		fetches: {
			fullUrl: true,
		},
	},

	// Server actions configuration
	serverActions: {
		allowedOrigins: ["localhost:3000"],
	},
};

export default nextConfig;
