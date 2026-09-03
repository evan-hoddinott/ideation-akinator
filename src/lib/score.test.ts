import { describe, expect, it } from 'vitest';
import { calculateScore, parseScoreInput, type ScoreInput } from '$lib/score';

const input: ScoreInput = {
	projectId: 'project-1',
	projectName: 'Useful Thing',
	createdAt: new Date(0).toISOString(),
	completedAt: new Date(1).toISOString(),
	clarityLabel: 'Ready to summon',
	problemCount: 2,
	broadSourceCount: 5,
	broadGapCount: 1,
	focusedSourceCount: 4,
	focusedGapCount: 1,
	focusedVerdict: 'supported',
	competitorCount: 3,
	confirmedFeatureCount: 3,
	prototypeBudgetUsd: 2_000,
	prototypeMinimumUsd: 500,
	prototypeMaximumUsd: 1_500,
	technicalDifficulty: 'medium',
	riskCount: 3,
	answeredQuestions: 5,
	totalQuestions: 5,
	interviewEndedEarly: false,
	achievements: ['FORBIDDEN FLOPPY', 'PURL ACTUALLY HELPED'],
	tokenTotal: 12_345,
	demo: false
};

describe('run score', () => {
	it('calculates a bounded base before capped achievement modifiers', () => {
		const score = calculateScore(input);
		expect(score.baseScore).toBeLessThanOrEqual(100);
		expect(score.modifierPercent).toBe(8);
		expect(score.finalScore).toBe(Math.round(score.baseScore * 1.08));
		expect(score.factors).toHaveLength(6);
	});

	it('rejects impossible or unknown score inputs', () => {
		expect(parseScoreInput(input)).toEqual(input);
		expect(parseScoreInput({ ...input, answeredQuestions: 6 })).toBeNull();
		expect(parseScoreInput({ ...input, achievements: ['FORGED'] })).toBeNull();
	});
});
