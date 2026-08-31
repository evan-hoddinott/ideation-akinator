import { describe, expect, it } from 'vitest';
import {
	buildResearchParameters,
	InvalidResearchResponseError,
	parseCompletedResearch,
	toProviderSnapshot,
	type ResearchProviderSnapshot
} from './research-ai';

function snapshot(
	output: unknown,
	consulted = ['https://example.com/product']
): ResearchProviderSnapshot {
	return {
		id: 'response-1',
		status: 'completed',
		outputText: JSON.stringify(output),
		consultedSources: consulted.map((url) => ({ url, title: 'Product page' })),
		errorCode: null
	};
}

const modelOutput = {
	summary: 'Existing route tools prove demand, but scattered campus updates remain a gap.',
	findings: [
		{
			category: 'competitors',
			title: 'A route-planning product exists',
			claim: 'The product page describes route planning.',
			interpretation: 'A campus tool should focus on service disruption.',
			sourceUrls: ['https://example.com/product']
		}
	],
	sourceDetails: [
		{
			url: 'https://example.com/product',
			title: 'Product page',
			publisher: 'Example',
			publicationDate: null,
			evidenceSummary: 'The page lists route-planning capabilities.'
		}
	],
	gaps: [{ category: 'prior-art', reason: 'No reliable patent-like prior art appeared.' }]
};

describe('research AI orchestration', () => {
	it('uses background web search with a strict output contract and bounded tools', () => {
		const parameters = buildResearchParameters('test-model', {
			projectId: 'project-1',
			topic: 'Campus transit',
			problems: ['Students miss route updates.'],
			technologyTags: ['Open to anything'],
			industryTags: ['Higher Education'],
			innovationLevel: 3,
			prototypeBudgetUsd: 1_000,
			includeProductionPlanning: false,
			productionBudgetUsd: null,
			constraints: {}
		});

		expect(parameters).toMatchObject({
			model: 'test-model',
			background: true,
			store: false,
			max_tool_calls: 12,
			tool_choice: 'required',
			include: ['web_search_call.action.sources'],
			tools: [{ type: 'web_search', external_web_access: true }],
			text: { format: { name: 'broad_product_research', strict: true } }
		});
		expect(parameters.instructions).toContain('untrusted evidence');
	});

	it('keeps only findings tied to URLs returned by web search', () => {
		const parsed = parseCompletedResearch(snapshot(modelOutput), new Date('2026-08-31T12:00:00Z'));

		expect(parsed.partial).toBe(true);
		expect(parsed.result.findings[0]).toMatchObject({
			claim: 'The product page describes route planning.',
			interpretation: 'A campus tool should focus on service disruption.',
			sourceIds: ['source-1']
		});
		expect(parsed.result.sources[0]).toMatchObject({
			url: 'https://example.com/product',
			publisher: 'Example',
			stage: 'broad'
		});
		expect(parsed.result.gaps).toHaveLength(8);
	});

	it('rejects a model-cited URL that web search did not return', () => {
		expect(() =>
			parseCompletedResearch(
				snapshot(modelOutput, ['https://different.example/source']),
				new Date('2026-08-31T12:00:00Z')
			)
		).toThrow(InvalidResearchResponseError);
	});

	it('extracts both consulted source URLs and citation titles from a provider response', () => {
		const parsed = toProviderSnapshot({
			id: 'response-1',
			status: 'completed',
			output_text: '{}',
			error: null,
			output: [
				{
					type: 'web_search_call',
					action: {
						type: 'search',
						sources: [{ type: 'url', url: 'https://example.com/product' }]
					}
				},
				{
					type: 'message',
					content: [
						{
							type: 'output_text',
							annotations: [
								{
									type: 'url_citation',
									url: 'https://example.com/product',
									title: 'Exact product title'
								}
							]
						}
					]
				}
			]
		});

		expect(parsed.consultedSources).toEqual([
			{ url: 'https://example.com/product', title: 'Exact product title' }
		]);
	});
});
