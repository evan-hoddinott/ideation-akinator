import type { BroadResearchRequest } from '$lib/research';
import { describe, expect, it } from 'vitest';
import type { ResearchProvider, ResearchProviderSnapshot } from './research-ai';
import { ResearchJobManager } from './research-jobs';

const input: BroadResearchRequest = {
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
};

const validOutput = {
	summary: 'A cited starting point for the problem.',
	findings: [
		{
			category: 'competitors',
			title: 'An existing route tool',
			claim: 'The product page lists route planning.',
			interpretation: null,
			sourceUrls: ['https://example.com/product']
		}
	],
	sourceDetails: [
		{
			url: 'https://example.com/product',
			title: 'Product page',
			publisher: 'Example',
			publicationDate: null,
			evidenceSummary: 'The page lists route planning.'
		}
	],
	gaps: []
};

function completed(output: unknown): ResearchProviderSnapshot {
	return {
		id: crypto.randomUUID(),
		status: 'completed',
		outputText: JSON.stringify(output),
		consultedSources: [{ url: 'https://example.com/product', title: 'Product page' }],
		errorCode: null
	};
}

function provider(outputs: ResearchProviderSnapshot[]): ResearchProvider & {
	starts: number;
	cancels: string[];
} {
	return {
		starts: 0,
		cancels: [],
		async start() {
			this.starts += 1;
			const output = outputs.shift();
			if (!output) throw new Error('Missing fake response');
			return output;
		},
		async retrieve() {
			const output = outputs.shift();
			if (!output) throw new Error('Missing fake response');
			return output;
		},
		async cancel(responseId) {
			this.cancels.push(responseId);
		}
	};
}

async function waitFor(check: () => boolean): Promise<void> {
	for (let attempt = 0; attempt < 50; attempt += 1) {
		if (check()) return;
		await new Promise((resolve) => setTimeout(resolve, 1));
	}
	throw new Error('Timed out waiting for job state');
}

describe('research job manager', () => {
	it('finishes a validated job and preserves named research gaps', async () => {
		const jobs = new ResearchJobManager({ idFactory: () => 'job-1' });
		const fake = provider([completed(validOutput)]);
		jobs.start(input, 'signature-1', fake);
		await waitFor(() => jobs.get('job-1')?.status === 'partial');

		expect(jobs.get('job-1')).toMatchObject({
			status: 'partial',
			progress: 'complete',
			result: { findings: [{ sourceIds: ['source-1'] }] }
		});
	});

	it('reuses the same active project request instead of creating duplicate work', () => {
		const jobs = new ResearchJobManager({
			idFactory: () => 'job-1',
			sleep: () => new Promise(() => undefined)
		});
		const fake = provider([
			{
				id: 'response-1',
				status: 'in_progress',
				outputText: '',
				consultedSources: [],
				errorCode: null
			}
		]);

		const first = jobs.start(input, 'same-signature', fake);
		const second = jobs.start(input, 'same-signature', fake);
		expect(first.reused).toBe(false);
		expect(second).toMatchObject({ reused: true, job: { id: 'job-1' } });
	});

	it('retries malformed structured output once and then succeeds', async () => {
		const jobs = new ResearchJobManager({ idFactory: () => 'job-1' });
		const fake = provider([completed({ nope: true }), completed(validOutput)]);
		jobs.start(input, 'signature-1', fake);
		await waitFor(() => jobs.get('job-1')?.status === 'partial');
		expect(fake.starts).toBe(2);
	});

	it('cancels the provider response and keeps the local job terminal', async () => {
		const jobs = new ResearchJobManager({
			idFactory: () => 'job-1',
			sleep: () => new Promise(() => undefined)
		});
		const fake = provider([
			{
				id: 'response-1',
				status: 'in_progress',
				outputText: '',
				consultedSources: [],
				errorCode: null
			}
		]);
		jobs.start(input, 'signature-1', fake);
		await waitFor(() => jobs.get('job-1')?.status === 'running');
		await jobs.cancel('job-1');

		expect(jobs.get('job-1')?.status).toBe('cancelled');
		expect(fake.cancels).toEqual(['response-1']);
	});

	it('forgets expired jobs so a refreshed browser can offer a clean retry', async () => {
		let now = Date.parse('2026-08-31T12:00:00Z');
		const jobs = new ResearchJobManager({
			now: () => now,
			retentionMs: 1_000,
			idFactory: () => 'job-1'
		});
		jobs.start(input, 'signature-1', provider([completed(validOutput)]));
		await waitFor(() => jobs.get('job-1')?.status === 'partial');
		now += 1_001;
		expect(jobs.get('job-1')).toBeNull();
	});
});
