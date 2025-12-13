import { ArrowLeft, ArrowRight, Music, RotateCcw, Shuffle } from "lucide-react";
import { createParser, parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	generateGrandStaffABC as generateABC,
	getNextFifth,
	getPrevFifth,
	getRelativeNote,
	getStandardKey,
	isStandardKey,
	type Note,
	SELECTABLE_ROOTS as ROOTS,
	type ScaleType,
	SELECTABLE_ROOTS,
} from "@/lib/music-theory";
import { Metronome } from "./Metronome";
import { SheetMusic } from "./SheetMusic";

const SCALE_TYPES: ScaleType[] = [
	"Major",
	"Minor (Harmonic)",
	"Minor (Melodic)",
];

const INITIAL_NOTE: Note = { name: "C", accidental: "", octave: 4 };

// Custom parser for Note object <-> URL string (e.g. "C#")
const rootNoteParser = createParser({
	parse: (query) => {
		return (
			SELECTABLE_ROOTS.find((r) => `${r.name}${r.accidental}` === query) ??
			INITIAL_NOTE
		);
	},
	serialize: (value) => `${value.name}${value.accidental}`,
})
	.withDefault(INITIAL_NOTE)
	.withOptions({ history: "push" });

const scaleTypeParser = parseAsStringEnum<ScaleType>(SCALE_TYPES)
	.withDefault("Major")
	.withOptions({
		history: "push",
	});

export function PianoPractice() {
	const [root, setRoot] = useQueryState("root", rootNoteParser);
	const [scaleType, setScaleType] = useQueryState("scale", scaleTypeParser);

	const abc = useMemo(() => generateABC(root, scaleType), [root, scaleType]);

	const handleRandom = () => {
		const type = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)];
		// Randomize based on circle of fifths to ensure nice keys
		let r = INITIAL_NOTE;
		let attempts = 0;
		while (attempts < 100) {
			const steps = Math.floor(Math.random() * 12) - 6;
			let candidate = INITIAL_NOTE;
			for (let i = 0; i < Math.abs(steps); i++) {
				candidate =
					steps > 0 ? getNextFifth(candidate) : getPrevFifth(candidate);
			}
			// Double check against standard key rules
			if (isStandardKey(candidate, type)) {
				r = candidate;
				break;
			}
			attempts++;
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

	return (
		<div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full min-h-dvh justify-center py-4">
			<div className="text-center space-y-1 mb-2">
				<h1 className="text-3xl font-serif font-medium tracking-tight text-slate-900">
					Virtuoso
				</h1>
				<p className="text-slate-500 text-sm uppercase tracking-widest font-medium">
					Scales & Cadences
				</p>
			</div>

			<Card className="w-full border-0 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100 py-4">
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
									<SelectValue>
										{root.name}
										{root.accidental}
									</SelectValue>
								</SelectTrigger>
								<SelectContent align="start">
									{ROOTS.map((r) => {
										const isStandard = isStandardKey(r, scaleType);
										return (
											<SelectItem
												key={`${r.name}${r.accidental}`}
												value={`${r.name}${r.accidental}`}
												className={
													!isStandard ? "text-slate-400 italic" : "font-medium"
												}
											>
												{r.name}
												{r.accidental}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>

							{/* Split Scale Type Selector */}
							<div className="flex items-center gap-2">
								{/* Major / Minor Toggle */}
								<div className="flex items-center">
									<Tabs
										value={scaleType === "Major" ? "Major" : "Minor"}
										onValueChange={(v) => {
											if (v === "Major") setScaleType("Major");
											else setScaleType("Minor (Harmonic)");
										}}
									>
										<TabsList>
											<TabsTrigger value="Major">Major</TabsTrigger>
											<TabsTrigger value="Minor">Minor</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>

								{/* Minor Type Sub-selector (only if Minor) */}
								{scaleType.startsWith("Minor") && (
									<div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
										<Tabs
											value={scaleType}
											onValueChange={(v) => setScaleType(v as ScaleType)}
										>
											<TabsList>
												<TabsTrigger value="Minor (Harmonic)">
													Harmonic
												</TabsTrigger>
												<TabsTrigger value="Minor (Melodic)">
													Melodic
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</div>
								)}
							</div>
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
				<div className="bg-white flex items-center justify-center px-2">
					<SheetMusic abc={abc} />
				</div>
			</Card>

			<div className="space-y-4 w-full">
				<div className="grid grid-cols-1 gap-3 pt-2">
					<Button
						variant="outline"
						onClick={handleRelative}
						className="h-10 text-xs border-slate-200 hover:bg-slate-50 hover:text-slate-900"
					>
						<Music className="mr-2 h-3 w-3" />
						Relative {scaleType === "Major" ? "Minor" : "Major"}
					</Button>
				</div>

				<Metronome />
			</div>
		</div>
	);
}
