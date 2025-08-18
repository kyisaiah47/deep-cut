/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				// Neon Arcade Palette
				stage: "#0B0B14",
				"neon-cyan": "#00E5FF",
				"neon-magenta": "#FF3AF2",
				"electric-blue": "#4D7CFF",
				"acid-lime": "#B6FF3A",
				"sun-yellow": "#FFD23A",
				"soft-lavender": "#C7AFFF",

				// Dark surfaces
				"card-bg": "#1A1A2E",
				"card-hover": "#252545",
				"surface-dark": "#16213E",
				"surface-darker": "#0F1419",
			},
			fontFamily: {
				display: ["Orbitron", "monospace"],
				body: ["Space Grotesk", "sans-serif"],
			},
			boxShadow: {
				"neon-cyan":
					"0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.3)",
				"neon-magenta":
					"0 0 20px rgba(255, 58, 242, 0.5), 0 0 40px rgba(255, 58, 242, 0.3)",
				"neon-blue":
					"0 0 20px rgba(77, 124, 255, 0.5), 0 0 40px rgba(77, 124, 255, 0.3)",
				"neon-lime":
					"0 0 20px rgba(182, 255, 58, 0.5), 0 0 40px rgba(182, 255, 58, 0.3)",
				"card-rim":
					"inset 0 0 0 1px rgba(0, 229, 255, 0.3), 0 0 10px rgba(0, 229, 255, 0.2)",
				"card-rim-hover":
					"inset 0 0 0 2px rgba(0, 229, 255, 0.6), 0 0 20px rgba(0, 229, 255, 0.4)",
				"arcade-inset": "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
				"arcade-button":
					"inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 229, 255, 0.3)",
			},
			animation: {
				"neon-pulse": "neonPulse 2s ease-in-out infinite",
				"slot-reveal":
					"slotMachineReveal 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
				"confetti-burst": "confettiBurst 1s ease-out forwards",
				"odometer-roll":
					"odometerRoll 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
				"arcade-flicker": "arcadeFlicker 0.1s ease-in-out 3",
				"scoreboard-glow": "scoreboardGlow 3s ease-in-out infinite",
			},
			keyframes: {
				neonPulse: {
					"0%, 100%": {
						boxShadow:
							"inset 0 0 0 2px rgba(0, 229, 255, 0.6), 0 0 20px rgba(0, 229, 255, 0.4), 0 0 0 4px rgba(0, 229, 255, 0.2)",
					},
					"50%": {
						boxShadow:
							"inset 0 0 0 2px rgba(0, 229, 255, 0.6), 0 0 20px rgba(0, 229, 255, 0.4), 0 0 0 8px rgba(0, 229, 255, 0.4)",
					},
				},
				slotMachineReveal: {
					"0%": {
						transform: "translateY(-100%)",
						opacity: "0",
					},
					"50%": {
						transform: "translateY(10%)",
						opacity: "0.8",
					},
					"100%": {
						transform: "translateY(0)",
						opacity: "1",
					},
				},
				confettiBurst: {
					"0%": {
						transform: "scale(0) rotate(0deg)",
						opacity: "1",
					},
					"50%": {
						transform: "scale(1.2) rotate(180deg)",
						opacity: "0.8",
					},
					"100%": {
						transform: "scale(1.5) rotate(360deg)",
						opacity: "0",
					},
				},
				odometerRoll: {
					"0%": {
						transform: "translateY(100%)",
					},
					"100%": {
						transform: "translateY(0)",
					},
				},
				arcadeFlicker: {
					"0%, 100%": {
						opacity: "1",
					},
					"50%": {
						opacity: "0.8",
					},
				},
				scoreboardGlow: {
					"0%, 100%": {
						opacity: "0.6",
					},
					"50%": {
						opacity: "1",
					},
				},
			},
			backdropBlur: {
				neon: "12px",
			},
			borderRadius: {
				arcade: "12px",
				pill: "25px",
			},
		},
	},
	plugins: [],
};
