import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
	variant?:
		| "default"
		| "outline"
		| "ghost"
		| "neon"
		| "arcade"
		| "joystick"
		| "meme";
	size?: "sm" | "md" | "lg" | "xl";
	neonColor?: "cyan" | "magenta" | "blue" | "lime" | "yellow";
	chaos?: boolean;
	children?: React.ReactNode;
}

export function Button({
	className,
	variant = "default",
	size = "md",
	neonColor = "cyan",
	chaos = false,
	children,
	...props
}: ButtonProps) {
	const baseClasses =
		"neon-button relative inline-flex items-center justify-center font-display font-bold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none overflow-hidden";

	const variants = {
		default: "neon-button",
		outline: `
			bg-transparent border-2 font-display font-bold uppercase tracking-wide
			${
				neonColor === "cyan"
					? "border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-stage shadow-neon-cyan"
					: ""
			}
			${
				neonColor === "magenta"
					? "border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-stage shadow-neon-magenta"
					: ""
			}
			${
				neonColor === "blue"
					? "border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-stage shadow-neon-blue"
					: ""
			}
			${
				neonColor === "lime"
					? "border-acid-lime text-acid-lime hover:bg-acid-lime hover:text-stage shadow-neon-lime"
					: ""
			}
			${
				neonColor === "yellow"
					? "border-sun-yellow text-sun-yellow hover:bg-sun-yellow hover:text-stage"
					: ""
			}
		`,
		ghost: "bg-transparent text-white hover:bg-white/10 font-body",
		neon: `
			bg-gradient-to-r from-surface-dark to-surface-darker border-2 font-display font-bold uppercase tracking-wide
			${
				neonColor === "cyan"
					? "border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-stage shadow-neon-cyan"
					: ""
			}
			${
				neonColor === "magenta"
					? "border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-stage shadow-neon-magenta"
					: ""
			}
			${
				neonColor === "blue"
					? "border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-stage shadow-neon-blue"
					: ""
			}
			${
				neonColor === "lime"
					? "border-acid-lime text-acid-lime hover:bg-acid-lime hover:text-stage shadow-neon-lime"
					: ""
			}
			${
				neonColor === "yellow"
					? "border-sun-yellow text-sun-yellow hover:bg-sun-yellow hover:text-stage"
					: ""
			}
		`,
		arcade: `
			bg-gradient-to-br from-neon-cyan via-electric-blue to-neon-magenta
			text-stage font-display font-black uppercase tracking-wider
			shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:shadow-[0_0_50px_rgba(0,229,255,0.8)]
			border-2 border-white/20
		`,
		joystick: `
			bg-gradient-to-b from-surface-dark to-surface-darker
			border-4 border-neon-cyan text-neon-cyan
			shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_0_30px_rgba(0,229,255,0.6)]
			hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_0_50px_rgba(0,229,255,0.8)]
			font-display font-black uppercase tracking-wider
		`,
		meme: `
			bg-gradient-to-br from-neon-magenta via-acid-lime to-sun-yellow
			text-stage font-display font-black uppercase tracking-wider
			shadow-[0_0_30px_rgba(255,58,242,0.5)] hover:shadow-[0_0_50px_rgba(255,58,242,0.8)]
			border-2 border-white/30 animate-arcade-flicker
		`,
	};

	const sizes = {
		sm: "h-10 px-4 text-xs rounded-pill",
		md: "h-12 px-6 text-sm rounded-pill",
		lg: "h-14 px-8 text-base rounded-pill",
		xl: "h-16 px-10 text-lg rounded-pill",
	};

	// Joystick press animation
	const getAnimations = () => {
		if (variant === "joystick") {
			return {
				whileHover: { scale: 1.02, y: -1 },
				whileTap: {
					scale: 0.98,
					y: 2,
					boxShadow:
						"inset 0 4px 12px rgba(0,0,0,0.5), 0 0 20px rgba(0,229,255,0.4)",
				},
			};
		}
		return {
			whileHover: { scale: 1.05, y: -2 },
			whileTap: { scale: 0.95, y: 0 },
		};
	};

	const animations = getAnimations();

	return (
		<motion.button
			className={cn(baseClasses, variants[variant], sizes[size], className)}
			{...animations}
			transition={{ duration: 0.15 }}
			{...props}
		>
			{/* Joystick button highlight */}
			{variant === "joystick" && (
				<div className="absolute top-1 left-2 right-2 h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-pill" />
			)}

			{/* Animated background sweep */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
				initial={{ x: "-100%" }}
				whileHover={{ x: "100%" }}
				transition={{ duration: 0.5 }}
			/>

			{/* Chaos particles for meme variant */}
			{(variant === "meme" || chaos) && (
				<div className="absolute inset-0 pointer-events-none">
					{Array.from({ length: 5 }).map((_, i) => (
						<motion.div
							key={i}
							className="absolute w-1 h-1 bg-white rounded-full"
							style={{
								left: `${20 + i * 15}%`,
								top: `${30 + i * 10}%`,
							}}
							animate={{
								scale: [0, 1, 0],
								opacity: [0, 1, 0],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								delay: i * 0.2,
							}}
						/>
					))}
				</div>
			)}

			{/* Button content */}
			<span className="relative z-10 flex items-center gap-2">{children}</span>
		</motion.button>
	);
}
