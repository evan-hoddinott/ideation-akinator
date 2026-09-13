import { describe, expect, it } from 'vitest';
import { durationDays, exceedsDeadline } from './deadline';

describe('explicit deadline checks', () => {
	it('uses the upper estimate against a relative deadline across day and week units', () => {
		expect(
			exceedsDeadline('6–8 weeks, including procurement', 'Working prototype within 6 weeks')
		).toBe(true);
		expect(exceedsDeadline('3 to 6 weeks', 'six-week deadline')).toBe(false);
		expect(exceedsDeadline('43 days', '6 weeks')).toBe(true);
		expect(durationDays('one month')).toBe(30);
	});
	it('leaves calendar dates and ambiguous multiple durations to the evidence assessment', () => {
		expect(durationDays('Before 2026-10-01')).toBeNull();
		expect(durationDays('2 weeks design plus 4 weeks implementation')).toBeNull();
		expect(exceedsDeadline('4 weeks', '')).toBe(false);
	});
});
