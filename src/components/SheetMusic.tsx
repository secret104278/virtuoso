import abcjs from "abcjs";
import { useEffect, useRef } from "react";

interface SheetMusicProps {
	abc: string;
}

export const SheetMusic = ({ abc }: SheetMusicProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			abcjs.renderAbc(containerRef.current, abc, {
				add_classes: true,
				responsive: "resize",
				scale: 1.3,
				staffwidth: 800, // Hint for better desktop fill, will shrink on mobile
			});
		}
	}, [abc]);

	return (
		<div
			ref={containerRef}
			className="w-full min-h-[150px] flex items-center justify-center overflow-x-auto"
		/>
	);
};
