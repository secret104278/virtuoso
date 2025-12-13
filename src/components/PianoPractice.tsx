import { ArrowLeft, ArrowRight, Music, RotateCcw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	generateGrandStaffABC as generateABC,
	getNextFifth,
	getPrevFifth,
	getRelativeNote,
	type Note,
	CIRCLE_OF_FIFTHS as ROOTS, // Use the user-preferred cycle
	type ScaleType,
} from "@/lib/music-theory";
import { SheetMusic } from "./SheetMusic";

const SCALE_TYPES: ScaleType[] = [
	"Major",
	"Minor (Harmonic)",
	"Minor (Melodic)",
];

const INITIAL_NOTE: Note = { name: "C", accidental: "", octave: 4 };

export function PianoPractice() {
	const [root, setRoot] = useState<Note>(INITIAL_NOTE);
	const [scaleType, setScaleType] = useState<ScaleType>("Major");

	const abc = useMemo(() => generateABC(root, scaleType), [root, scaleType]);

	const handleRandom = () => {
		const type = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)];
		// Randomize based on circle of fifths to ensure nice keys
		let r = INITIAL_NOTE;
		const steps = Math.floor(Math.random() * 12) - 6;
		for (let i = 0; i < Math.abs(steps); i++) {
			r = steps > 0 ? getNextFifth(r) : getPrevFifth(r);
		}
		setRoot(r);
		setScaleType(type);
	};

	const handleCircleNext = () => setRoot(getNextFifth(root));
	const handleCirclePrev = () => setRoot(getPrevFifth(root));

	const handleRelative = () => {
		const newRoot = getRelativeNote(root, scaleType);
		const newType = scaleType === "Major" ? "Minor (Harmonic)" : "Major";
		setRoot(newRoot);
		setScaleType(newType);
	};

	// Toggle Parallel Major/Minor
	const handleParallel = () => {
		if (scaleType === "Major") setScaleType("Minor (Harmonic)");
		else setScaleType("Major");
	};

	return (
		<div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full min-h-dvh justify-center py-8">
			<div className="text-center space-y-1 mb-2">
				<h1 className="text-3xl font-serif font-medium tracking-tight text-slate-900">
					Virtuoso
				</h1>
				<p className="text-slate-500 text-sm uppercase tracking-widest font-medium">
					Scales & Cadences
				</p>
			</div>

			<Card className="w-full border-0 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100">
				<CardHeader className="flex flex-col gap-4 bg-slate-50/50 border-b [.border-b]:pb-2 border-slate-100">
					{/* Row 1: Selectors */}
					<div className="flex flex-row items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<Select
								value={`${root.name}${root.accidental}`}
								onValueChange={(val) => {
									const selected = ROOTS.find(
										(r) => `${r.name}${r.accidental}` === val,
									);
									if (selected) setRoot(selected);
								}}
							>
								<SelectTrigger className="w-10 h-10 rounded-full bg-slate-900 text-white border-0 p-0 flex items-center justify-center font-bold shadow-md hover:bg-slate-800 transition-colors focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
									<SelectValue />
								</SelectTrigger>
								<SelectContent align="start">
									{ROOTS.map((r) => (
										<SelectItem
											key={`${r.name}${r.accidental}`}
											value={`${r.name}${r.accidental}`}
										>
											{r.name}
											{r.accidental}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={scaleType}
								onValueChange={(v) => setScaleType(v as ScaleType)}
							>
								<SelectTrigger className="h-auto border-0 shadow-none bg-transparent p-0 text-lg font-serif font-medium text-slate-800 opacity-80 hover:opacity-100 focus:ring-0 focus:ring-offset-0 w-auto [&>svg]:hidden text-left">
									<SelectValue />
								</SelectTrigger>
								<SelectContent align="start">
									{SCALE_TYPES.map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Row 2: Navigation */}
					<div className="flex items-center justify-between pt-2 border-t border-slate-200/50 w-full">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCirclePrev}
							className="hover:bg-slate-200/50"
						>
							<ArrowLeft className="h-5 w-5 text-slate-600" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleRandom}
							className="rounded-full px-4 border-slate-200 hover:bg-white hover:text-slate-900 shadow-sm text-xs font-medium uppercase tracking-wide"
						>
							<Shuffle className="mr-2 h-3 w-3" /> Randomize
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCircleNext}
							className="hover:bg-slate-200/50"
						>
							<ArrowRight className="h-5 w-5 text-slate-600" />
						</Button>
					</div>
				</CardHeader>
				<div className="bg-white p-4 min-h-[220px] flex items-center justify-center">
					<SheetMusic abc={abc} />
				</div>
			</Card>

			<div className="space-y-4 w-full">
				{/* Removed Scale Type Select from here as requested */}

				<div className="grid grid-cols-2 gap-3 pt-2">
					<Button
						variant="outline"
						onClick={handleRelative}
						className="h-10 text-xs border-slate-200 hover:bg-slate-50 hover:text-slate-900"
					>
						<Music className="mr-2 h-3 w-3" />
						Relative {scaleType === "Major" ? "Minor" : "Major"}
					</Button>
					<Button
						variant="outline"
						onClick={handleParallel}
						className="h-10 text-xs border-slate-200 hover:bg-slate-50 hover:text-slate-900"
					>
						<RotateCcw className="mr-2 h-3 w-3" />
						Parallel {scaleType === "Major" ? "Minor" : "Major"}
					</Button>
				</div>
			</div>
		</div>
	);
}
