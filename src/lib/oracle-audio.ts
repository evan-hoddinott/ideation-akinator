import type { SageSoundCue } from '$lib/personality';
import type { SageVoiceProfile } from '$lib/rpg-dialogue';

interface MidiNote {
	time: number;
	duration: number;
	note: number;
	velocity: number;
}

export class OracleAudio {
	private context: AudioContext | null = null;
	private musicGain: GainNode | null = null;
	private cueGain: GainNode | null = null;
	private notes: MidiNote[] = [];
	private loopTimer: number | null = null;
	private musicOscillators = new Set<OscillatorNode>();
	private enabled = false;
	private eraIndex = 0;

	setEra(index: number): void {
		const next = Math.max(0, Math.min(13, Math.floor(index)));
		if (next === this.eraIndex) return;
		this.eraIndex = next;
		if (this.enabled && this.notes.length > 0) this.startMusic();
	}

	async setEnabled(enabled: boolean): Promise<void> {
		this.enabled = enabled;
		if (!enabled) {
			this.stopMusic();
			return;
		}
		this.ensureContext();
		if (this.context?.state === 'suspended') await this.context.resume();
		if (this.notes.length === 0) await this.loadMidi();
		this.startMusic();
	}

	playCue(cue: SageSoundCue): void {
		if (!this.enabled || cue === 'none') return;
		const context = this.ensureContext();
		const patterns: Record<Exclude<SageSoundCue, 'none'>, Array<[number, number]>> = {
			blip: [[660, 0]],
			sparkle: [
				[523, 0],
				[784, 0.07],
				[1047, 0.14]
			],
			error: [
				[180, 0],
				[120, 0.1]
			],
			reveal: [
				[392, 0],
				[523, 0.09],
				[659, 0.18],
				[784, 0.27]
			]
		};
		for (const [frequency, delay] of patterns[cue]) {
			this.scheduleTone(
				context.currentTime + delay,
				frequency,
				0.09,
				0.055,
				'square',
				this.cueGain
			);
		}
	}

	playVoice(profile: SageVoiceProfile): void {
		if (!this.enabled) return;
		const context = this.ensureContext();
		this.scheduleTone(
			context.currentTime,
			profile.frequency,
			profile.duration,
			profile.volume,
			profile.waveform,
			this.cueGain
		);
	}

	private ensureContext(): AudioContext {
		if (this.context) return this.context;
		this.context = new AudioContext();
		this.musicGain = this.context.createGain();
		this.musicGain.gain.value = 0.025;
		this.musicGain.connect(this.context.destination);
		this.cueGain = this.context.createGain();
		this.cueGain.gain.value = 0.22;
		this.cueGain.connect(this.context.destination);
		return this.context;
	}

	private async loadMidi(): Promise<void> {
		try {
			const response = await fetch('/audio/theme-song-8-bit.mid');
			if (!response.ok) return;
			this.notes = parseMidiNotes(await response.arrayBuffer()).slice(0, 180);
		} catch {
			this.notes = [];
		}
	}

	private startMusic(): void {
		this.stopMusic();
		if (!this.enabled || this.notes.length === 0 || !this.context) return;
		if (this.musicGain) this.musicGain.gain.setValueAtTime(0.025, this.context.currentTime);
		const playLoop = () => {
			if (!this.enabled || !this.context) return;
			const voice = eraVoice(this.eraIndex);
			const start = this.context.currentTime + 0.06;
			for (const note of this.notes) {
				this.scheduleTone(
					start + note.time,
					midiFrequency(note.note + voice.transpose),
					Math.min(note.duration, voice.maxDuration),
					voice.volume + note.velocity * voice.velocityGain,
					voice.waveform,
					this.musicGain
				);
			}
			this.loopTimer = window.setTimeout(playLoop, 24_000);
		};
		playLoop();
	}

	private stopMusic(): void {
		if (this.loopTimer !== null) window.clearTimeout(this.loopTimer);
		this.loopTimer = null;
		for (const oscillator of this.musicOscillators) {
			try {
				oscillator.stop();
			} catch {
				// An oscillator that has already ended needs no further cleanup.
			}
		}
		this.musicOscillators.clear();
		if (this.musicGain && this.context) {
			this.musicGain.gain.cancelScheduledValues(this.context.currentTime);
			this.musicGain.gain.setValueAtTime(0, this.context.currentTime);
		}
	}

	private scheduleTone(
		when: number,
		frequency: number,
		duration: number,
		volume: number,
		type: OscillatorType,
		destination: AudioNode | null
	): void {
		if (!this.context || !destination) return;
		const oscillator = this.context.createOscillator();
		const gain = this.context.createGain();
		oscillator.type = type;
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0.0001, when);
		gain.gain.exponentialRampToValueAtTime(volume, when + 0.008);
		gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
		oscillator.connect(gain);
		gain.connect(destination);
		if (destination === this.musicGain) {
			this.musicOscillators.add(oscillator);
			oscillator.addEventListener('ended', () => this.musicOscillators.delete(oscillator), {
				once: true
			});
		}
		oscillator.start(when);
		oscillator.stop(when + duration + 0.02);
	}
}

