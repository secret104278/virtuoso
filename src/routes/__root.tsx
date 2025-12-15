import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<NuqsAdapter>
			<Outlet />
		</NuqsAdapter>
	);
}
