// Application constants

export const GAME_PHASES = {
	LOBBY: "lobby",
	DISTRIBUTION: "distribution",
	SUBMISSION: "submission",
	VOTING: "voting",
	RESULTS: "results",
} as const;

export const CARD_TYPES = {
	PROMPT: "prompt",
	RESPONSE: "response",
} as const;

export const GAME_EVENTS = {
	PLAYER_JOINED: "player_joined",
	PLAYER_LEFT: "player_left",
	PHASE_CHANGE: "phase_change",
	CARDS_DISTRIBUTED: "cards_distributed",
	SUBMISSION_RECEIVED: "submission_received",
	VOTING_COMPLETE: "voting_complete",
} as const;

export const ERROR_TYPES = {
	CONNECTION: "connection",
	GAME_STATE: "game_state",
	AI_GENERATION: "ai_generation",
	UNKNOWN: "unknown",
} as const;

export const TIMER_DURATIONS = {
	DEFAULT_SUBMISSION: 60, // seconds
	DEFAULT_VOTING: 30, // seconds
} as const;

export const GAME_LIMITS = {
	MIN_PLAYERS: 3,
	MAX_PLAYERS: 8,
	MIN_TARGET_SCORE: 3,
	MAX_TARGET_SCORE: 15,
	ROOM_CODE_LENGTH: 6,
	MAX_PLAYER_NAME_LENGTH: 50,
} as const;

export const ANIMATION_DURATIONS = {
	CARD_HOVER: 0.2,
	CARD_SELECT: 0.3,
	PHASE_TRANSITION: 0.5,
	STAGGER_DELAY: 0.1,
	SKELETON_PULSE: 1.5,
	LOADING_BOUNCE: 0.6,
	TOAST_SLIDE: 0.3,
	MODAL_SCALE: 0.2,
} as const;

export const ANIMATION_VARIANTS = {
	// Page transitions
	pageEnter: {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
		transition: { duration: ANIMATION_DURATIONS.PHASE_TRANSITION },
	},

	// Mobile-specific page transitions
	mobilePageEnter: {
		initial: { opacity: 0, x: 20 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: -20 },
		transition: { duration: ANIMATION_DURATIONS.PHASE_TRANSITION },
	},

	// Card animations
	cardStagger: {
		initial: { opacity: 0, y: 20, scale: 0.9 },
		animate: { opacity: 1, y: 0, scale: 1 },
		exit: { opacity: 0, y: -20, scale: 0.9 },
	},

	// Enhanced card hover for desktop
	cardHover: {
		hover: {
			scale: 1.02,
			y: -2,
			boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
			transition: { duration: ANIMATION_DURATIONS.CARD_HOVER },
		},
	},

	// Touch feedback for mobile
	cardTap: {
		tap: {
			scale: 0.98,
			transition: { duration: 0.1 },
		},
	},

	// Loading states
	skeleton: {
		animate: {
			opacity: [0.5, 1, 0.5] as number[],
			transition: {
				duration: ANIMATION_DURATIONS.SKELETON_PULSE,
				repeat: Infinity,
				ease: "easeInOut" as const,
			},
		},
	},

	// Pulse animation for important elements
	pulse: {
		animate: {
			scale: [1, 1.05, 1],
			transition: {
				duration: 1,
				repeat: Infinity,
				ease: "easeInOut" as const,
			},
		},
	},

	// Bounce animation for notifications
	bounce: {
		animate: {
			y: [0, -10, 0],
			transition: {
				duration: 0.6,
				repeat: Infinity,
				ease: "easeInOut" as const,
			},
		},
	},

	// Modal/overlay animations
	overlay: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	},

	modal: {
		initial: { opacity: 0, scale: 0.9, y: 20 },
		animate: { opacity: 1, scale: 1, y: 0 },
		exit: { opacity: 0, scale: 0.9, y: 20 },
	},

	// Mobile drawer animation
	mobileDrawer: {
		initial: { opacity: 0, y: "100%" },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: "100%" },
	},

	// Slide animations for mobile navigation
	slideLeft: {
		initial: { x: "100%" },
		animate: { x: 0 },
		exit: { x: "100%" },
	},

	slideRight: {
		initial: { x: "-100%" },
		animate: { x: 0 },
		exit: { x: "-100%" },
	},

	// Stagger container for lists
	staggerContainer: {
		animate: {
			transition: {
				staggerChildren: ANIMATION_DURATIONS.STAGGER_DELAY,
			},
		},
	},

	// Stagger item
	staggerItem: {
		initial: { opacity: 0, y: 20 },
		animate: { opacity: 1, y: 0 },
	},
} as const;

export const RESPONSIVE_BREAKPOINTS = {
	SM: 640,
	MD: 768,
	LG: 1024,
	XL: 1280,
	XXL: 1536,
} as const;
