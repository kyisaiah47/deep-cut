import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			refresh: jest.fn(),
		};
	},
	useSearchParams() {
		return new URLSearchParams();
	},
	usePathname() {
		return "/";
	},
}));

// Supabase will be mocked in individual test files as needed

// Mock framer-motion
jest.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }) => <div {...props}>{children}</div>,
		button: ({ children, ...props }) => <button {...props}>{children}</button>,
		span: ({ children, ...props }) => <span {...props}>{children}</span>,
		p: ({ children, ...props }) => <p {...props}>{children}</p>,
		h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
		h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
		h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
	},
	AnimatePresence: ({ children }) => children,
	useAnimation: () => ({
		start: jest.fn(),
		stop: jest.fn(),
		set: jest.fn(),
	}),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
	console.error = (...args) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render is no longer supported")
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});
