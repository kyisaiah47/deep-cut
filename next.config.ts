import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Enable experimental features for performance
	experimental: {
		optimizePackageImports: ["framer-motion", "lucide-react"],
	},

	// Bundle analyzer for monitoring
	webpack: (config, { dev, isServer }) => {
		// Bundle analyzer
		if (process.env.ANALYZE === "true") {
			const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
			config.plugins.push(
				new BundleAnalyzerPlugin({
					analyzerMode: "static",
					openAnalyzer: true,
				})
			);
		}

		// Enable bundle analysis in development
		if (dev && !isServer) {
			config.optimization = {
				...config.optimization,
				splitChunks: {
					chunks: "all",
					cacheGroups: {
						vendor: {
							test: /[\\/]node_modules[\\/]/,
							name: "vendors",
							chunks: "all",
						},
						game: {
							test: /[\\/]src[\\/]components[\\/](Game|Voting|Submission|Score)/,
							name: "game-components",
							chunks: "all",
						},
					},
				},
			};
		}

		return config;
	},

	// Performance optimizations
	compress: true,
	poweredByHeader: false,

	// Image optimization
	images: {
		formats: ["image/webp", "image/avif"],
	},
};

export default nextConfig;
