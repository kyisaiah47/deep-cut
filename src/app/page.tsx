import { redirect } from "next/navigation";

export default function Home() {
	// Redirect to lobby page
	redirect("/lobby");
}
