"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateGameForm } from "@/components/CreateGameForm";
import { JoinGameForm } from "@/components/JoinGameForm";

export default function LobbyPage() {
	const [activeTab, setActiveTab] = useState<"create" | "join">("create");
	const router = useRouter();

	const handleGameCreated = (roomCode: string, playerId: string) => {
		// Navigate to game room
		router.push(`/game/${roomCode}?playerId=${playerId}`);
	};

	const handleGameJoined = (roomCode: string, playerId: string) => {
		// Navigate to game room
		router.push(`/game/${roomCode}?playerId=${playerId}`);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
			<div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-white mb-2">AI Cards Game</h1>
					<p className="text-white/80">
						Create hilarious combinations with AI-generated cards
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="flex mb-6 bg-white/5 rounded-lg p-1">
					<button
						onClick={() => setActiveTab("create")}
						className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
							activeTab === "create"
								? "bg-white text-gray-900 shadow-sm"
								: "text-white/80 hover:text-white hover:bg-white/10"
						}`}
					>
						Create Game
					</button>
					<button
						onClick={() => setActiveTab("join")}
						className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
							activeTab === "join"
								? "bg-white text-gray-900 shadow-sm"
								: "text-white/80 hover:text-white hover:bg-white/10"
						}`}
					>
						Join Game
					</button>
				</div>

				{/* Form Content */}
				<div className="space-y-6">
					{activeTab === "create" ? (
						<CreateGameForm onGameCreated={handleGameCreated} />
					) : (
						<JoinGameForm onGameJoined={handleGameJoined} />
					)}
				</div>

				{/* Footer */}
				<div className="mt-8 text-center">
					<p className="text-white/60 text-sm">
						Gather your friends and get ready to laugh!
					</p>
				</div>
			</div>
		</div>
	);
}
