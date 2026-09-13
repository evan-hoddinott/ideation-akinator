import { describe, expect, it } from 'vitest';
import type { ScoreResult } from './score';
import { scoreRevealDuration, scoreRevealFrame } from './score-reveal';
const score: ScoreResult = {
	baseScore: 40,
	finalScore: 42,
	modifierPercent: 5,
	factors: [
		{ id: 'clarity', label: 'Problem clarity', points: 20, maximum: 20 },
		{ id: 'evidence', label: 'Evidence', points: 20, maximum: 20 }
	],
	modifiers: [{ id: 'PURL ACTUALLY HELPED', label: 'Cat assist', percent: 5 }],
	label: 'A project',
	comment: 'A wizard comment',
	absurdValuationUsd: 100,
	tokenTotal: 0,
	fakeInvoiceUsd: 4.2
};
describe('score reveal', () => {
	it('counts factors in order before applying modifiers', () => {
		const start = scoreRevealFrame(score, 0);
		expect(start.factorPoints).toEqual([0, 0]);
		expect(start.total).toBe(0);
		const first = scoreRevealFrame(score, 400);
		expect(first.factorPoints[0]).toBeGreaterThan(0);
		expect(first.factorPoints[0]).toBeLessThan(20);
		expect(first.factorPoints[1]).toBe(0);
		expect(first.modifierCount).toBe(0);
		const base = scoreRevealFrame(score, 1000);
		expect(base.factorPoints).toEqual([20, 20]);
		expect(base.total).toBe(40);
		expect(scoreRevealFrame(score, scoreRevealDuration(score))).toMatchObject({
			total: 42,
			finished: true,
			modifierCount: 1
		});
	});
	it('shows all final values immediately when skipped, even during the first row', () => {
		expect(scoreRevealFrame(score, 250, true)).toMatchObject({
			factorPoints: [20, 20],
			total: 42,
			finished: true,
			modifierCount: 1
		});
	});
	it('does not overshoot or reverse a positive total during frame delays', () => {
		let previous = 0;
		for (let ms = 0; ms <= scoreRevealDuration(score) + 1000; ms += 37) {
			const frame = scoreRevealFrame(score, ms);
			expect(frame.total).toBeGreaterThanOrEqual(previous);
			expect(frame.total).toBeLessThanOrEqual(score.finalScore);
			previous = frame.total;
		}
	});
	it('handles a penalty and a run without modifiers without hanging', () => {
		const penalty = {
			...score,
			finalScore: 39,
			modifierPercent: -2,
			modifiers: [{ id: 'LOCAL WIZARD ENJOYER' as const, label: 'Clicked ad', percent: -2 }]
		};
		expect(scoreRevealFrame(penalty, scoreRevealDuration(penalty))).toMatchObject({
			total: 39,
			finished: true
		});
		const plain = { ...score, modifiers: [], modifierPercent: 0, finalScore: 40 };
		expect(scoreRevealFrame(plain, scoreRevealDuration(plain))).toMatchObject({
			total: 40,
			finished: true,
			modifierCount: 0
		});
	});
});
