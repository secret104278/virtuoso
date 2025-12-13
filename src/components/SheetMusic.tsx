import abcjs from "abcjs";
import { useEffect, useRef, useState } from "react";

interface SheetMusicProps {
	abc: string;
}

export const SheetMusic = ({ abc }: SheetMusicProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const fullscreenContainerRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		if (containerRef.current) {
			abcjs.renderAbc(containerRef.current, abc, {
				add_classes: true,
				responsive: "resize",
				scale: 1.3,
				staffwidth: 800,
			});
		}
	}, [abc]);

	useEffect(() => {
		if (isFullscreen && fullscreenContainerRef.current) {
			const effectiveWidth = Math.max(window.innerHeight, window.innerWidth);
			abcjs.renderAbc(fullscreenContainerRef.current, abc, {
				add_classes: true,
				responsive: "resize",
				scale: 2,
				staffwidth: effectiveWidth - 64,
			});
		}
	}, [isFullscreen, abc]);

	useEffect(() => {
		if (isFullscreen) {
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isFullscreen]);

	return (
		<>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard control not needed */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: abcjs needs a div container */}
			<div
				ref={containerRef}
				onClick={() => setIsFullscreen(true)}
				className="w-full flex items-center justify-center overflow-x-auto cursor-pointer hover:opacity-80 transition-opacity"
			/>

			{isFullscreen && (
				<>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard control not needed */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: fullscreen overlay */}
					<div
						className="fixed z-50 bg-white flex items-center justify-center cursor-pointer
							inset-0
							portrait:rotate-90 portrait:origin-center
							portrait:w-dvh portrait:h-dvw
							portrait:inset-auto portrait:left-1/2 portrait:top-1/2
							portrait:-translate-x-1/2 portrait:-translate-y-1/2"
						onClick={() => setIsFullscreen(false)}
					>
						<div
							ref={fullscreenContainerRef}
							className="flex items-center justify-center p-4"
						/>
					</div>
				</>
			)}
		</>
	);
};
