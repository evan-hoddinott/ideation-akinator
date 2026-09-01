import { describe, expect, it } from 'vitest';
import { parseConceptPortfolio } from './concepts';
import {
	createDemoPortfolio,
	createDemoProject,
	createDemoResearchJob,
	createDemoResearchResult,
	DEMO_INTERVIEW_QUESTIONS,
	demoIntakeInsights,
	isDemoProject,
	nextDemoInterview
} from './demo';
import { parseIntakeInsights } from './intake-insights';
import { createInterview } from './interview';
import { parseBroadResearchResult, parseResearchJobView } from './research';

describe('token-free visual demo', () => {
	it('starts with a complete editable intake and demo identity', () => {
		const project = createDemoProject(new Date('2026-09-01T10:00:00Z'));
		expect(isDemoProject(project)).toBe(true);
		expect(project.stage).toBe('problem');
		expect(project.problemInput.cards).toHaveLength(2);
		expect(project.preferences.prototypeBudgetUsd).toBe(1_500);
	});

	it('keeps every canned AI boundary inside the production parsers', () => {
		expect(parseIntakeInsights(demoIntakeInsights())).not.toBeNull();
		expect(parseBroadResearchResult(createDemoResearchResult())).not.toBeNull();
		expect(parseResearchJobView(createDemoResearchJob('running'))).not.toBeNull();
		expect(parseResearchJobView(createDemoResearchJob('completed'))).not.toBeNull();
		expect(parseConceptPortfolio(createDemoPortfolio())).not.toBeNull();
	});

	it('asks three local questions and then completes', () => {
		const interview = createInterview();
		const first = nextDemoInterview(interview);
		expect(first.decision).toBe('ask');

		interview.questions = first.decision === 'ask' ? [first.question] : [];
		expect(nextDemoInterview(interview).decision).toBe('ask');
		interview.questions = [...DEMO_INTERVIEW_QUESTIONS];
		expect(nextDemoInterview(interview)).toMatchObject({ decision: 'complete', question: null });
	});
});
