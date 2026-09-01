import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMidiNotes } from './oracle-audio';

describe('oracle MIDI reader', () => {
	it('extracts a playable opening from the local CC0 track', () => {
		const file = readFileSync('static/audio/theme-song-8-bit.mid');
		const buffer = file.buffer.slice(
			file.byteOffset,
			file.byteOffset + file.byteLength
		) as ArrayBuffer;
		const notes = parseMidiNotes(buffer);
		expect(notes.length).toBeGreaterThan(20);
		expect(notes.every((note) => note.time >= 0 && note.time < 24)).toBe(true);
	});

	it('treats invalid data as silence', () => {
		expect(parseMidiNotes(new Uint8Array([1, 2, 3]).buffer)).toEqual([]);
	});
});
