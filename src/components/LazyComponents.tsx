"use client";

import { lazy, Suspense } from "react";
import { SkeletonLoader } from "./SkeletonLoader";

// Lazy load heavy game components
export const LazyGameLobby = lazy(() =>
	import("./GameLobby").then((module) => ({ default: module.GameLobby }))
);

export const LazySubmissionInterface = lazy(() =>
	import("./SubmissionInterface").then((module) => ({
		default: module.SubmissionInterface,
	}))
);

export const LazyVotingInterface = lazy(() =>
	import("./VotingInterface").then((module) => ({
		default: module.VotingInterface,
	}))
);

export const LazyScoreManager = lazy(() =>
	import("./ScoreManager").then((module) => ({ default: module.ScoreManager }))
);

export const LazyGameResults = lazy(() =>
	import("./GameResults").then((module) => ({ default: module.GameResults }))
);

export const LazyHostControlPanel = lazy(() =>
	import("./HostControlPanel").then((module) => ({
		default: module.HostControlPanel,
	}))
);

export const LazyGameSettingsPanel = lazy(() =>
	import("./GameSettingsPanel").then((module) => ({
		default: module.GameSettingsPanel,
	}))
);

// Wrapper components with suspense
export function SuspenseGameLobby(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="game-lobby" />}>
			<LazyGameLobby {...props} />
		</Suspense>
	);
}

export function SuspenseSubmissionInterface(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="submission" />}>
			<LazySubmissionInterface {...props} />
		</Suspense>
	);
}

export function SuspenseVotingInterface(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="voting" />}>
			<LazyVotingInterface {...props} />
		</Suspense>
	);
}

export function SuspenseScoreManager(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="score" />}>
			<LazyScoreManager {...props} />
		</Suspense>
	);
}

export function SuspenseGameResults(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="results" />}>
			<LazyGameResults {...props} />
		</Suspense>
	);
}

export function SuspenseHostControlPanel(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="host-controls" />}>
			<LazyHostControlPanel {...props} />
		</Suspense>
	);
}

export function SuspenseGameSettingsPanel(props: any) {
	return (
		<Suspense fallback={<SkeletonLoader variant="settings" />}>
			<LazyGameSettingsPanel {...props} />
		</Suspense>
	);
}
