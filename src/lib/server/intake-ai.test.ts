import { describe, expect, it } from 'vitest';
import {
	generateIntakeInsights,
	InvalidModelResponseError,
	type IntakeResponseClient
} from './intake-ai';

function fakeClient(
	outputs: string[]
): IntakeResponseClient & { calls: Record<string, unknown>[] } {
	const calls: Record<string, unknown>[] = [];
	return {
		calls,
		create: async (parameters) => {
			calls.push(parameters);
			const output = outputs.shift();
			if (output === undefined) throw new Error('Missing fake output');
			return { output_text: output };
		}
	};
}

describe('intake AI orchestration', () => {
	it('uses separate strict contracts and combines their validated output', async () => {
		const client = fakeClient([
			JSON.stringify({
				clarityLabel: 'The vision forms',
				clarityReasons: ['The affected students and transit context are named.'],
				topicCoherenceWarning: null
			}),
			JSON.stringify({ suggestedIndustryTags: ['Higher Education', 'Transportation'] })
		]);

		await expect(
			generateIntakeInsights(client, 'test-model', {
				topic: 'Campus transportation',
				problems: ['Students miss the last bus when route updates are scattered.']
			})
		).resolves.toEqual({
			clarityLabel: 'The vision forms',
			clarityReasons: ['The affected students and transit context are named.'],
			topicCoherenceWarning: null,
			suggestedIndustryTags: ['Higher Education', 'Transportation']
		});

		expect(client.calls).toHaveLength(2);
		expect(client.calls.every((call) => call.store === false)).toBe(true);
		expect(
			client.calls.map(
				(call) => (call.text as { format: { name: string; strict: boolean } }).format.name
			)
		).toEqual(['problem_clarity', 'industry_suggestions']);
		expect(
			client.calls.every(
				(call) => (call.text as { format: { strict: boolean } }).format.strict === true
			)
		).toBe(true);
	});

	it('retries one malformed result and then accepts a valid contract', async () => {
		const client = fakeClient([
			'{not-json',
			JSON.stringify({ suggestedIndustryTags: ['Education'] }),
			JSON.stringify({
				clarityLabel: 'Faint signal',
				clarityReasons: ['The affected person is not yet identifiable.'],
				topicCoherenceWarning: null
			})
		]);

		await expect(
			generateIntakeInsights(client, 'test-model', { topic: '', problems: ['Transit is bad.'] })
		).resolves.toMatchObject({ clarityLabel: 'Faint signal' });
		expect(client.calls).toHaveLength(3);
	});

	it('fails after the bounded malformed-output retry', async () => {
		const client = fakeClient([
			JSON.stringify({ clarityLabel: 'Unknown', clarityReasons: [], topicCoherenceWarning: null }),
			JSON.stringify({ suggestedIndustryTags: [] }),
			JSON.stringify({
				clarityLabel: 'Still unknown',
				clarityReasons: [],
				topicCoherenceWarning: null
			})
		]);

		await expect(
			generateIntakeInsights(client, 'test-model', { topic: '', problems: ['Transit is bad.'] })
		).rejects.toBeInstanceOf(InvalidModelResponseError);
	});
});
