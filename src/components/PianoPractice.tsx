import confetti from "canvas-confetti";
import { format, startOfDay, subDays } from "date-fns";
import _ from "lodash";
import {
	ArrowLeft,
	ArrowLeftRight,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Info,
	Shuffle,
} from "lucide-react";
import { createParser, parseAsStringEnum, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
	getMajorKeyId,
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
	const [practiceHistory, setPracticeHistory] = useState<
		Record<string, { t: number; s: ScaleType }[]>
	>(() => {
		const saved = localStorage.getItem("practice_logs");
		if (saved) return JSON.parse(saved);

		// Migration from old format
		const oldSaved = localStorage.getItem("practice_counts");
		if (oldSaved) {
			const oldCounts: Record<string, number> = JSON.parse(oldSaved);
			const migrated: Record<string, { t: number; s: ScaleType }[]> = {};
			for (const [key, count] of Object.entries(oldCounts)) {
				migrated[key] = Array.from({ length: count }, () => ({
					t: Date.now(),
					s: "Major",
				}));
			}
			localStorage.setItem("practice_logs", JSON.stringify(migrated));
			localStorage.removeItem("practice_counts");
			return migrated;
		}
		return {};
	});

	// Stats window state (offset from "most recent Thursday" in days)
	const [statsOffset, setStatsOffset] = useState(0);

	const statsWindow = useMemo(() => {
		const today = startOfDay(new Date());
		// Find the most recent Thursday.
		const dayOfWeek = today.getDay(); // 0: Sun, ..., 4: Thu
		const diffToThu = (dayOfWeek - 4 + 7) % 7;
		const latestThursday = subDays(today, diffToThu);

		const start = subDays(latestThursday, statsOffset);
		const end = subDays(start, -6); // 7 days window (Thu to Wed)
		return { start, end };
	}, [statsOffset]);

	const abc = useMemo(() => generateABC(root, scaleType), [root, scaleType]);

	const handlePracticed = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			const keyId = getMajorKeyId(root, scaleType);
			const newHistory = {
				...practiceHistory,
				[keyId]: [
					...(practiceHistory[keyId] || []),
					{ t: Date.now(), s: scaleType },
				],
			};
			setPracticeHistory(newHistory);
			localStorage.setItem("practice_logs", JSON.stringify(newHistory));

			const rect = event.currentTarget.getBoundingClientRect();
			confetti({
				particleCount: 50,
				spread: 70,
				origin: {
					x: (rect.left + rect.width / 2) / window.innerWidth,
					y: (rect.top + rect.height / 2) / window.innerHeight,
				},
				colors: ["#FFD700", "#FDB931", "#FFFFFF"],
				ticks: 150,
				gravity: 1.5,
				scalar: 0.8,
			});
		},
		[root, scaleType, practiceHistory],
	);

	const handleRandom = () => {
		// Weighted selection: pick from keys with minimum practice count
		const counts = SELECTABLE_ROOTS.map((r) => {
			const keyId = getMajorKeyId(r, "Major");
			return practiceHistory[keyId]?.length || 0;
		});
		const minCount = Math.min(...counts);
		const candidates = SELECTABLE_ROOTS.filter((r) => {
			const keyId = getMajorKeyId(r, "Major");
			return (practiceHistory[keyId]?.length || 0) <= minCount;
		});

		setRoot((prev) => {
			let next = _.sample(candidates) ?? SELECTABLE_ROOTS[0];
			if (candidates.length > 1) {
				while (
					`${prev.name}${prev.accidental}` === `${next.name}${next.accidental}`
				) {
					next = _.sample(candidates) ?? SELECTABLE_ROOTS[0];
				}
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

	const chartData = useMemo(() => {
		const now = Date.now();
		const dayInMs = 24 * 60 * 60 * 1000;

		const data = SELECTABLE_ROOTS.map((r) => {
			const keyId = `${r.name}${r.accidental}`;
			const allLogs = practiceHistory[keyId] || [];

			// Filter logs for current window
			const windowLogs = allLogs.filter(
				(l) =>
					l.t >= statsWindow.start.getTime() &&
					l.t <= statsWindow.end.getTime() + dayInMs,
			);

			const lastLog = _.maxBy(allLogs, "t");
			const lastPracticed = lastLog ? lastLog.t : 0;

			// Scale types breakdown (for the window)
			const breakdown = _.countBy(windowLogs, "s");

			// Recency score (based on all logs, for visual hint)
			const daysSinceLast = lastPracticed
				? (now - lastPracticed) / dayInMs
				: 999;
			const recencyScore = Math.max(0, 1 - daysSinceLast / 14);

			return {
				key: keyId,
				count: windowLogs.length,
				totalCount: allLogs.length,
				lastPracticed,
				recencyScore,
				breakdown,
			};
		});

		const maxCount = Math.max(...data.map((d) => d.count), 1);
		return data.map((d) => ({
			...d,
			opacity: 0.2 + (d.count / maxCount) * 0.6 + d.recencyScore * 0.2,
		}));
	}, [practiceHistory, statsWindow]);

	const chartConfig = {
		count: {
			label: "練習次數",
			color: "oklch(0.828 0.189 84.429)",
		},
	} satisfies ChartConfig;

	const statsSummary = useMemo(() => {
		const allLogs = Object.values(practiceHistory).flat();
		const windowLogs = allLogs.filter(
			(l) =>
				l.t >= statsWindow.start.getTime() &&
				l.t <= statsWindow.end.getTime() + 24 * 60 * 60 * 1000,
		);

		return {
			total: allLogs.length,
			windowTotal: windowLogs.length,
		};
	}, [practiceHistory, statsWindow]);

	return (
		<div className="flex flex-col gap-4 p-3 max-w-4xl mx-auto w-full min-h-dvh justify-center py-4 text-left">
			<div className="relative text-center space-y-0.5">
				<div className="absolute top-0 left-0">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<BarChart3 className="h-4 w-4 text-slate-400" />
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[640px] w-[95vw]">
							<DialogHeader>
								<div className="flex flex-col gap-4 pr-6">
									<div className="flex items-center justify-between">
										<DialogTitle>練習進度總覽</DialogTitle>
										<div className="flex gap-4 text-right">
											<div>
												<p className="text-[10px] text-slate-400 uppercase tracking-tight">
													總練習次數
												</p>
												<p className="text-lg font-mono font-bold text-slate-900">
													{statsSummary.total}
												</p>
											</div>
											<div>
												<p className="text-[10px] text-slate-400 uppercase tracking-tight">
													期間練習
												</p>
												<p className="text-lg font-mono font-bold text-amber-600">
													{statsSummary.windowTotal}
												</p>
											</div>
										</div>
									</div>

									{/* Week Selector */}
									<div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => setStatsOffset((prev) => prev + 1)}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<div className="text-sm font-medium text-slate-600 font-mono text-center">
											{format(statsWindow.start, "EEE, MMM dd")} -{" "}
											{format(statsWindow.end, "EEE, MMM dd, yyyy")}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => setStatsOffset((prev) => prev - 1)}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</DialogHeader>
							<div className="py-6 overflow-hidden text-left">
								<ChartContainer
									config={chartConfig}
									className="h-[320px] w-full"
								>
									<BarChart
										data={chartData}
										margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
									>
										<CartesianGrid
											vertical={false}
											strokeDasharray="3 3"
											className="stroke-slate-200"
										/>
										<XAxis
											dataKey="key"
											tickLine={false}
											tickMargin={12}
											axisLine={false}
											className="text-[10px] font-medium"
										/>
										<YAxis hide />
										<ChartTooltip
											cursor={{ fill: "rgba(0,0,0,0.04)" }}
											content={({ active, payload }) => {
												if (!active || !payload?.length) return null;
												const data = payload[0].payload;
												return (
													<div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs space-y-2 text-left">
														<div className="flex items-center justify-between gap-4">
															<span className="font-bold text-sm">
																{data.key} 大小調
															</span>
															<span className="text-slate-400 font-mono">
																期間 {data.count} 次 / 累計 {data.totalCount} 次
															</span>
														</div>
														{data.lastPracticed > 0 && (
															<div className="text-slate-500">
																上次練習：
																{new Date(data.lastPracticed).toLocaleString(
																	"zh-TW",
																	{
																		month: "numeric",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	},
																)}
															</div>
														)}
														{data.count > 0 && (
															<div className="pt-1 border-t border-slate-100 flex gap-2 flex-wrap">
																{Object.entries(data.breakdown).map(
																	([type, count]) => (
																		<span
																			key={type}
																			className="bg-slate-50 px-1.5 py-0.5 rounded text-[10px] text-slate-600 border border-slate-100"
																		>
																			{type.split(" ")[0]}: {count as number}
																		</span>
																	),
																)}
															</div>
														)}
													</div>
												);
											}}
										/>
										<Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={24}>
											{chartData.map((entry) => (
												<Cell
													key={entry.key}
													fill="oklch(0.828 0.189 84.429)"
													fillOpacity={entry.count > 0 ? entry.opacity : 0.1}
													className="transition-all duration-300 hover:brightness-90"
												/>
											))}
										</Bar>
									</BarChart>
								</ChartContainer>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				<h1 className="text-2xl font-serif font-medium tracking-tight text-slate-900">
					Virtuoso
				</h1>
				<p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
					Scales & Cadences
				</p>

				<div className="absolute top-0 right-0">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Info className="h-4 w-4 text-slate-400" />
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>
									{root.name}
									{root.accidental} {scaleType === "Major" ? "大調" : "小調"}
									終止式說明
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-6 py-4 text-left">
								<div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
									<p className="font-bold mb-2 text-slate-900 text-base">
										級數：
										{scaleType === "Major"
											? "I - IV - I6/4 - V7 - I"
											: "i - iv - i6/4 - V7 - i"}
									</p>
									<p className="text-slate-600 text-sm leading-relaxed">
										包含了主和弦、下屬和弦、終止四六和弦（主和弦的第二轉位）、屬七和弦，最後回到主和弦。
									</p>
								</div>

								<div className="space-y-4">
									<p className="font-bold text-slate-900 text-base">
										各和弦具體找法：
									</p>
									<div className="space-y-5 text-slate-600">
										<div className="border-l-4 border-slate-200 pl-4">
											<p className="font-bold text-slate-800 text-sm mb-1.5">
												{scaleType === "Major" ? "主和弦 (I)" : "主和弦 (i)"}
											</p>
											<p className="text-sm leading-relaxed">
												由根音出發，疊加一個
												<span className="text-amber-600 font-bold">
													{scaleType === "Major"
														? "大三度 (4個半音)"
														: "小三度 (3個半音)"}
												</span>
												，再疊加一個
												<span className="text-amber-600 font-bold">
													{scaleType === "Major"
														? "小三度 (3個半音)"
														: "大三度 (4個半音)"}
												</span>
												。形成一個完全五度。
											</p>
										</div>
										<div className="border-l-4 border-slate-200 pl-4">
											<p className="font-bold text-slate-800 text-sm mb-1.5">
												{scaleType === "Major"
													? "下屬和弦 (IV)"
													: "下屬和弦 (iv)"}
											</p>
											<p className="text-sm leading-relaxed">
												從音階第 4 音出發，結構與主和弦相同（
												{scaleType === "Major"
													? "大三度+小三度"
													: "小三度+大三度"}
												）。
											</p>
										</div>
										<div className="border-l-4 border-slate-200 pl-4">
											<p className="font-bold text-slate-800 text-sm mb-1.5">
												終止四六和弦 ({scaleType === "Major" ? "I6/4" : "i6/4"})
											</p>
											<p className="text-sm leading-relaxed">
												將主和弦的音重新排列：第 5 音在最底，上方分別距離
												<span className="text-amber-600 font-bold">四度</span>與
												<span className="text-amber-600 font-bold">六度</span>
												。這常用於屬和弦前的預備。
											</p>
										</div>
										<div className="border-l-4 border-slate-200 pl-4">
											<p className="font-bold text-slate-800 text-sm mb-1.5">
												屬七和弦 (V7)
											</p>
											<p className="text-sm leading-relaxed">
												從音階第 5 音出發，疊加一個
												<span className="text-amber-600 font-bold">
													大三度 (4個半音)
												</span>
												、再疊加兩個
												<span className="text-amber-600 font-bold">
													小三度 (3個半音)
												</span>
												。
												{scaleType !== "Major" &&
													"注意：小調需升高第 7 音以符合大三度結構。"}
											</p>
										</div>
									</div>
									<p className="text-xs text-slate-400 mt-4 italic text-center">
										* 譜面上為了聲部進行流暢，會使用不同的轉位配置。
									</p>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
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

					{/* Practice Tracking Button */}
					<div className="flex justify-center pt-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handlePracticed}
							className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-[10px] h-7 px-3 uppercase tracking-wider font-bold"
						>
							<CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
							Mark as Practiced (
							{practiceHistory[getMajorKeyId(root, scaleType)]?.length || 0})
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
