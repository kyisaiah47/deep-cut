import "@testing-library/jest-dom";

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.OPENAI_API_KEY = "test-openai-key";

// Mock crypto.randomUUID for Node.js environments that don't have it
if (!global.crypto) {
	global.crypto = {
		randomUUID: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
	};
}

// Mock performance.now for timing tests
if (!global.performance) {
	global.performance = {
		now: () => Date.now(),
	};
}

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock WebSocket for real-time tests
global.WebSocket = jest.fn().mockImplementation(() => ({
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
	send: jest.fn(),
	close: jest.fn(),
	readyState: 1,
}));

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

// Mock matchMedia
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
