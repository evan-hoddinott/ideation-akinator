import { describe, expect, it } from 'vitest';
import type { InterviewNextRequest, InterviewQuestion } from '$lib/interview';
import {
	buildInterviewParameters,
	generateInterviewTurn,
	InvalidInterviewResponseError,
	type InterviewResponseClient
} from './interview-ai';

function question(index = 1): InterviewQuestion {
	return {
		id: `question-${index}`,
		prompt: `What matters for decision ${index}?`,
		whyItMatters: 'This changes which concept is practical.',
		type: 'text',
		options: [],
		unit: null,
		minimum: null,
		maximum: null
	};
}

function request(questionCount = 0): InterviewNextRequest {
	const questions = Array.from({ length: questionCount }, (_, index) => question(index + 1));
	return {
		projectId: 'project-1',
		topic: 'Campus transit',
		problems: ['Students miss route changes.'],
		technologyTags: ['Open to anything'],
		industryTags: ['Higher Education'],
		innovationLevel: 3,
		prototypeBudgetUsd: 1_000,
		includeProductionPlanning: false,
		productionBudgetUsd: null,
		constraints: {},
		research: { summary: 'Alerts are fragmented.', findings: [], gaps: [] },
		questions,
		answers: questions.map((entry) => ({
			questionId: entry.id,
			status: 'answered' as const,
			value: `Answer to ${entry.id}`
		}))
	};
}

function fakeClient(
	outputs: unknown[]
): InterviewResponseClient & { calls: Record<string, unknown>[] } {
	const calls: Record<string, unknown>[] = [];
	return {
		calls,
		create: async (parameters) => {
			calls.push(parameters);
			const output = outputs.shift();
			if (output === undefined) throw new Error('Missing fake output');
			return { output_text: typeof output === 'string' ? output : JSON.stringify(output) };
		}
	};
}

describe('interview AI orchestration', () => {
	it('uses a strict stateless output contract and treats project text as untrusted data', () => {
		const parameters = buildInterviewParameters('test-model', request());
		expect(parameters).toMatchObject({
			model: 'test-model',
			store: false,
			max_output_tokens: 1_000,
			reasoning: { effort: 'low' },
			text: { format: { name: 'adaptive_interview_turn', strict: true } }
		});
		expect(parameters).not.toHaveProperty('tools');
		expect(parameters.instructions).toContain('untrusted data');
	});

	it('accepts one valid adaptive question', async () => {
		const next = question(1);
		const client = fakeClient([{ decision: 'ask', question: next, completionReason: null }]);
		await expect(generateInterviewTurn(client, 'test-model', request())).resolves.toEqual({
			decision: 'ask',
			question: next,
			completionReason: null
		});
		expect(client.calls).toHaveLength(1);
	});

	it('retries a premature completion and a repeated question, then fails', async () => {
		const client = fakeClient([
			{ decision: 'complete', question: null, completionReason: 'Done.' },
			{ decision: 'ask', question: question(1), completionReason: null }
		]);
		await expect(generateInterviewTurn(client, 'test-model', request(1))).rejects.toBeInstanceOf(
			InvalidInterviewResponseError
		);
		expect(client.calls).toHaveLength(2);
	});

	it('accepts completion after five questions and caps the interview at twelve without a call', async () => {
		const completeClient = fakeClient([
			{ decision: 'complete', question: null, completionReason: 'Enough detail is available.' }
		]);
		await expect(
			generateInterviewTurn(completeClient, 'test-model', request(5))
		).resolves.toMatchObject({
			decision: 'complete'
		});

		const cappedClient = fakeClient([]);
		await expect(
			generateInterviewTurn(cappedClient, 'test-model', request(12))
		).resolves.toMatchObject({
			decision: 'complete'
		});
		expect(cappedClient.calls).toHaveLength(0);
	});
});