function eraVoice(index: number): {
	waveform: OscillatorType;
	transpose: number;
	maxDuration: number;
	volume: number;
	velocityGain: number;
} {
	if (index <= 1)
		return {
			waveform: 'square',
			transpose: -12,
			maxDuration: 0.12,
			volume: 0.008,
			velocityGain: 0.018
		};
	if (index <= 3)
		return {
			waveform: 'square',
			transpose: 0,
			maxDuration: 0.22,
			volume: 0.01,
			velocityGain: 0.022
		};
	if (index <= 5)
		return {
			waveform: 'triangle',
			transpose: 0,
			maxDuration: 0.3,
			volume: 0.012,
			velocityGain: 0.024
		};
	if (index <= 7)
		return {
			waveform: 'sawtooth',
			transpose: 12,
			maxDuration: 0.18,
			volume: 0.008,
			velocityGain: 0.016
		};
	if (index <= 9)
		return {
			waveform: 'triangle',
			transpose: 12,
			maxDuration: 0.28,
			volume: 0.009,
			velocityGain: 0.018
		};
	if (index <= 11)
		return { waveform: 'sine', transpose: 0, maxDuration: 0.42, volume: 0.012, velocityGain: 0.02 };
	return {
		waveform: 'sine',
		transpose: -12,
		maxDuration: 0.58,
		volume: 0.014,
		velocityGain: 0.024
	};
}

export function parseMidiNotes(buffer: ArrayBuffer): MidiNote[] {
	const bytes = new Uint8Array(buffer);
	if (ascii(bytes, 0, 4) !== 'MThd' || bytes.length < 14) return [];
	const division = read16(bytes, 12);
	if (division === 0 || (division & 0x8000) !== 0) return [];
	let offset = 8 + read32(bytes, 4);
	const raw: Array<{ tick: number; note: number; velocity: number; on: boolean }> = [];
	while (offset + 8 <= bytes.length) {
		const type = ascii(bytes, offset, 4);
		const length = read32(bytes, offset + 4);
		const end = Math.min(offset + 8 + length, bytes.length);
		if (type === 'MTrk') parseTrack(bytes, offset + 8, end, raw);
		offset = end;
	}
	const active = new Map<string, Array<{ tick: number; velocity: number }>>();
	const notes: MidiNote[] = [];
	for (const event of raw.sort((a, b) => a.tick - b.tick)) {
		const key = String(event.note);
		if (event.on) {
			const stack = active.get(key) ?? [];
			stack.push({ tick: event.tick, velocity: event.velocity });
			active.set(key, stack);
			continue;
		}
		const start = active.get(key)?.shift();
		if (!start) continue;
		const time = (start.tick / division) * 0.5;
		if (time >= 24) continue;
		notes.push({
			time,
			duration: Math.max(0.04, ((event.tick - start.tick) / division) * 0.5),
			note: event.note,
			velocity: start.velocity / 127
		});
	}
	return notes.sort((a, b) => a.time - b.time);
}

function parseTrack(
	bytes: Uint8Array,
	start: number,
	end: number,
	out: Array<{ tick: number; note: number; velocity: number; on: boolean }>
): void {
	let offset = start;
	let tick = 0;
	let runningStatus = 0;
	while (offset < end) {
		const delta = readVariable(bytes, offset, end);
		offset = delta.next;
		tick += delta.value;
		if (offset >= end) break;
		let status = bytes[offset];
		if ((status & 0x80) !== 0) {
			offset += 1;
			if (status < 0xf0) runningStatus = status;
		} else {
			status = runningStatus;
		}
		if (status === 0xff) {
			offset += 1;
			const length = readVariable(bytes, offset, end);
			offset = Math.min(length.next + length.value, end);
			continue;
		}
		if (status === 0xf0 || status === 0xf7) {
			const length = readVariable(bytes, offset, end);
			offset = Math.min(length.next + length.value, end);
			continue;
		}
		const command = status & 0xf0;
		if (command === 0x80 || command === 0x90) {
			if (offset + 2 > end) break;
			const note = bytes[offset];
			const velocity = bytes[offset + 1];
			out.push({ tick, note, velocity, on: command === 0x90 && velocity > 0 });
			offset += 2;
			continue;
		}
		offset += command === 0xc0 || command === 0xd0 ? 1 : 2;
	}
}

function readVariable(
	bytes: Uint8Array,
	start: number,
	end: number
): { value: number; next: number } {
	let value = 0;
	let offset = start;
	for (let count = 0; count < 4 && offset < end; count += 1) {
		const byte = bytes[offset++];
		value = (value << 7) | (byte & 0x7f);
		if ((byte & 0x80) === 0) break;
	}
	return { value, next: offset };
}

function midiFrequency(note: number): number {
	return 440 * Math.pow(2, (note - 69) / 12);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
	return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function read16(bytes: Uint8Array, offset: number): number {
	return (bytes[offset] << 8) | bytes[offset + 1];
}

function read32(bytes: Uint8Array, offset: number): number {
	return (
		bytes[offset] * 0x1000000 +
		(bytes[offset + 1] << 16) +
		(bytes[offset + 2] << 8) +
		bytes[offset + 3]
	);
}
