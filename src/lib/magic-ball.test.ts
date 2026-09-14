import { describe, it, expect } from 'vitest';
import { magicBallFrame } from './magic-ball';
describe('research-driven magic ball', () => {
	it('keeps asking again even when research takes minutes', () => {
		for (let t = 0; t < 300; t += 0.25)
			expect(['shake', 'read']).toContain(magicBallFrame(t, null).phase);
		expect(magicBallFrame(14, null).cycle).toBe(2);
	});
	it('only throws when a result arrives, then gives Purl time to chase', () => {
		expect(magicBallFrame(53, 53).phase).toBe('throw');
		expect(magicBallFrame(54.2, 53).phase).toBe('chase');
		expect(magicBallFrame(53, null).phase).not.toBe('throw');
	});
});
