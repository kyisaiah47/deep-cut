"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { GameError, handleGameError } from "@/lib/error-handling";
import { ErrorBoundaryState } from "@/types/game";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (error: GameError, retry: () => void) => ReactNode;
	onError?: (error: GameError, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryComponentState extends ErrorBoundaryState {
	error: GameError | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryComponentState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			errorType: "unknown",
			retryCount: 0,
			error: null,
		};
	}

	static getDerivedStateFromError(
		error: Error
	): Partial<ErrorBoundaryComponentState> {
		const gameError =
			error instanceof GameError ? error : new GameError(error.message);

		return {
			hasError: true,
			error: gameError,
			errorType: gameError.type as ErrorBoundaryComponentState["errorType"],
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const gameError =
			error instanceof GameError ? error : new GameError(error.message);

		// Log error for debugging
		console.error("ErrorBoundary caught an error:", error, errorInfo);

		// Call onError callback if provided
		this.props.onError?.(gameError, errorInfo);
	}

	retry = () => {
		this.setState((prevState) => ({
			hasError: false,
			error: null,
			retryCount: prevState.retryCount + 1,
		}));
	};

	render() {
		if (this.state.hasError && this.state.error) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.retry);
			}

			// Default error UI
			return (
				<DefaultErrorFallback
					error={this.state.error}
					retry={this.retry}
					retryCount={this.state.retryCount}
				/>
			);
		}

		return this.props.children;
	}
}

interface DefaultErrorFallbackProps {
	error: GameError;
	retry: () => void;
	retryCount: number;
}

function DefaultErrorFallback({
	error,
	retry,
	retryCount,
}: DefaultErrorFallbackProps) {
	const { message, retryable } = handleGameError(error);
	const maxRetries = 3;
	const canRetry = retryable && retryCount < maxRetries;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
				<div className="mb-4">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
				</div>

				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Something went wrong
				</h3>

				<p className="text-sm text-gray-500 mb-6">{message}</p>

				{retryCount > 0 && (
					<p className="text-xs text-gray-400 mb-4">
						Retry attempt: {retryCount}/{maxRetries}
					</p>
				)}

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					{canRetry && (
						<button
							onClick={retry}
							className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Try Again
						</button>
					)}

					<button
						onClick={() => window.location.reload()}
						className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Reload Page
					</button>
				</div>

				{error.type === "connection" && (
					<div className="mt-4 p-3 bg-yellow-50 rounded-md">
						<p className="text-xs text-yellow-800">
							Check your internet connection and try again.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

// Game-specific error boundary for game components
interface GameErrorBoundaryProps extends ErrorBoundaryProps {
	gameId?: string;
	playerId?: string;
}

export function GameErrorBoundary({
	children,
	gameId,
	playerId,
	...props
}: GameErrorBoundaryProps) {
	const handleError = (error: GameError, errorInfo: ErrorInfo) => {
		// Log game-specific context
		console.error("Game error occurred:", {
			gameId,
			playerId,
			error: error.message,
			type: error.type,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		});

		// Call original onError if provided
		props.onError?.(error, errorInfo);
	};

	const fallback = (error: GameError, retry: () => void) => {
		// Game-specific error fallback
		if (props.fallback) {
			return props.fallback(error, retry);
		}

		return (
			<GameErrorFallback
				error={error}
				retry={retry}
				gameId={gameId}
				playerId={playerId}
			/>
		);
	};

	return (
		<ErrorBoundary
			{...props}
			onError={handleError}
			fallback={fallback}
		>
			{children}
		</ErrorBoundary>
	);
}

interface GameErrorFallbackProps {
	error: GameError;
	retry: () => void;
	gameId?: string;
	playerId?: string;
}

function GameErrorFallback({ error, retry, gameId }: GameErrorFallbackProps) {
	const { message, retryable } = handleGameError(error);

	const handleReturnToLobby = () => {
		// Navigate back to lobby/home page
		window.location.href = "/";
	};

	const handleRejoinGame = () => {
		if (gameId) {
			// Try to rejoin the same game
			window.location.href = `/game/${gameId}`;
		} else {
			handleReturnToLobby();
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 text-center">
				<div className="mb-4">
					<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
						<svg
							className="h-8 w-8 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>

				<h3 className="text-xl font-bold text-gray-900 mb-2">Game Error</h3>

				<p className="text-sm text-gray-600 mb-6">{message}</p>

				<div className="space-y-3">
					{retryable && (
						<button
							onClick={retry}
							className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Try Again
						</button>
					)}

					{gameId && (
						<button
							onClick={handleRejoinGame}
							className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Rejoin Game
						</button>
					)}

					<button
						onClick={handleReturnToLobby}
						className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Return to Lobby
					</button>
				</div>

				{error.type === "connection" && (
					<div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<div className="flex items-center">
							<svg
								className="h-4 w-4 text-yellow-600 mr-2"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<p className="text-xs text-yellow-800">
								Connection lost. Check your internet and try again.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
