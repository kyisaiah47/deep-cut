import type { Metadata } from "next";
import "./globals.css";
import { PerformanceToggle } from "@/components/PerformanceDashboard";
import "@/lib/performance-init";

export const metadata: Metadata = {
	title: "CTRL+LOL - Meme Arcade Mayhem",
	description:
		"Cards Against Humanity meets neon arcade chaos! Meme-fueled multiplayer mayhem with AI-generated cards.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">
				{children}
				<PerformanceToggle />
			</body>
		</html>
	);
}
