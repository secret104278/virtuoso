import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "theme-color",
				content: "#000000",
			},
			{
				title: "Virtuoso - Piano Practice",
			},
			{
				name: "description",
				content:
					"Master your scales and cadences with Virtuoso. A modern, interactive piano practice companion for musicians of all levels.",
			},
			// Open Graph
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:title",
				content: "Virtuoso - Piano Practice",
			},
			{
				property: "og:description",
				content:
					"Master your scales and cadences with Virtuoso. A modern, interactive piano practice companion.",
			},
			{
				property: "og:image",
				content: "/screenshot.png",
			},
			{
				property: "og:url",
				content: "https://virtuoso.secret104278.workers.dev",
			},
			// Twitter
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "Virtuoso - Piano Practice",
			},
			{
				name: "twitter:description",
				content:
					"Master your scales and cadences with Virtuoso. A modern, interactive piano practice companion.",
			},
			{
				name: "twitter:image",
				content: "/screenshot.png",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				href: "/logo192.png",
			},
		],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
