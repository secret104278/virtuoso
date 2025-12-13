import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const TEMPO_OPTIONS = [80, 90, 100, 110, 120];

export function Metronome() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [tempo, setTempo] = useState(100);
	const audioContextRef = useRef<AudioContext | null>(null);
	const nextNoteTimeRef = useRef(0);
	const timerIdRef = useRef<number | null>(null);
	const tempoRef = useRef(100);

	const scheduleNote = (time: number) => {
		if (!audioContextRef.current) return;

		const ctx = audioContextRef.current;

		// Create a more pleasant wood block-like sound
		const osc1 = ctx.createOscillator();
		const osc2 = ctx.createOscillator();
		const gainNode = ctx.createGain();
		const filter = ctx.createBiquadFilter();

		// Consistent frequency for all beats
		const baseFreq = 800;
		osc1.frequency.value = baseFreq;
		osc2.frequency.value = baseFreq * 2;

		osc1.type = "sine";
		osc2.type = "sine";

		// Filter for a more mellow tone
		filter.type = "bandpass";
		filter.frequency.value = baseFreq;
		filter.Q.value = 1;

		// Connect the audio graph
		osc1.connect(filter);
		osc2.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(ctx.destination);

		// Envelope for a percussive sound
		const attackTime = 0.001;
		const decayTime = 0.04;
		const volume = 0.3;

		gainNode.gain.setValueAtTime(0, time);
		gainNode.gain.linearRampToValueAtTime(volume, time + attackTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, time + decayTime);

		osc1.start(time);
		osc2.start(time);
		osc1.stop(time + decayTime);
		osc2.stop(time + decayTime);
	};

	const scheduler = () => {
		if (!audioContextRef.current) return;

		const lookahead = 0.1;
		const scheduleAheadTime = 0.2;

		while (
			nextNoteTimeRef.current <
			audioContextRef.current.currentTime + scheduleAheadTime
		) {
			scheduleNote(nextNoteTimeRef.current);
			const secondsPerBeat = 60.0 / tempoRef.current;
			nextNoteTimeRef.current += secondsPerBeat;
		}

		timerIdRef.current = window.setTimeout(scheduler, lookahead * 1000);
	};

	const start = async () => {
		if (!audioContextRef.current) {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			audioContextRef.current = new AudioContextClass();
		}

		// Safari iOS requires resume() to be called within a user gesture
		if (audioContextRef.current.state === "suspended") {
			await audioContextRef.current.resume();
		}

		setIsPlaying(true);
		nextNoteTimeRef.current = audioContextRef.current.currentTime;
		scheduler();
	};

	const stop = () => {
		setIsPlaying(false);
		if (timerIdRef.current) {
			clearTimeout(timerIdRef.current);
			timerIdRef.current = null;
		}
	};

	useEffect(() => {
		return () => {
			if (timerIdRef.current) {
				clearTimeout(timerIdRef.current);
			}
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, []);

	const handleToggle = () => {
		if (isPlaying) {
			stop();
		} else {
			start();
		}
	};

	const handleTempoChange = (newTempo: number) => {
		setTempo(newTempo);
		tempoRef.current = newTempo;
	};

	return (
		<div className="flex flex-col gap-3 w-full">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
					Metronome
				</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleToggle}
					className="h-8 w-8 hover:bg-slate-200/50"
				>
					{isPlaying ? (
						<Pause className="h-4 w-4 text-slate-600" />
					) : (
						<Play className="h-4 w-4 text-slate-600" />
					)}
				</Button>
			</div>
			<ButtonGroup className="w-full">
				{TEMPO_OPTIONS.map((bpm) => (
					<Button
						key={bpm}
						variant={tempo === bpm ? "default" : "outline"}
						size="sm"
						onClick={() => handleTempoChange(bpm)}
						className={`flex-1 h-9 text-xs font-medium ${
							tempo === bpm
								? "bg-slate-900 text-white hover:bg-slate-800"
								: "border-slate-200 hover:bg-slate-50"
						}`}
					>
						{bpm}
					</Button>
				))}
			</ButtonGroup>
		</div>
	);
}
