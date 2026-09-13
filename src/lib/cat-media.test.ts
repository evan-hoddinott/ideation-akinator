import { describe, expect, it } from 'vitest';
import { CAT_CLIPS, catPlaylist } from './cat-media';
import { existsSync } from 'node:fs';

describe('the cat video collection', () => {
	it('provides ten distinct local clips with matching thumbnails and attribution', () => {
		expect(CAT_CLIPS).toHaveLength(10);
		expect(new Set(CAT_CLIPS.map((clip) => clip.sourceUrl)).size).toBe(10);
		for (const clip of CAT_CLIPS) {
			expect(existsSync(`static${clip.src}`)).toBe(true);
			expect(existsSync(`static${clip.thumbnail}`)).toBe(true);
			expect(existsSync(`static${clip.poster}`)).toBe(true);
			expect(clip.author).not.toBe('');
			expect(clip.license).not.toBe('');
			expect(clip.durationSeconds).toBeGreaterThan(0);
		}
	});
	it('keeps order stable per run, changes across runs, and samples without replacement', () => {
		const first = catPlaylist('run-one');
		expect(catPlaylist('run-one')).toEqual(first);
		expect(catPlaylist('run-two')).not.toEqual(first);
		expect(new Set(first.map((clip) => clip.id)).size).toBe(10);
		expect(first.map((clip) => clip.id).sort()).toEqual(CAT_CLIPS.map((clip) => clip.id).sort());
	});
});
