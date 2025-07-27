"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface SoundSystemProps {
	isGameActive: boolean;
	currentPhase: string;
	isWhispering: boolean;
	timerActive: boolean;
}

export default function SoundSystem({
	isGameActive,
	currentPhase,
	isWhispering,
	timerActive,
}: SoundSystemProps) {
	const [isEnabled, setIsEnabled] = useState(false);
	const [volume, setVolume] = useState(0.3);
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);

	const initializeAudio = useCallback(() => {
		if (typeof window !== "undefined" && !audioContextRef.current) {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			audioContextRef.current = new AudioContextClass();
			gainNodeRef.current = audioContextRef.current.createGain();
			gainNodeRef.current.connect(audioContextRef.current.destination);
			gainNodeRef.current.gain.value = volume;
		}
	}, [volume]);

	useEffect(() => {
		initializeAudio();

		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, [initializeAudio]);

	useEffect(() => {
		if (gainNodeRef.current) {
			gainNodeRef.current.gain.value = volume;
		}
	}, [volume]);

	const playTone = useCallback(
		(frequency: number, duration: number, type: OscillatorType = "sine") => {
			if (!isEnabled || !audioContextRef.current || !gainNodeRef.current)
				return;

			const oscillator = audioContextRef.current.createOscillator();
			const envelope = audioContextRef.current.createGain();

			oscillator.connect(envelope);
			envelope.connect(gainNodeRef.current);

			oscillator.frequency.value = frequency;
			oscillator.type = type;

			// Envelope for smooth attack/release
			envelope.gain.setValueAtTime(0, audioContextRef.current.currentTime);
			envelope.gain.linearRampToValueAtTime(
				0.1,
				audioContextRef.current.currentTime + 0.01
			);
			envelope.gain.linearRampToValueAtTime(
				0,
				audioContextRef.current.currentTime + duration
			);

			oscillator.start(audioContextRef.current.currentTime);
			oscillator.stop(audioContextRef.current.currentTime + duration);
		},
		[isEnabled]
	);

	const playWhisperAmbience = useCallback(() => {
		if (!isEnabled) return;
		// Low frequency rumble for whispers
		playTone(60, 0.5, "sawtooth");
		setTimeout(() => playTone(80, 0.3, "triangle"), 200);
	}, [isEnabled, playTone]);

	const playPhaseTransition = useCallback(() => {
		if (!isEnabled) return;
		// Ascending chord for phase changes
		playTone(220, 0.4);
		setTimeout(() => playTone(277, 0.4), 100);
		setTimeout(() => playTone(330, 0.4), 200);
	}, [isEnabled, playTone]);

	const playTimerTick = useCallback(() => {
		if (!isEnabled) return;
		// Quick tick sound
		playTone(800, 0.1, "square");
	}, [isEnabled, playTone]);

	const playGameStart = useCallback(() => {
		if (!isEnabled) return;
		// Dramatic game start sequence
		playTone(110, 0.6, "sawtooth");
		setTimeout(() => playTone(165, 0.6, "sawtooth"), 300);
		setTimeout(() => playTone(220, 0.8, "sawtooth"), 600);
	}, [isEnabled, playTone]);

	// Sound effect triggers based on props
	useEffect(() => {
		if (isGameActive) {
			playGameStart();
		}
	}, [isGameActive, playGameStart]);

	useEffect(() => {
		if (isWhispering) {
			playWhisperAmbience();
		}
	}, [isWhispering, playWhisperAmbience]);

	const phaseRef = useRef(currentPhase);
	useEffect(() => {
		if (phaseRef.current !== currentPhase && phaseRef.current !== "") {
			playPhaseTransition();
		}
		phaseRef.current = currentPhase;
	}, [currentPhase, playPhaseTransition]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (timerActive && isEnabled) {
			interval = setInterval(() => {
				playTimerTick();
			}, 10000); // Tick every 10 seconds during timer
		}
		return () => clearInterval(interval);
	}, [timerActive, isEnabled, playTimerTick]);

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			className="fixed top-4 right-4 z-50"
		>
			<div className="bg-black/80 backdrop-blur-sm border border-zinc-700 rounded-lg p-3 space-y-3">
				{/* Sound Toggle */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => setIsEnabled(!isEnabled)}
						className={`p-2 rounded transition-colors ${
							isEnabled ? "bg-pink-600 text-white" : "bg-zinc-700 text-zinc-400"
						}`}
					>
						{isEnabled ? "🔊" : "🔇"}
					</button>
					<span className="text-xs text-zinc-400">
						{isEnabled ? "Sound On" : "Sound Off"}
					</span>
				</div>

				{/* Volume Control */}
				{isEnabled && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						className="space-y-2"
					>
						<div className="text-xs text-zinc-400">Volume</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={volume}
							onChange={(e) => setVolume(parseFloat(e.target.value))}
							className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
						/>

						{/* Sound Test Buttons */}
						<div className="flex gap-1">
							<button
								onClick={playWhisperAmbience}
								className="px-2 py-1 text-xs bg-red-900/30 border border-red-500/30 rounded text-red-300 hover:bg-red-900/50 transition-colors"
								title="Test Whisper Sound"
							>
								👻
							</button>
							<button
								onClick={playPhaseTransition}
								className="px-2 py-1 text-xs bg-blue-900/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-900/50 transition-colors"
								title="Test Phase Sound"
							>
								🔄
							</button>
							<button
								onClick={playTimerTick}
								className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-300 hover:bg-yellow-900/50 transition-colors"
								title="Test Timer Sound"
							>
								⏰
							</button>
						</div>
					</motion.div>
				)}
			</div>

			<style jsx>{`
				.slider::-webkit-slider-thumb {
					appearance: none;
					height: 12px;
					width: 12px;
					border-radius: 50%;
					background: #ec4899;
					cursor: pointer;
				}

				.slider::-moz-range-thumb {
					height: 12px;
					width: 12px;
					border-radius: 50%;
					background: #ec4899;
					cursor: pointer;
					border: none;
				}
			`}</style>
		</motion.div>
	);
}
