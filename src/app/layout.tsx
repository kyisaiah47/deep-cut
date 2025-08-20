import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("http://localhost:3000"),
	title: "Deep Cut: Revelations",
	description:
		"A psychological party game where truth cuts deeper than lies. Face Kiro's challenges and reveal what lurks beneath the surface.",
	keywords: [
		"party game",
		"psychological",
		"truth",
		"revelations",
		"multiplayer",
		"social game",
	],
	authors: [{ name: "Deep Cut Games" }],
	openGraph: {
		title: "Deep Cut: Revelations",
		description:
			"A psychological party game where truth cuts deeper than lies. Face Kiro's challenges and reveal what lurks beneath the surface.",
		type: "website",
		locale: "en_US",
		siteName: "Deep Cut: Revelations",
		images: [
			{
				url: "/favicon-large.svg",
				width: 512,
				height: 512,
				alt: "Deep Cut: Revelations - Kiro's Eye",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "Deep Cut: Revelations",
		description: "A psychological party game where truth cuts deeper than lies",
		images: ["/favicon-large.svg"],
	},
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon.ico", sizes: "32x32" },
		],
		apple: "/favicon-large.svg",
		shortcut: "/favicon.ico",
	},
	manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#0f0f0f" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
