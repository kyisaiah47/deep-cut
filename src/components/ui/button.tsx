import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "outline" | "ghost";
	size?: "sm" | "md" | "lg";
}

export function Button({
	className,
	variant = "default",
	size = "md",
	...props
}: ButtonProps) {
	const baseClasses =
		"inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

	const variants = {
		default: "bg-primary text-primary-foreground hover:bg-primary/90",
		outline: "border border-input hover:bg-accent hover:text-accent-foreground",
		ghost: "hover:bg-accent hover:text-accent-foreground",
	};

	const sizes = {
		sm: "h-9 px-3 text-sm",
		md: "h-10 px-4 py-2",
		lg: "h-11 px-8",
	};

	return (
		<button
			className={cn(baseClasses, variants[variant], sizes[size], className)}
			{...props}
		/>
	);
}
