"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ThemeSystemProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectTheme: (theme: string, isCustom?: boolean) => void;
	currentTheme?: string;
}

interface CustomTheme {
	name: string;
	description: string;
	created: string;
	popularity: number;
}

export default function ThemeSystem({
	isOpen,
	onClose,
	onSelectTheme,
	currentTheme,
}: ThemeSystemProps) {
	const [activeTab, setActiveTab] = useState<"preset" | "custom" | "create">(
		"preset"
	);
	const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
	const [newThemeName, setNewThemeName] = useState("");
	const [newThemeDescription, setNewThemeDescription] = useState("");
	const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

	const presetThemes = [
		{
			name: "Childhood Secrets",
			description:
				"Embarrassing moments from your youth that still make you cringe",
			emoji: "🧸",
			color: "bg-blue-500",
		},
		{
			name: "Work Confessions",
			description: "Professional mishaps and office drama you shouldn't share",
			emoji: "💼",
			color: "bg-green-500",
		},
		{
			name: "Relationship Drama",
			description: "Dating disasters and romantic revelations that cut deep",
			emoji: "💔",
			color: "bg-red-500",
		},
		{
			name: "Family Dysfunction",
			description: "Holiday horrors and relatives you pretend to love",
			emoji: "🏠",
			color: "bg-yellow-500",
		},
		{
			name: "Social Anxiety",
			description: "Awkward encounters and cringe-worthy social moments",
			emoji: "😅",
			color: "bg-purple-500",
		},
		{
			name: "Digital Shame",
			description: "Online embarrassments and social media regrets",
			emoji: "📱",
			color: "bg-pink-500",
		},
		{
			name: "Money Matters",
			description: "Financial failures and expensive mistakes you hide",
			emoji: "💸",
			color: "bg-indigo-500",
		},
		{
			name: "Health Horrors",
			description: "Medical mishaps and body-related embarrassments",
			emoji: "🏥",
			color: "bg-teal-500",
		},
	];

	useEffect(() => {
		// Load custom themes from localStorage
		const saved = localStorage.getItem("deep-cut-custom-themes");
		if (saved) {
			setCustomThemes(JSON.parse(saved));
		}
	}, []);

	const saveCustomThemes = (themes: CustomTheme[]) => {
		setCustomThemes(themes);
		localStorage.setItem("deep-cut-custom-themes", JSON.stringify(themes));
	};

	const generateCustomTheme = async () => {
		if (!newThemeName.trim()) return;

		setIsGeneratingTheme(true);

		try {
			const response = await fetch("/api/generate-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					themeName: newThemeName,
					description: newThemeDescription || undefined,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate theme");

			const data = await response.json();

			const newTheme: CustomTheme = {
				name: data.theme || newThemeName,
				description:
					data.description ||
					newThemeDescription ||
					"A custom theme created by the community",
				created: new Date().toLocaleDateString(),
				popularity: 1,
			};

			const updatedThemes = [newTheme, ...customThemes];
			saveCustomThemes(updatedThemes);

			setNewThemeName("");
			setNewThemeDescription("");
			setActiveTab("custom");
		} catch (error) {
			console.error("Error generating theme:", error);
			// Fallback to manual creation
			const newTheme: CustomTheme = {
				name: newThemeName,
				description:
					newThemeDescription || "A custom theme created by the community",
				created: new Date().toLocaleDateString(),
				popularity: 1,
			};

			const updatedThemes = [newTheme, ...customThemes];
			saveCustomThemes(updatedThemes);

			setNewThemeName("");
			setNewThemeDescription("");
			setActiveTab("custom");
		} finally {
			setIsGeneratingTheme(false);
		}
	};

	const deleteCustomTheme = (themeToDelete: CustomTheme) => {
		const updatedThemes = customThemes.filter(
			(theme) => theme.name !== themeToDelete.name
		);
		saveCustomThemes(updatedThemes);
	};

	const handleThemeSelect = (theme: string, isCustom = false) => {
		onSelectTheme(theme, isCustom);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
		>
			<motion.div
				initial={{ scale: 0.9, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.9, y: 20 }}
				className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div>
						<h2 className="text-3xl font-bold text-pink-500">
							Choose Your Truth
						</h2>
						<p className="text-zinc-400">
							Select a theme that will expose everyone&apos;s secrets
						</p>
					</div>
					<Button
						onClick={onClose}
						variant="outline"
						size="sm"
					>
						✕
					</Button>
				</div>

				{/* Tabs */}
				<div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
					{[
						{ key: "preset" as const, label: "Preset Themes", icon: "🎯" },
						{ key: "custom" as const, label: "Community Themes", icon: "👥" },
						{ key: "create" as const, label: "Create Theme", icon: "✨" },
					].map(({ key, label, icon }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`flex-1 py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
								activeTab === key
									? "bg-pink-600 text-white"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							<span>{icon}</span>
							<span className="hidden sm:inline">{label}</span>
						</button>
					))}
				</div>

				{/* Content */}
				<AnimatePresence mode="wait">
					{activeTab === "preset" && (
						<motion.div
							key="preset"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="grid grid-cols-1 md:grid-cols-2 gap-4"
						>
							{presetThemes.map((theme, i) => (
								<motion.div
									key={theme.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.1 }}
									className={`group cursor-pointer border-2 rounded-xl p-6 transition-all hover:scale-105 ${
										currentTheme === theme.name
											? "border-pink-500 bg-pink-500/10"
											: "border-zinc-600 hover:border-zinc-500"
									}`}
									onClick={() => handleThemeSelect(theme.name)}
								>
									<div className="flex items-center gap-3 mb-3">
										<div
											className={`w-12 h-12 rounded-full ${theme.color} flex items-center justify-center text-2xl`}
										>
											{theme.emoji}
										</div>
										<div>
											<h3 className="text-lg font-semibold text-white">
												{theme.name}
											</h3>
											<div className="text-xs text-zinc-400">Preset Theme</div>
										</div>
									</div>
									<p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
										{theme.description}
									</p>
								</motion.div>
							))}
						</motion.div>
					)}

					{activeTab === "custom" && (
						<motion.div
							key="custom"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-4"
						>
							{customThemes.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-6xl mb-4">🎨</div>
									<h3 className="text-xl font-semibold text-zinc-400 mb-2">
										No Custom Themes Yet
									</h3>
									<p className="text-zinc-500 mb-4">
										Create your first custom theme to get started!
									</p>
									<Button
										onClick={() => setActiveTab("create")}
										className="bg-pink-600 hover:bg-pink-700"
									>
										Create Theme
									</Button>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{customThemes.map((theme, i) => (
										<motion.div
											key={theme.name}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: i * 0.1 }}
											className={`group cursor-pointer border-2 rounded-xl p-6 transition-all hover:scale-105 relative ${
												currentTheme === theme.name
													? "border-pink-500 bg-pink-500/10"
													: "border-zinc-600 hover:border-zinc-500"
											}`}
											onClick={() => handleThemeSelect(theme.name, true)}
										>
											<button
												onClick={(e) => {
													e.stopPropagation();
													deleteCustomTheme(theme);
												}}
												className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												✕
											</button>

											<div className="flex items-center gap-3 mb-3">
												<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
													🎭
												</div>
												<div>
													<h3 className="text-lg font-semibold text-white">
														{theme.name}
													</h3>
													<div className="text-xs text-zinc-400">
														Created {theme.created}
													</div>
												</div>
											</div>
											<p className="text-sm text-zinc-300 group-hover:text-white transition-colors mb-3">
												{theme.description}
											</p>
											<div className="flex items-center gap-2 text-xs text-zinc-500">
												<span>👥 {theme.popularity} uses</span>
											</div>
										</motion.div>
									))}
								</div>
							)}
						</motion.div>
					)}

					{activeTab === "create" && (
						<motion.div
							key="create"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="max-w-2xl mx-auto space-y-6"
						>
							<div className="text-center mb-8">
								<div className="text-6xl mb-4">🎨</div>
								<h3 className="text-xl font-semibold text-white mb-2">
									Create Custom Theme
								</h3>
								<p className="text-zinc-400">
									Design a unique theme that will challenge your group
								</p>
							</div>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Theme Name *
									</label>
									<input
										type="text"
										value={newThemeName}
										onChange={(e) => setNewThemeName(e.target.value)}
										placeholder="e.g., 'College Regrets' or 'Travel Disasters'"
										className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500"
										maxLength={50}
									/>
									<div className="text-xs text-zinc-500 mt-1">
										{newThemeName.length}/50 characters
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Theme Description (Optional)
									</label>
									<textarea
										value={newThemeDescription}
										onChange={(e) => setNewThemeDescription(e.target.value)}
										placeholder="Describe what kind of secrets this theme should reveal..."
										className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500 h-24 resize-none"
										maxLength={200}
									/>
									<div className="text-xs text-zinc-500 mt-1">
										{newThemeDescription.length}/200 characters
									</div>
								</div>

								<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<div className="text-yellow-400 text-lg">💡</div>
										<div>
											<div className="font-medium text-yellow-200 mb-1">
												AI Enhancement
											</div>
											<div className="text-sm text-yellow-300">
												Kiro will enhance your theme with atmospheric details
												and generate more targeted prompts.
											</div>
										</div>
									</div>
								</div>

								<Button
									onClick={generateCustomTheme}
									disabled={!newThemeName.trim() || isGeneratingTheme}
									className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
								>
									{isGeneratingTheme ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
											Creating Theme...
										</>
									) : (
										<>✨ Create Theme</>
									)}
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	);
}
