import { Button } from "../ui/button";

export default function GameOverPhase({
	onReturnHome,
}: {
	onReturnHome: () => void;
}) {
	return (
		<div className="text-center py-10">
			<h2 className="text-3xl font-bold">🎉 Game Over!</h2>
			<p className="mt-2 text-zinc-400">Thanks for playing!</p>
			<Button
				onClick={onReturnHome}
				className="mt-6 hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
				size="lg"
			>
				Return to Home
			</Button>
		</div>
	);
}
