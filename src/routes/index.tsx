import { createFileRoute } from "@tanstack/react-router";
import { PianoPractice } from "@/components/PianoPractice";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return <PianoPractice />;
}
