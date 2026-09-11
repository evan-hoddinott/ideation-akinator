/** Stable randomized ranks biased along the vertical direction of travel. */
export function pixelRevealRanks(width: number, height: number, descending = false): Uint32Array {
	const count = width * height;
	const pixels = Array.from({ length: count }, (_, i) => {
		let h = Math.imul(i ^ 0x6d2b79f5, 0x45d9f3b);
		h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
		h = (h ^ (h >>> 16)) >>> 0;
		const y = Math.floor(i / width) / Math.max(1, height - 1);
		return { i, score: (descending ? y : 1 - y) * 0.62 + (h / 4294967296) * 0.38 };
	});
	pixels.sort((a, b) => a.score - b.score || a.i - b.i);
	const ranks = new Uint32Array(count);
	pixels.forEach((p, rank) => (ranks[p.i] = rank));
	return ranks;
}
export function revealedPixelCount(progress: number, total: number): number {
	if (progress <= 0) return 0;
	if (progress >= 1) return total;
	return Math.max(1, Math.floor((Math.max(0, progress - 0.002) / 0.998) * total));
}
