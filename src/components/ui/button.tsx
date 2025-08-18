import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
	variant?: "default" | "outline" | "ghost" | "neon" | "arcade";
	size?: "sm" | "md" | "lg";
	neonColor?: "cyan" | "magenta" | "blue" | "lime" | "yellow";
	children?: React.ReactNode;
}

export function Button({
	className,
	variant = "default",
	size = "md",
	neonColor = "cyan",
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
	};

	const sizes = {
		sm: "h-10 px-4 text-xs rounded-pill",
		md: "h-12 px-6 text-sm rounded-pill",
		lg: "h-14 px-8 text-base rounded-pill",
	};

	return (
		<motion.button
			className={cn(baseClasses, variants[variant], sizes[size], className)}
			whileHover={{ scale: 1.05, y: -2 }}
			whileTap={{ scale: 0.95, y: 0 }}
			transition={{ duration: 0.15 }}
			{...props}
		>
			{/* Animated background sweep */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
				initial={{ x: "-100%" }}
				whileHover={{ x: "100%" }}
				transition={{ duration: 0.5 }}
			/>

			{/* Button content */}
			<span className="relative z-10 flex items-center gap-2">{children}</span>
		</motion.button>
	);
}
