import { createDemoPortfolio, createDemoProject, createDemoResearchResult } from '$lib/demo';
import type { FocusedResearchRequest } from '$lib/finalization';
import { createFeatureWorkshop } from '$lib/feature-workshop';
import { describe, expect, it } from 'vitest';
import type { FocusedResearchProvider } from './focused-research-ai';
import type { ResearchProviderSnapshot } from './research-ai';
import { FocusedResearchJobManager } from './focused-research-jobs';

const sourceUrl = 'https://example.com/configured-product';

describe('focused research job manager', () => {
	it('finishes a validated configured-project job', async () => {
		const input = request();
		const jobs = new FocusedResearchJobManager({ idFactory: () => 'focused-job-1' });
		jobs.start(input, 'signature-1', provider([completed(output(input))]));
		await waitFor(() => jobs.get('focused-job-1')?.status === 'partial');
		expect(jobs.get('focused-job-1')).toMatchObject({
			progress: 'complete',
			result: { verdict: 'caution' }
		});
		expect(jobs.get('focused-job-1')?.result?.featureOverlap[0].sourceIds).toEqual([
			'focused-source-1'
		]);
	});

	it('retries malformed cited output once', async () => {
		const input = request();
		const fake = provider([completed({ nope: true }), completed(output(input))]);
		const jobs = new FocusedResearchJobManager({ idFactory: () => 'focused-job-1' });
		jobs.start(input, 'signature-1', fake);
		await waitFor(() => jobs.get('focused-job-1')?.status === 'partial');
		expect(fake.starts).toBe(2);
	});

	it('cancels the provider response without losing the selected project job record', async () => {
		const fake = provider([
			{
				id: 'response-1',
				status: 'in_progress',
				outputText: '',
				consultedSources: [],
				errorCode: null
			}
		]);
		const jobs = new FocusedResearchJobManager({
			idFactory: () => 'focused-job-1',
			sleep: () => new Promise(() => undefined)
		});
		jobs.start(request(), 'signature-1', fake);
		await waitFor(() => jobs.get('focused-job-1')?.status === 'running');
		await jobs.cancel('focused-job-1');
		expect(jobs.get('focused-job-1')?.status).toBe('cancelled');
		expect(fake.cancels).toEqual(['response-1']);
	});
});

function request(): FocusedResearchRequest {
	const project = createDemoProject();
	const portfolio = createDemoPortfolio();
	const concept = portfolio.concepts[0];
	const features = createFeatureWorkshop(portfolio).configurations[0].features.filter(
		(feature) => feature.included
	);
	return {
		projectId: project.id,
		topic: project.problemInput.topic,
		problems: project.problemInput.cards.map((card) => card.text),
		selectedConcept: {
			id: concept.id,
			name: concept.name,
			pitch: concept.pitch,
			description: concept.description,
			targetUser: concept.targetUser,
			distinctApproach: concept.distinctApproach,
			prototypeBudget: concept.prototypeBudget,
			productionBudget: concept.productionBudget,
			prototypeTimeline: concept.prototypeTimeline
		},
		includedFeatures: features.map((feature) => ({
			id: feature.id,
			name: feature.name,
			description: feature.description,
			tier: feature.tier,
			dependencies: feature.dependencies
		})),
		constraints: { ...project.preferences.constraints },
		prototypeBudgetUsd: 1_500,
		includeProductionPlanning: true,
		productionBudgetUsd: 12_000,
		broadResearch: createDemoResearchResult()
	};
}

function output(input: FocusedResearchRequest) {
	return {
		summary: 'The configured product remains plausible.',
		verdict: 'caution',
		verdictRationale: 'Data access needs validation.',
		findings: [
			{
				category: 'direct-competitors',
				title: 'A competitor exists',
				claim: 'The product lists alerts.',
				interpretation: null,
				sourceUrls: [sourceUrl]
			}
		],
		featureOverlap: input.includedFeatures.map((feature) => ({
			featureId: feature.id,
			status: 'partial',
			explanation: 'The capability appears in part.',
			sourceUrls: [sourceUrl]
		})),
		competitorMatrix: [
			{
				name: 'Transit tool',
				type: 'direct',
				overlappingFeatures: [input.includedFeatures[0].name],
				missingFeatures: [],
				comparison: 'It lacks the campus workflow.',
				sourceUrls: [sourceUrl]
			}
		],
		recommendations: ['Validate data access.'],
		sourceDetails: [
			{
				url: sourceUrl,
				title: 'Product',
				publisher: 'Example',
				publicationDate: null,
				evidenceSummary: 'The page lists alerts.'
			}
		],
		gaps: []
	};
}

function completed(raw: unknown): ResearchProviderSnapshot {
	return {
		id: crypto.randomUUID(),
		status: 'completed',
		outputText: JSON.stringify(raw),
		consultedSources: [{ url: sourceUrl, title: 'Product' }],
		errorCode: null
	};
}

function provider(
	outputs: ResearchProviderSnapshot[]
): FocusedResearchProvider & { starts: number; cancels: string[] } {
	return {
		starts: 0,
		cancels: [],
		async start() {
			this.starts += 1;
			const next = outputs.shift();
			if (!next) throw new Error('Missing fake response');
			return next;
		},
		async retrieve() {
			const next = outputs.shift();
			if (!next) throw new Error('Missing fake response');
			return next;
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
	throw new Error('Timed out waiting for focused research job');
}
