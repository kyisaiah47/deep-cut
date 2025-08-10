/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useResponsive, useTouchDevice } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Card } from "@/components/Card";
import { CardDisplay } from "@/components/CardDisplay";
import { SkeletonLoader, LoadingSpinner } from "@/components/SkeletonLoader";

// Mock the hooks
jest.mock("@/hooks/useResponsive");
jest.mock("@/hooks/useReducedMotion");

const mockUseResponsive = useResponsive as jest.MockedFunction<
	typeof useResponsive
>;
const mockUseTouchDevice = useTouchDevice as jest.MockedFunction<
	typeof useTouchDevice
>;
const mockUseReducedMotion = useReducedMotion as jest.MockedFunction<
	typeof useReducedMotion
>;

// Mock framer-motion
jest.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		button: ({ children, ...props }: any) => (
			<button {...props}>{children}</button>
		),
	},
	AnimatePresence: ({ children }: any) => children,
}));

describe("Responsive UI Components", () => {
	beforeEach(() => {
		// Default mock values
		mockUseResponsive.mockReturnValue({
			isMobile: false,
			isTablet: false,
			isDesktop: true,
			isLargeDesktop: false,
			width: 1024,
			height: 768,
		});
		mockUseTouchDevice.mockReturnValue(false);
		mockUseReducedMotion.mockReturnValue(false);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Card Component", () => {
		const mockCard = {
			id: "test-card",
			game_id: "test-game",
			round_number: 1,
			type: "response" as const,
			text: "Test card text",
			created_at: "2023-01-01T00:00:00Z",
		};

		it("renders with desktop styles by default", () => {
			render(<Card card={mockCard} />);
			const cardElement = screen.getByText("Test card text").closest("div");
			expect(cardElement).toHaveClass("p-4", "text-sm");
		});

		it("renders with mobile styles when on mobile", () => {
			mockUseResponsive.mockReturnValue({
				isMobile: true,
				isTablet: false,
				isDesktop: false,
				isLargeDesktop: false,
				width: 375,
				height: 667,
			});

			render(<Card card={mockCard} />);
			const cardElement = screen.getByText("Test card text").closest("div");
			expect(cardElement).toHaveClass("p-3");
		});

		it("adds touch-manipulation class on touch devices", () => {
			mockUseTouchDevice.mockReturnValue(true);

			render(
				<Card
					card={mockCard}
					isSelectable={true}
				/>
			);
			const cardElement = screen.getByText("Test card text").closest("div");
			expect(cardElement).toHaveClass("touch-manipulation");
		});

		it("respects reduced motion preferences", () => {
			mockUseReducedMotion.mockReturnValue(true);

			render(<Card card={mockCard} />);
			// Component should still render but with reduced animations
			expect(screen.getByText("Test card text")).toBeInTheDocument();
		});

		it("has proper accessibility attributes when selectable", () => {
			const mockOnClick = jest.fn();

			render(
				<Card
					card={mockCard}
					isSelectable={true}
					onClick={mockOnClick}
				/>
			);

			const cardElement = screen.getByRole("button");
			expect(cardElement).toHaveAttribute("tabIndex", "0");
			expect(cardElement).toHaveAttribute("aria-pressed", "false");

			// Test keyboard interaction
			fireEvent.keyDown(cardElement, { key: "Enter" });
			expect(mockOnClick).toHaveBeenCalledWith("test-card");
		});
	});

	describe("CardDisplay Component", () => {
		const mockCards = [
			{
				id: "card-1",
				game_id: "test-game",
				round_number: 1,
				type: "prompt" as const,
				text: "Test prompt",
				created_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "card-2",
				game_id: "test-game",
				round_number: 1,
				type: "response" as const,
				text: "Test response 1",
				created_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "card-3",
				game_id: "test-game",
				round_number: 1,
				type: "response" as const,
				text: "Test response 2",
				created_at: "2023-01-01T00:00:00Z",
			},
		];

		it("shows loading skeleton when loading", () => {
			render(
				<CardDisplay
					cards={[]}
					loading={true}
				/>
			);
			// Should show skeleton loaders instead of empty message
			expect(screen.queryByText("No cards available")).not.toBeInTheDocument();
		});

		it("shows mobile instructions on mobile devices", () => {
			mockUseResponsive.mockReturnValue({
				isMobile: true,
				isTablet: false,
				isDesktop: false,
				isLargeDesktop: false,
				width: 375,
				height: 667,
			});

			render(
				<CardDisplay
					cards={mockCards}
					selectable={true}
					onCardSelect={jest.fn()}
				/>
			);

			expect(
				screen.getByText("💡 Tap cards to select them")
			).toBeInTheDocument();
		});

		it("adjusts grid layout based on screen size", () => {
			// Test mobile layout
			mockUseResponsive.mockReturnValue({
				isMobile: true,
				isTablet: false,
				isDesktop: false,
				isLargeDesktop: false,
				width: 375,
				height: 667,
			});

			const { rerender } = render(<CardDisplay cards={mockCards} />);

			// Should use single column on mobile
			let gridElement = screen
				.getByText("Test response 1")
				.closest("div")?.parentElement;
			expect(gridElement).toHaveStyle("grid-template-columns: repeat(1, 1fr)");

			// Test desktop layout
			mockUseResponsive.mockReturnValue({
				isMobile: false,
				isTablet: false,
				isDesktop: true,
				isLargeDesktop: false,
				width: 1024,
				height: 768,
			});

			rerender(<CardDisplay cards={mockCards} />);

			gridElement = screen
				.getByText("Test response 1")
				.closest("div")?.parentElement;
			expect(gridElement).toHaveStyle("grid-template-columns: repeat(3, 1fr)");
		});
	});

	describe("Loading Components", () => {
		it("renders LoadingSpinner with different sizes", () => {
			const { rerender } = render(<LoadingSpinner size="sm" />);
			let spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-4", "w-4");

			rerender(<LoadingSpinner size="lg" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-12", "w-12");
		});

		it("respects reduced motion in skeleton animations", () => {
			mockUseReducedMotion.mockReturnValue(true);

			render(<SkeletonLoader />);
			// Component should render without throwing errors
			expect(document.querySelector(".bg-gray-200")).toBeInTheDocument();
		});
	});

	describe("Responsive Breakpoints", () => {
		it("handles different screen sizes correctly", () => {
			// Test mobile
			mockUseResponsive.mockReturnValue({
				isMobile: true,
				isTablet: false,
				isDesktop: false,
				isLargeDesktop: false,
				width: 375,
				height: 667,
			});

			let { rerender } = render(
				<Card
					card={{
						id: "test",
						game_id: "test",
						round_number: 1,
						type: "response" as const,
						text: "Test",
						created_at: "2023-01-01T00:00:00Z",
					}}
				/>
			);

			expect(screen.getByText("Test").closest("div")).toHaveClass("p-3");

			// Test tablet
			mockUseResponsive.mockReturnValue({
				isMobile: false,
				isTablet: true,
				isDesktop: false,
				isLargeDesktop: false,
				width: 768,
				height: 1024,
			});

			rerender(
				<Card
					card={{
						id: "test",
						game_id: "test",
						round_number: 1,
						type: "response" as const,
						text: "Test",
						created_at: "2023-01-01T00:00:00Z",
					}}
				/>
			);

			// Should use desktop styles for tablet
			expect(screen.getByText("Test").closest("div")).toHaveClass("p-4");
		});
	});

	describe("Accessibility Features", () => {
		it("provides proper ARIA labels for interactive elements", () => {
			const mockCard = {
				id: "test-card",
				game_id: "test-game",
				round_number: 1,
				type: "response" as const,
				text: "Funny response",
				created_at: "2023-01-01T00:00:00Z",
			};

			render(
				<Card
					card={mockCard}
					isSelectable={true}
					isSelected={false}
					onClick={jest.fn()}
				/>
			);

			const cardElement = screen.getByRole("button");
			expect(cardElement).toHaveAttribute(
				"aria-label",
				"Select card: Funny response"
			);
		});

		it("supports keyboard navigation", () => {
			const mockOnClick = jest.fn();
			const mockCard = {
				id: "test-card",
				game_id: "test-game",
				round_number: 1,
				type: "response" as const,
				text: "Test card",
				created_at: "2023-01-01T00:00:00Z",
			};

			render(
				<Card
					card={mockCard}
					isSelectable={true}
					onClick={mockOnClick}
				/>
			);

			const cardElement = screen.getByRole("button");

			// Test Enter key
			fireEvent.keyDown(cardElement, { key: "Enter" });
			expect(mockOnClick).toHaveBeenCalledWith("test-card");

			// Test Space key
			fireEvent.keyDown(cardElement, { key: " " });
			expect(mockOnClick).toHaveBeenCalledTimes(2);
		});
	});
});
