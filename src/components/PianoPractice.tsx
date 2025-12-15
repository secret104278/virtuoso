import _ from "lodash";
import { ArrowLeft, ArrowLeftRight, ArrowRight, Shuffle } from "lucide-react";
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
	type Note,
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
		setRoot((prev) => {
			let next = _.sample(SELECTABLE_ROOTS) ?? SELECTABLE_ROOTS[0];
			while (prev === next) {
				next = _.sample(SELECTABLE_ROOTS) ?? SELECTABLE_ROOTS[0];
			}
			return next;
		});
		setScaleType("Major");
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
		<div className="flex flex-col gap-4 p-3 max-w-4xl mx-auto w-full min-h-dvh justify-center py-4">
			<div className="text-center space-y-0.5">
				<h1 className="text-2xl font-serif font-medium tracking-tight text-slate-900">
					Virtuoso
				</h1>
				<p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
					Scales & Cadences
				</p>
			</div>

			<Card className="w-full border border-slate-200/60 shadow-lg shadow-slate-200/40 overflow-hidden py-0">
				<CardHeader className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 border-b [.border-b]:pb-2 border-slate-100">
					{/* Key & Scale Selectors with Relative Button */}
					<div className="flex items-center justify-between gap-2 w-full">
						{/* Root Note Selector */}
						<div className="flex items-center shrink-0">
							<Select
								value={`${root.name}${root.accidental}`}
								onValueChange={(val) => {
									const selected = SELECTABLE_ROOTS.find(
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
									{SELECTABLE_ROOTS.map((r) => {
										return (
											<SelectItem
												key={`${r.name}${r.accidental}`}
												value={`${r.name}${r.accidental}`}
												className={"font-medium"}
											>
												{r.name}
												{r.accidental}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>

						{/* Scale Type Selectors - Centered */}
						<div className="flex flex-col sm:flex-row items-center gap-1.5 flex-1 sm:flex-initial">
							{/* Major / Minor Toggle */}
							<div className="flex items-center w-full sm:w-auto justify-center">
								<Tabs
									value={scaleType === "Major" ? "Major" : "Minor"}
									onValueChange={(v) => {
										if (v === "Major") setScaleType("Major");
										else setScaleType("Minor (Harmonic)");
									}}
									className="w-full sm:w-auto"
								>
									<TabsList className="w-full sm:w-auto grid grid-cols-2 h-9">
										<TabsTrigger value="Major" className="min-w-[70px] text-sm">
											Major
										</TabsTrigger>
										<TabsTrigger value="Minor" className="min-w-[70px] text-sm">
											Minor
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							{/* Minor Type Sub-selector (only if Minor) */}
							{scaleType.startsWith("Minor") && (
								<div className="flex items-center w-full sm:w-auto justify-center animate-in fade-in duration-200">
									<Tabs
										value={scaleType}
										onValueChange={(v) => setScaleType(v as ScaleType)}
										className="w-full sm:w-auto"
									>
										<TabsList className="w-full sm:w-auto grid grid-cols-2 h-9">
											<TabsTrigger
												value="Minor (Harmonic)"
												className="min-w-[80px] text-sm"
											>
												Harmonic
											</TabsTrigger>
											<TabsTrigger
												value="Minor (Melodic)"
												className="min-w-[80px] text-sm"
											>
												Melodic
											</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>
							)}
						</div>

						{/* Relative Key Button */}
						<div className="flex items-center shrink-0">
							<Button
								variant="ghost"
								size="icon"
								onClick={handleRelative}
								title={`Switch to Relative ${scaleType === "Major" ? "Minor" : "Major"}`}
								className="text-slate-400 hover:text-slate-900 h-9 w-9"
							>
								<ArrowLeftRight className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Navigation Controls */}
					<div className="flex items-center justify-between w-full gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCirclePrev}
							className="hover:bg-slate-200/50 h-9 w-9 shrink-0"
						>
							<ArrowLeft className="h-4 w-4 text-slate-600" />
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
							className="hover:bg-slate-200/50 h-9 w-9 shrink-0"
						>
							<ArrowRight className="h-4 w-4 text-slate-600" />
						</Button>
					</div>
				</CardHeader>
				<div className="bg-white flex items-center justify-center px-2">
					<SheetMusic abc={abc} />
				</div>
			</Card>

			<div className="space-y-4 w-full">
				<Metronome />
			</div>
		</div>
	);
}
