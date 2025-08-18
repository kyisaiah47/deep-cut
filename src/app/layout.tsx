import type { Metadata } from "next";
import "./globals.css";
import { PerformanceToggle } from "@/components/PerformanceDashboard";
import "@/lib/performance-init";

export const metadata: Metadata = {
	title: "Neon Cards - Arcade Game Show",
	description: "High-energy multiplayer card game with neon arcade vibes",
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
