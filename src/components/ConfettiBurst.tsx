import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiParticle {
	id: string;
	x: number;
	y: number;
	color: string;
	size: number;
	rotation: number;
	velocity: { x: number; y: number };
}

interface ConfettiBurstProps {
	isActive: boolean;
	duration?: number;
	particleCount?: number;
	colors?: string[];
}

export function ConfettiBurst({
	isActive,
	duration = 3000,
	particleCount = 50,
	colors = ["#00E5FF", "#FF3AF2", "#4D7CFF", "#B6FF3A", "#FFD23A", "#C7AFFF"],
}: ConfettiBurstProps) {
	const [particles, setParticles] = useState<ConfettiParticle[]>([]);

	useEffect(() => {
		if (!isActive) {
			setParticles([]);
			return;
		}

		// Generate confetti particles
		const newParticles: ConfettiParticle[] = [];
		for (let i = 0; i < particleCount; i++) {
			newParticles.push({
				id: `particle-${i}`,
				x: Math.random() * window.innerWidth,
				y: -20,
				color: colors[Math.floor(Math.random() * colors.length)],
				size: Math.random() * 8 + 4,
				rotation: Math.random() * 360,
				velocity: {
					x: (Math.random() - 0.5) * 10,
					y: Math.random() * 3 + 2,
				},
			});
		}
		setParticles(newParticles);

		// Clear particles after duration
		const timeout = setTimeout(() => {
			setParticles([]);
		}, duration);

		return () => clearTimeout(timeout);
	}, [isActive, duration, particleCount, colors]);

	return (
		<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
			<AnimatePresence>
				{particles.map((particle) => (
					<motion.div
						key={particle.id}
						initial={{
							x: particle.x,
							y: particle.y,
							rotate: particle.rotation,
							scale: 0,
						}}
						animate={{
							x: particle.x + particle.velocity.x * 100,
							y: window.innerHeight + 100,
							rotate: particle.rotation + 720,
							scale: [0, 1, 1, 0],
						}}
						exit={{
							opacity: 0,
							scale: 0,
						}}
						transition={{
							duration: duration / 1000,
							ease: "easeOut",
							times: [0, 0.1, 0.9, 1],
						}}
						className="absolute"
						style={{
							width: particle.size,
							height: particle.size,
							backgroundColor: particle.color,
							boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
						}}
					/>
				))}
			</AnimatePresence>
		</div>
	);
}

// Preset confetti bursts for different game events
export function WinConfetti({ isActive }: { isActive: boolean }) {
	return (
		<ConfettiBurst
			isActive={isActive}
			duration={4000}
			particleCount={80}
			colors={["#00E5FF", "#FF3AF2", "#FFD23A"]}
		/>
	);
}

export function RoundWinConfetti({ isActive }: { isActive: boolean }) {
	return (
		<ConfettiBurst
			isActive={isActive}
			duration={2500}
			particleCount={40}
			colors={["#4D7CFF", "#B6FF3A", "#C7AFFF"]}
		/>
	);
}
