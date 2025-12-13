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

// User provided cadence voicing (Semitone offsets from Root)
// Note: These need to be interpreted carefully regarding octave.
// Assuming 0 is the Root Note (e.g. C4).
const CADENCE_LH_OFFSETS = [[-12], [5, -7], [7, -5], [-5, -17], [0, -12]];
const CADENCE_RH_OFFSETS = [
	[0],
	[2, 9, 12],
	[4, 7, 12],
	[2, 5, 7, 11],
	[0, 4, 7, 12],
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

// --- Helper Functions ---

function getNextNoteName(name: NoteName): NoteName {
	const idx = NOTE_ORDER.indexOf(name);
	return NOTE_ORDER[(idx + 1) % NOTE_ORDER.length];
}

function getNoteSemitone(note: Note): number {
	let val = SEMITONES[note.name];
	if (note.accidental === "#") val += 1;
	if (note.accidental === "##") val += 2;
	if (note.accidental === "b") val -= 1;
	if (note.accidental === "bb") val -= 2;
	return val;
}

// Get absolute semitone value (accounting for octave, C4 = 60 roughly, but let's just use 12*oct + val)
function getAbsoluteSemitone(note: Note): number {
	return note.octave * 12 + getNoteSemitone(note);
}

function getAccidental(target: number, currentName: NoteName): Accidental {
	const base = SEMITONES[currentName];
	let diff = target - base;
	while (diff > 6) diff -= 12;
	while (diff < -6) diff += 12;
	if (diff === 0) return "";
	if (diff === 1) return "#";
	if (diff === 2) return "##";
	if (diff === -1) return "b";
	if (diff === -2) return "bb";
	return "";
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

	const intervals = SCALES_INTERVALS[type];
	let usedIntervals = [...intervals];

	// Classical Melodic Minor: Up = Melodic, Down = Natural
	if (type === "Minor (Melodic)" && direction === "down") {
		usedIntervals = SCALES_INTERVALS["Minor (Natural)"].slice().reverse();
	} else if (direction === "down") {
		usedIntervals = [...intervals].reverse();
	}

	for (let i = 0; i < 7; i++) {
		const interval = usedIntervals[i];

		if (direction === "up") {
			currentSemitone += interval;
			const nextName = getNextNoteName(currentNote.name);
			if (nextName === "C" && currentNote.name !== "C") currentNote.octave++;
			currentNote.name = nextName;
		} else {
			currentSemitone -= interval;
			const idx = NOTE_ORDER.indexOf(currentNote.name);
			const prevIdx = (idx - 1 + 7) % 7;
			const nextName = NOTE_ORDER[prevIdx];
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
// Order: C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F
export const CIRCLE_OF_FIFTHS: Note[] = [
	{ name: "C", accidental: "", octave: 4 },
	{ name: "G", accidental: "", octave: 4 },
	{ name: "D", accidental: "", octave: 4 },
	{ name: "A", accidental: "", octave: 4 },
	{ name: "E", accidental: "", octave: 4 },
	{ name: "B", accidental: "", octave: 4 },
	{ name: "F", accidental: "#", octave: 4 },
	{ name: "D", accidental: "b", octave: 4 }, // Db
	{ name: "A", accidental: "b", octave: 4 }, // Ab
	{ name: "E", accidental: "b", octave: 4 }, // Eb
	{ name: "B", accidental: "b", octave: 4 }, // Bb
	{ name: "F", accidental: "", octave: 4 },
];

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

// Comparison helper
const isSameNote = (n1: Note, n2: Note) =>
	n1.name === n2.name && n1.accidental === n2.accidental;

export function getNextFifth(root: Note): Note {
	// Find current note in cycle
	const idx = CIRCLE_OF_FIFTHS.findIndex((n) => isSameNote(n, root));
	if (idx !== -1) {
		return CIRCLE_OF_FIFTHS[(idx + 1) % CIRCLE_OF_FIFTHS.length];
	}
	// Fallback if note not in strict cycle (e.g. from generated relative? shouldn't happen if strict)
	// Try enharmonic match?
	// Let's just fallback to calculation but prefer cycle logic.
	const current = getNoteSemitone(root);
	// Manual check for F -> C (Flat to Natural)
	if (root.name === "F" && root.accidental === "")
		return { name: "C", accidental: "", octave: 4 };
	const preferFlat = root.accidental.includes("b");
	return getNoteFromSemitone(current + 7, preferFlat);
}

export function getPrevFifth(root: Note): Note {
	const idx = CIRCLE_OF_FIFTHS.findIndex((n) => isSameNote(n, root));
	if (idx !== -1) {
		return CIRCLE_OF_FIFTHS[
			(idx - 1 + CIRCLE_OF_FIFTHS.length) % CIRCLE_OF_FIFTHS.length
		];
	}

	const current = getNoteSemitone(root);
	return getNoteFromSemitone(current - 7, true);
}

export function getRelativeNote(root: Note, type: ScaleType): Note {
	const current = getNoteSemitone(root);
	if (type === "Major") {
		return getNoteFromSemitone(
			current - 3,
			root.accidental.includes("b") || root.name === "F",
		);
	} else {
		return getNoteFromSemitone(current + 3, root.accidental.includes("b"));
	}
}

// --- ABC Generation with Key Signature & Rhythm logic ---

// Helper: Convert 'Note' to clean ABC string, respecting Key Signature context
function smartNoteToABC(
	note: Note,
	keySignatureMap: Record<NoteName, Accidental>,
): string {
	let outputAcc = "";
	const expected = keySignatureMap[note.name] || "";

	// Logic:
	// If actual accidental matches expected (Key Sig), output NOTHING (implicit).
	// If actual is different, output the actual accidental explicitly.
	// Note: If expected is Sharp (#), and actual is Natural (""), we must output "=" ("=F").
	// If expected is Natural (""), and actual is Sharp, output "^".

	if (note.accidental === expected) {
		outputAcc = "";
	} else {
		// We need explicit accidental
		switch (note.accidental) {
			case "#":
				outputAcc = "^";
				break;
			case "##":
				outputAcc = "^^";
				break;
			case "b":
				outputAcc = "_";
				break;
			case "bb":
				outputAcc = "__";
				break;
			case "":
				outputAcc = "=";
				break; // Explicit natural
			case "n":
				outputAcc = "=";
				break;
		}
	}

	let pitch = note.name;
	if (note.octave === 4) pitch = pitch.toUpperCase();
	else if (note.octave === 5) pitch = pitch.toLowerCase();
	else if (note.octave === 6) pitch = `${pitch.toLowerCase()}'`;
	else if (note.octave === 3) pitch = `${pitch.toUpperCase()},`;
	else if (note.octave === 2) pitch = `${pitch.toUpperCase()},,`;
	else if (note.octave === 1) pitch = `${pitch.toUpperCase()},,,`;

	return `${outputAcc}${pitch}`;
}

export function generateGrandStaffABC(root: Note, type: ScaleType): string {
	// 1. Determine Key Signature string and Map
	// Basic Rule:
	// Major Key: Root Major.
	// Minor Key: Root Minor (Natural).
	const isMinor = type.startsWith("Minor");
	const keySigString = `${root.name}${root.accidental}${isMinor ? "m" : ""}`;

	// Generate the notes of the Key Signature to build our Expected Accidental Map
	// We strictly use Natural Minor for Minor keys as the base signature.
	const keyNotes = getScaleNotes(
		root,
		isMinor ? "Minor (Natural)" : "Major",
		"up",
	);
	const keySigMap = Object.fromEntries(
		keyNotes.map((n) => [n.name, n.accidental]),
	) as Record<NoteName, Accidental>;

	// 2. Generate Scale Notes (Up and Down)
	// User requirement: 16th notes. 2/4 meter.
	// Bar 1: Ascending (8 notes). Bar 2: Descending (8 notes).
	const notesUp = getScaleNotes(root, type, "up");
	const topNote = notesUp[notesUp.length - 1];
	const notesDown = getScaleNotes(topNote, type, "down");

	const formatScaleBar = (notes: Note[]) => {
		const s1 = notes
			.slice(0, 4)
			.map((n) => smartNoteToABC(n, keySigMap))
			.join("");
		const s2 = notes
			.slice(4, 8)
			.map((n) => smartNoteToABC(n, keySigMap))
			.join("");
		return `${s1} ${s2}`;
	};

	const groupedScaleABC = `${formatScaleBar(notesUp)} | ${formatScaleBar(notesDown)}`;

	// LH Scale (Octave Lower)
	const lhScaleNotesUp = notesUp.map((n) => ({ ...n, octave: n.octave - 1 }));
	const lhScaleNotesDown = notesDown.map((n) => ({
		...n,
		octave: n.octave - 1,
	}));
	const groupedLhScaleABC = `${formatScaleBar(lhScaleNotesUp)} | ${formatScaleBar(lhScaleNotesDown)}`;

	// 3. Cadence Generation (Specific Voicing)
	// const rootAbs = getAbsoluteSemitone(root);

	// Helper to resolve note from absolute semitone relative to Root context
	const resolveNote = (semitoneOffset: number): Note => {
		const preferFlat = root.accidental.includes("b") || root.name === "F";
		const currentAbs = getAbsoluteSemitone(root);
		const targetAbs = currentAbs + semitoneOffset;
		const note = getNoteFromSemitone(targetAbs, preferFlat);
		note.octave = Math.floor(targetAbs / 12);
		return note;
	};

	const buildChord = (offsets: number[], length: number) => {
		const notes = offsets.map(resolveNote);
		const str = `[${notes.map((n) => smartNoteToABC(n, keySigMap)).join("")}]${length}`;
		return str;
	};

	const formatCadence = (offsetsList: number[][]) => {
		const c0 = buildChord(offsetsList[0], 4);
		const c1 = buildChord(offsetsList[1], 4);
		const c2 = buildChord(offsetsList[2], 4);
		const c3 = buildChord(offsetsList[3], 4);
		const c4 = buildChord(offsetsList[4], 8); // Half note
		return `${c0} ${c1} | ${c2} ${c3} | ${c4}`;
	};

	const rhCadenceBar = formatCadence(CADENCE_RH_OFFSETS);
	const lhCadenceBar = formatCadence(CADENCE_LH_OFFSETS);

	return `
M: 2/4
L: 1/16
K: ${keySigString}
V: 1 treble
${groupedScaleABC} :|] ${rhCadenceBar} |]
V: 2 bass
${groupedLhScaleABC} :|] ${lhCadenceBar} |]
`;
}
