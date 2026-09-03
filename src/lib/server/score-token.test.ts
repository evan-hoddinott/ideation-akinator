import { describe, expect, it } from 'vitest';
import { createScoreToken, verifyScoreToken } from '$lib/server/score-token';
import type { ScoreInput } from '$lib/score';

const input: ScoreInput = {
	projectId: 'p1',
	projectName: 'A plan',
	createdAt: new Date(0).toISOString(),
	completedAt: new Date(1).toISOString(),
	clarityLabel: 'Strong reading',
	problemCount: 1,
	broadSourceCount: 3,
	broadGapCount: 1,
	focusedSourceCount: 3,
	focusedGapCount: 0,
	focusedVerdict: 'caution',
	competitorCount: 2,
	confirmedFeatureCount: 2,
	prototypeBudgetUsd: 2_000,
	prototypeMinimumUsd: 500,
	prototypeMaximumUsd: 1_200,
	technicalDifficulty: 'medium',
	riskCount: 2,
	answeredQuestions: 3,
	totalQuestions: 4,
	interviewEndedEarly: false,
	achievements: [],
	tokenTotal: 200,
	demo: false
};

describe('score completion token', () => {
	it('binds a validated run to the server-calculated score', () => {
		const secret = 's'.repeat(40);
		const token = createScoreToken(input, secret, 1_000);
		const verified = verifyScoreToken(token, secret, 2_000);
		expect(verified?.input).toEqual(input);
		expect(verified?.runId).toBe('p1:1970-01-01T00:00:00.001Z');
		expect(verifyScoreToken(`${token}x`, secret, 2_000)).toBeNull();
		expect(verifyScoreToken(token, secret, 90_000_000)).toBeNull();
	});
});
