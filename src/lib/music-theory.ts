import _ from "lodash";

// Basic definitions
export type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";
export type Accidental = "" | "#" | "b" | "##" | "bb" | "n";
export type ScaleType =
	| "Major"
	| "Minor (Natural)"
	| "Minor (Harmonic)"
	| "Minor (Melodic)";

export interface Note {
	name: NoteName;
	accidental: Accidental;
	octave: number;
}

export interface ScaleDefinition {
	root: Note;
	type: ScaleType;
}

const CADENCE_LH_OFFSETS = [
	[-24],
	[-7, -19],
	[-5, -17],
	[-17, -29],
	[-12, -24],
];

// Order of notes for calculation
const NOTE_ORDER: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];
const SEMITONES: Record<NoteName, number> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11,
};

// Intervals (semitones)
const SCALES_INTERVALS: Record<ScaleType, number[]> = {
	Major: [2, 2, 1, 2, 2, 2, 1],
	"Minor (Natural)": [2, 1, 2, 2, 1, 2, 2],
	"Minor (Harmonic)": [2, 1, 2, 2, 1, 3, 1],
	"Minor (Melodic)": [2, 1, 2, 2, 2, 2, 1],
};

const ACCIDENTAL_OFFSETS: Record<Accidental, number> = {
	"": 0,
	"#": 1,
	"##": 2,
	b: -1,
	bb: -2,
	n: 0,
};

const ACCIDENTAL_MAP: Record<number, Accidental> = {
	0: "",
	1: "#",
	2: "##",
	[-1]: "b",
	[-2]: "bb",
};

function getNextNoteName(name: NoteName): NoteName {
	const idx = NOTE_ORDER.indexOf(name);
	return NOTE_ORDER[(idx + 1) % NOTE_ORDER.length];
}

function getNoteSemitone(note: Note): number {
	return SEMITONES[note.name] + ACCIDENTAL_OFFSETS[note.accidental];
}

function getAbsoluteSemitone(note: Note): number {
	return note.octave * 12 + getNoteSemitone(note);
}

function getAccidental(target: number, currentName: NoteName): Accidental {
	let diff = target - SEMITONES[currentName];
	while (diff > 6) diff -= 12;
	while (diff < -6) diff += 12;
	return ACCIDENTAL_MAP[diff] || "";
}

// --- Scale Generation ---

export function getScaleNotes(
	root: Note,
	type: ScaleType,
	direction: "up" | "down" = "up",
): Note[] {
	const notes: Note[] = [];
	const currentNote = { ...root };
	let currentSemitone = getNoteSemitone(root);

	notes.push({ ...currentNote });

	const intervals =
		type === "Minor (Melodic)" && direction === "down"
			? SCALES_INTERVALS["Minor (Natural)"]
			: SCALES_INTERVALS[type];

	const usedIntervals =
		direction === "down" ? [...intervals].reverse() : intervals;

	for (const interval of usedIntervals) {
		if (direction === "up") {
			currentSemitone += interval;
			const nextName = getNextNoteName(currentNote.name);
			if (nextName === "C" && currentNote.name !== "C") currentNote.octave++;
			currentNote.name = nextName;
		} else {
			currentSemitone -= interval;
			const idx = NOTE_ORDER.indexOf(currentNote.name);
			const nextName = NOTE_ORDER[(idx - 1 + 7) % 7];
			if (nextName === "B" && currentNote.name !== "B") currentNote.octave--;
			currentNote.name = nextName;
		}

		currentNote.accidental = getAccidental(currentSemitone, currentNote.name);
		notes.push({ ...currentNote });
	}
	return notes;
}

// --- Navigation Helpers ---

