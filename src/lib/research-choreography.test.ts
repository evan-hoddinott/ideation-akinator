import { describe, expect, it } from 'vitest';
import { advanceResearchClock, researchClock, researchFrame } from './research-choreography';

describe('research choreography clock', () => {
	it('waits for the entrance and a typing beat even when research is already complete', () => {
		const clock = advanceResearchClock(researchClock(), 0.01, true, false);
		expect(clock.handoffAt).toBe(5.9);
		expect(researchFrame({ ...clock, elapsed: 5.4 }, false).phase).toBe('researching');
		expect(researchFrame({ ...clock, elapsed: 5.95 }, false).phase).toBe('noticed');
	});
	it('preserves the exact phase and progress when paused or hidden, including late API completion', () => {
		const clock = { elapsed: 6, handoffAt: null };
		expect(advanceResearchClock(clock, 30, true, false, true)).toBe(clock);
		const resumed = advanceResearchClock(clock, 0.02, true, false);
		expect(researchFrame(resumed, false)).toMatchObject({ phase: 'noticed', phaseElapsed: 0 });
		const printing = { elapsed: 8, handoffAt: 6 };
		expect(advanceResearchClock(printing, 20, true, false, true)).toBe(printing);
	});
	it('keeps paper feeding and pickup separate before exposing the readable note', () => {
		expect(researchFrame({ elapsed: 9.9, handoffAt: 6 }, false)).toMatchObject({
			phase: 'printing',
			finished: false
		});
		expect(researchFrame({ elapsed: 10.5, handoffAt: 6 }, false).phase).toBe('lifting');
		expect(researchFrame({ elapsed: 13.8, handoffAt: 6 }, false).phase).toBe('lifting');
		expect(researchFrame({ elapsed: 14, handoffAt: 6 }, false).phase).toBe('presenting');
	});
	it('finishes final printing only after the saved plan has been presented', () => {
		const clock = advanceResearchClock(researchClock(), 0, true, true);
		expect(researchFrame(clock, true).phase).toBe('noticed');
		expect(researchFrame({ ...clock, elapsed: 9.4 }, true).finished).toBe(false);
		expect(researchFrame({ ...clock, elapsed: 9.6 }, true).finished).toBe(true);
		expect(researchFrame({ ...clock, elapsed: 20 }, false).finished).toBe(false);
	});
	it('does not move backward on an early first frame or skip phases after a stalled frame', () => {
		expect(advanceResearchClock(researchClock(), -0.1, false, false).elapsed).toBe(0);
		expect(advanceResearchClock(researchClock(), 30, false, false).elapsed).toBe(0.05);
	});
});
