import { describe, expect, it } from 'vitest';
import {
	normalizeHttpsUrl,
	parseBroadResearchRequest,
	parseBroadResearchResult,
	parseResearchJobView
} from './research';

const result = {
	summary: 'A cited starting point.',
	findings: [
		{
			id: 'finding-1',
			category: 'competitors',
			title: 'An existing product',
			claim: 'The product publishes a route-planning feature.',
			interpretation: 'A new idea needs a narrower use case.',
			sourceIds: ['source-1']
		}
	],
	sources: [
		{
			id: 'source-1',
			url: 'https://example.com/product',
			title: 'Product page',
			publisher: 'example.com',
			publicationDate: null,
			retrievedAt: '2026-08-31T12:00:00.000Z',
			stage: 'broad',
			evidenceSummary: 'The page describes route planning.'
		}
	],
	gaps: [],
	retrievedAt: '2026-08-31T12:00:00.000Z',
	disclaimer: 'This is not exhaustive.'
};

describe('broad research contracts', () => {
	it('accepts bounded intake data and rejects an incomplete production budget', () => {
		const request = {
			projectId: 'project-1',
			topic: 'Campus transit',
			problems: ['Students miss buses when service updates are scattered.'],
			technologyTags: ['Open to anything'],
			industryTags: ['Higher Education'],
			innovationLevel: 3,
			prototypeBudgetUsd: 2_500,
			includeProductionPlanning: true,
			productionBudgetUsd: 25_000,
			constraints: { teamSize: 'Solo' }
		};

		expect(parseBroadResearchRequest(request)).toEqual(request);
		expect(parseBroadResearchRequest({ ...request, productionBudgetUsd: null })).toBeNull();
	});

	it('allows only credential-free HTTPS source URLs', () => {
		expect(normalizeHttpsUrl('https://example.com/page#section')).toBe('https://example.com/page');
		expect(normalizeHttpsUrl('http://example.com/page')).toBeNull();
		expect(normalizeHttpsUrl('javascript:alert(1)')).toBeNull();
		expect(normalizeHttpsUrl('https://user:pass@example.com/page')).toBeNull();
	});

	it('requires every finding citation to name a saved source', () => {
		expect(parseBroadResearchResult(result)).toEqual(result);
		expect(
			parseBroadResearchResult({
				...result,
				findings: [{ ...result.findings[0], sourceIds: ['missing-source'] }]
			})
		).toBeNull();
	});

	it('validates a recoverable job view before browser storage', () => {
		expect(
			parseResearchJobView({
				id: 'job-1',
				status: 'partial',
				progress: 'complete',
				createdAt: '2026-08-31T12:00:00.000Z',
				updatedAt: '2026-08-31T12:01:00.000Z',
				expiresAt: '2026-08-31T12:30:00.000Z',
				message: 'Useful results with gaps.',
				result
			})
		).not.toBeNull();
	});
});