// Definitive Circle of Fifths (User Preferred: Sharp side -> F# -> Flat side Db ...)
// Order: C, G, D, A, E, B, Gb, Db, Ab, Eb, Bb, F
export const CIRCLE_OF_FIFTHS: Note[] = [
	{ name: "C", accidental: "", octave: 4 },
	{ name: "G", accidental: "", octave: 4 },
	{ name: "D", accidental: "", octave: 4 },
	{ name: "A", accidental: "", octave: 4 },
	{ name: "E", accidental: "", octave: 4 },
	{ name: "B", accidental: "", octave: 4 },
	{ name: "G", accidental: "b", octave: 4 }, // Gb (User preferred over F#)
	{ name: "D", accidental: "b", octave: 4 }, // Db
	{ name: "A", accidental: "b", octave: 4 }, // Ab
	{ name: "E", accidental: "b", octave: 4 }, // Eb
	{ name: "B", accidental: "b", octave: 4 }, // Bb
	{ name: "F", accidental: "", octave: 4 },
];

const CIRCLE_OF_FIFTHS_MINOR: Note[] = [
	{ name: "A", accidental: "", octave: 4 },
	{ name: "E", accidental: "", octave: 4 },
	{ name: "B", accidental: "", octave: 4 },
	{ name: "F", accidental: "#", octave: 4 },
	{ name: "C", accidental: "#", octave: 4 },
	{ name: "G", accidental: "#", octave: 4 },
	{ name: "E", accidental: "b", octave: 4 },
	{ name: "B", accidental: "b", octave: 4 },
	{ name: "F", accidental: "", octave: 4 },
	{ name: "C", accidental: "", octave: 4 },
	{ name: "G", accidental: "", octave: 4 },
	{ name: "D", accidental: "", octave: 4 },
];

export const SELECTABLE_ROOTS: readonly Note[] = _.uniqBy(
	[...CIRCLE_OF_FIFTHS, ...CIRCLE_OF_FIFTHS_MINOR],
	(n) => getNoteSemitone(n),
).sort((a, b) => getNoteSemitone(a) - getNoteSemitone(b));

export function getNoteFromSemitone(
	semitone: number,
	preferFlat = false,
): Note {
	let val = semitone % 12;
	if (val < 0) val += 12;

	const map: Record<number, { name: NoteName; accidental: Accidental }[]> = {
		0: [{ name: "C", accidental: "" }],
		1: [
			{ name: "C", accidental: "#" },
			{ name: "D", accidental: "b" },
		],
		2: [{ name: "D", accidental: "" }],
		3: [
			{ name: "D", accidental: "#" },
			{ name: "E", accidental: "b" },
		],
		4: [{ name: "E", accidental: "" }],
		5: [{ name: "F", accidental: "" }],
		6: [
			{ name: "F", accidental: "#" },
			{ name: "G", accidental: "b" },
		],
		7: [{ name: "G", accidental: "" }],
		8: [
			{ name: "G", accidental: "#" },
			{ name: "A", accidental: "b" },
		],
		9: [{ name: "A", accidental: "" }],
		10: [
			{ name: "A", accidental: "#" },
			{ name: "B", accidental: "b" },
		],
		11: [{ name: "B", accidental: "" }],
	};

	const options = map[val];
	if (preferFlat) {
		const flat = options.find((o) => o.accidental === "b");
		if (flat) return { ...flat, octave: 4 };
	}

	if (options.length === 1) return { ...options[0], octave: 4 };
	return { ...options[preferFlat ? 1 : 0], octave: 4 };
}

function findInCircle(circle: Note[], note: Note): number {
	const semitone = getNoteSemitone(note);
	return circle.findIndex((n) => getNoteSemitone(n) === semitone);
}

export function getNextFifth(root: Note): Note {
	const idx = findInCircle(CIRCLE_OF_FIFTHS, root);
	return CIRCLE_OF_FIFTHS[(idx + 1) % CIRCLE_OF_FIFTHS.length];
}

export function getPrevFifth(root: Note): Note {
	const idx = findInCircle(CIRCLE_OF_FIFTHS, root);
	return CIRCLE_OF_FIFTHS[
		(idx - 1 + CIRCLE_OF_FIFTHS.length) % CIRCLE_OF_FIFTHS.length
	];
}

export function getRelativeNote(root: Note, type: ScaleType): Note {
	const [fromCircle, toCircle] =
		type === "Major"
			? [CIRCLE_OF_FIFTHS, CIRCLE_OF_FIFTHS_MINOR]
			: [CIRCLE_OF_FIFTHS_MINOR, CIRCLE_OF_FIFTHS];
	return toCircle[findInCircle(fromCircle, root)];
}

