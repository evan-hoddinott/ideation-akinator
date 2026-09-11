import { describe, it, expect } from 'vitest';
import { pixelRevealRanks, revealedPixelCount } from './pixel-gradient';
describe('pixel gradient', () => {
	it('starts with exactly one pixel and reaches every pixel without repeats', () => {
		const ranks = pixelRevealRanks(80, 50);
		expect(new Set(ranks).size).toBe(4000);
		expect(revealedPixelCount(0, 4000)).toBe(0);
		expect(revealedPixelCount(0.001, 4000)).toBe(1);
		expect(revealedPixelCount(1, 4000)).toBe(4000);
	});
	it('keeps reveal positions stable and a broad vertical density gradient', () => {
		const w = 80,
			h = 50,
			ranks = pixelRevealRanks(w, h);
		expect(ranks).toEqual(pixelRevealRanks(w, h));
		const rows = Array.from(
			{ length: 5 },
			(_, band) =>
				Array.from(ranks.slice(band * 10 * w, (band + 1) * 10 * w)).filter((r) => r < 2000).length
		);
		expect(rows[4]).toBeGreaterThan(rows[3]);
		expect(rows[3]).toBeGreaterThan(rows[2]);
		expect(rows[2]).toBeGreaterThan(rows[1]);
		expect(rows[1]).toBeGreaterThan(rows[0]);
		const half = new Set(
			Array.from(ranks.entries())
				.filter(([, r]) => r < 2000)
				.map(([i]) => i)
		);
		const later = new Set(
			Array.from(ranks.entries())
				.filter(([, r]) => r < 3000)
				.map(([i]) => i)
		);
		expect([...half].every((i) => later.has(i))).toBe(true);
	});
	it('reverses the spatial bias when traveling down', () => {
		const ranks = pixelRevealRanks(80, 50, true);
		expect([...ranks.slice(0, 800)].filter((r) => r < 2000).length).toBeGreaterThan(
			[...ranks.slice(3200)].filter((r) => r < 2000).length
		);
	});
});
