import { describe, expect, it } from 'vitest';
import {
	createInterview,
	makeInterviewAnswer,
	parseNumericAnswerDraft,
	parseInterviewNextRequest,
	parseInterviewQuestion,
	parseProjectInterview,
	type InterviewQuestion
} from './interview';

function question(overrides: Partial<InterviewQuestion> = {}): InterviewQuestion {
	return {
		id: 'audience-priority',
		prompt: 'Which group should the first prototype serve?',
		whyItMatters: 'A primary audience changes the workflow and validation plan.',
		type: 'single-choice',
		options: [
			{ id: 'students', label: 'Students' },
			{ id: 'staff', label: 'Campus staff' }
		],
		unit: null,
		minimum: null,
		maximum: null,
		...overrides
	};
}

describe('adaptive interview contracts', () => {
	it('accepts numeric input values after Svelte coerces them from strings to numbers', () => {
		expect(parseNumericAnswerDraft(2)).toBe(2);
		expect(parseNumericAnswerDraft(' 2.5 ')).toBe(2.5);
		expect(parseNumericAnswerDraft('')).toBeNull();
		expect(parseNumericAnswerDraft('not-a-number')).toBeNull();
	});

	it.each([
		question(),
		question({ id: 'details', type: 'text', options: [] }),
		question({ id: 'channels', type: 'multiple-choice' }),
		question({ id: 'frequency', type: 'number', options: [], unit: 'times per week', minimum: 0 }),
		question({ id: 'spend', type: 'budget', options: [], unit: 'USD', minimum: 0 }),
		question({ id: 'offline', type: 'yes-no', options: [] })
	])('accepts the supported question shapes', (candidate) => {
		expect(parseInterviewQuestion(candidate)).toEqual(candidate);
	});

	it('rejects choice questions without useful options and duplicate option ids', () => {
		expect(parseInterviewQuestion(question({ options: [] }))).toBeNull();
		expect(
			parseInterviewQuestion(
				question({
					options: [
						{ id: 'same', label: 'First' },
						{ id: 'same', label: 'Second' }
					]
				})
			)
		).toBeNull();
		expect(
			parseInterviewQuestion(question({ type: 'yes-no', options: [], unit: 'days' }))
		).toBeNull();
	});

	it('validates answer values against the question type while preserving skip states', () => {
		const choice = question();
		expect(makeInterviewAnswer(choice, 'answered', 'students')).toEqual({
			questionId: choice.id,
			status: 'answered',
			value: 'students'
		});
		expect(makeInterviewAnswer(choice, 'answered', 'invented')).toBeNull();
		expect(makeInterviewAnswer(choice, 'unknown', null)).toEqual({
			questionId: choice.id,
			status: 'unknown',
			value: null
		});

		const budget = question({
			id: 'budget',
			type: 'budget',
			options: [],
			unit: 'USD',
			minimum: 100,
			maximum: 1_000
		});
		expect(makeInterviewAnswer(budget, 'answered', 500)?.value).toBe(500);
		expect(makeInterviewAnswer(budget, 'answered', 50)).toBeNull();
	});

	it('preserves a typed alternative as answer data for choice questions', () => {
		const choice = question();
		expect(makeInterviewAnswer(choice, 'answered', null, 'Volunteer coordinators')).toEqual({
			questionId: choice.id,
			status: 'answered',
			value: null,
			customText: 'Volunteer coordinators'
		});

		const multiple = question({ type: 'multiple-choice' });
		expect(makeInterviewAnswer(multiple, 'answered', ['students'], 'Recent graduates')).toEqual({
			questionId: multiple.id,
			status: 'answered',
			value: ['students'],
			customText: 'Recent graduates'
		});
	});

	it('round-trips a valid active interview and rejects duplicate questions', () => {
		const active = {
			...createInterview(),
			status: 'active' as const,
			questions: [question()],
			answers: [{ questionId: 'audience-priority', status: 'skipped' as const, value: null }]
		};
		expect(parseProjectInterview(active)).toEqual(active);
		expect(parseProjectInterview({ ...active, questions: [question(), question()] })).toBeNull();
	});

	it('bounds and validates the full context sent to the server', () => {
		const parsed = parseInterviewNextRequest({
			projectId: 'project-1',
			topic: 'Campus transit',
			problems: ['Students miss service changes.'],
			technologyTags: ['Open to anything'],
			industryTags: ['Higher Education'],
			innovationLevel: 3,
			prototypeBudgetUsd: 1_000,
			includeProductionPlanning: false,
			productionBudgetUsd: null,
			constraints: { teamSize: 'Solo' },
			research: {
				summary: 'Existing tools fragment alerts.',
				findings: [
					{ title: 'Several tools exist', claim: 'They split information.', interpretation: null }
				],
				gaps: [{ category: 'customer-frustrations', reason: 'No local interviews yet.' }]
			},
			questions: [question()],
			answers: [{ questionId: 'audience-priority', status: 'answered', value: 'students' }]
		});

		expect(parsed?.answers[0].status).toBe('answered');
		expect(
			parseInterviewNextRequest({
				...parsed,
				questions: Array.from({ length: 13 }, (_, index) => question({ id: `question-${index}` }))
			})
		).toBeNull();
	});
});