// --- ABC Generation with Key Signature & Rhythm logic ---

const ABC_ACCIDENTALS: Record<Accidental, string> = {
	"": "=",
	"#": "^",
	"##": "^^",
	b: "_",
	bb: "__",
	n: "=",
};

function smartNoteToABC(
	note: Note,
	keySignatureMap: Record<NoteName, Accidental>,
): string {
	const expected = keySignatureMap[note.name] || "";
	const outputAcc =
		note.accidental === expected ? "" : ABC_ACCIDENTALS[note.accidental];

	const octaveDiff = note.octave - 4;
	const pitch =
		octaveDiff === 0
			? note.name.toUpperCase()
			: octaveDiff === 1
				? note.name.toLowerCase()
				: octaveDiff > 1
					? `${note.name.toLowerCase()}${"'".repeat(octaveDiff - 1)}`
					: `${note.name.toUpperCase()}${",".repeat(-octaveDiff)}`;

	return `${outputAcc}${pitch}`;
}

const CADENCE_OFFSETS = {
	major: {
		rh: [[0], [2, 9, 12], [4, 7, 12], [2, 5, 7, 11], [0, 4, 7, 12]],
		lh: CADENCE_LH_OFFSETS,
	},
	minor: {
		rh: [[0], [2, 8, 12], [3, 7, 12], [2, 5, 7, 11], [0, 3, 7, 12]],
		lh: CADENCE_LH_OFFSETS,
	},
};

export function generateGrandStaffABC(root: Note, type: ScaleType): string {
	const isMinor = type !== "Major";
	const keySigString = `${root.name}${root.accidental}${isMinor ? "m" : ""}`;

	const scaleType = isMinor ? "Minor (Natural)" : "Major";
	const keyNotes =
		type === "Major" ? null : getScaleNotes(root, scaleType, "up");
	const notesUp = getScaleNotes(root, type, "up");

	const keySigMap = Object.fromEntries(
		(keyNotes || notesUp).map((n) => [n.name, n.accidental]),
	) as Record<NoteName, Accidental>;

	const notesDown = getScaleNotes(notesUp[7], type, "down");

	const toABC = (n: Note) => smartNoteToABC(n, keySigMap);
	const formatScaleBar = (notes: Note[]) =>
		`${notes.slice(0, 4).map(toABC).join("")} ${notes.slice(4, 8).map(toABC).join("")}`;

	const transposeOctave = (notes: Note[], offset: number) =>
		notes.map((n) => ({ ...n, octave: n.octave + offset }));

	const rhScaleABC = `${formatScaleBar(notesUp)} | ${formatScaleBar(notesDown)}`;
	const lhScaleABC = `${formatScaleBar(transposeOctave(notesUp, -1))} | ${formatScaleBar(transposeOctave(notesDown, -1))}`;

	const preferFlat =
		root.accidental.includes("b") ||
		root.name === "F" ||
		(keyNotes || notesUp).some((n) => n.accidental.includes("b"));

	const rootAbs = getAbsoluteSemitone(root);
	const resolveNote = (semitoneOffset: number): Note => {
		const targetAbs = rootAbs + semitoneOffset;
		const note = getNoteFromSemitone(targetAbs, preferFlat);
		note.octave = Math.floor(targetAbs / 12);
		return note;
	};

	const buildChord = (offsets: number[], length: number) =>
		`[${offsets.map(resolveNote).map(toABC).join("")}]${length}`;

	const formatCadence = (offsetsList: number[][]) => {
		const [c0, c1, c2, c3, c4] = offsetsList.map((offsets, i) =>
			buildChord(offsets, i === 4 ? 8 : 4),
		);
		return `${c0} ${c1} | ${c2} ${c3} | ${c4}`;
	};

	const cadence = isMinor ? CADENCE_OFFSETS.minor : CADENCE_OFFSETS.major;

	return `
M: 2/4
L: 1/16
K: ${keySigString}
V: 1 treble
${rhScaleABC} :|] ${formatCadence(cadence.rh)} |]
V: 2 bass
${lhScaleABC} :|] ${formatCadence(cadence.lh)} |]
`;
}
