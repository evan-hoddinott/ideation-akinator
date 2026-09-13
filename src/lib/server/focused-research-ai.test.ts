import { createDemoPortfolio, createDemoProject, createDemoResearchResult } from '$lib/demo';
import type { FocusedResearchRequest } from '$lib/finalization';
import { createFeatureWorkshop } from '$lib/feature-workshop';
import { describe, expect, it } from 'vitest';
import {
	buildFocusedResearchParameters,
	InvalidFocusedResearchResponseError,
	parseCompletedFocusedResearch
} from './focused-research-ai';
import type { ResearchProviderSnapshot } from './research-ai';

const sourceUrl = 'https://example.com/configured-product';

describe('focused research AI orchestration', () => {
	it('uses background web search with a separate strict contract', () => {
		const parameters = buildFocusedResearchParameters('test-model', request());
		expect(parameters).toMatchObject({
			model: 'test-model',
			background: true,
			store: false,
			max_tool_calls: 16,
			tool_choice: 'required',
			tools: [{ type: 'web_search', external_web_access: true }],
			text: { format: { name: 'focused_configured_product_research', strict: true } }
		});
		expect(parameters.instructions).toContain('exact confirmed features');
	});

	it('binds every configured feature and competitor row to consulted sources', () => {
		const input = request();
		const parsed = parseCompletedFocusedResearch(
			snapshot(output(input)),
			input,
			new Date('2026-09-01T12:00:00Z')
		);
		expect(parsed.result.featureOverlap).toHaveLength(input.includedFeatures.length);
		expect(parsed.result.featureOverlap[0].sourceIds).toEqual(['focused-source-1']);
		expect(parsed.result.competitorMatrix[0].sourceIds).toEqual(['focused-source-1']);
		expect(parsed.result.sources[0]).toMatchObject({ url: sourceUrl, stage: 'focused' });
	});

	it('binds blocking contradictions to consulted evidence and rejects an omitted assessment', () => {
		const input = request();
		const raw = output(input);
		raw.materialConflicts = [
			{
				kind: 'scope',
				description: 'The required live feed is unavailable.',
				sourceUrls: [sourceUrl]
			}
		];
		const parsed = parseCompletedFocusedResearch(snapshot(raw), input);
		expect(parsed.result.materialConflicts?.[0]).toMatchObject({
			kind: 'scope',
			sourceIds: ['focused-source-1']
		});
		raw.materialConflicts[0].sourceUrls = ['https://invented.example/claim'];
		expect(() => parseCompletedFocusedResearch(snapshot(raw), input)).toThrow(
			InvalidFocusedResearchResponseError
		);
		expect(() =>
			parseCompletedFocusedResearch(snapshot({ ...raw, materialConflicts: undefined }), input)
		).toThrow(InvalidFocusedResearchResponseError);
	});

	it('rejects an overlap check that omits a confirmed feature', () => {
		const input = request();
		const raw = output(input);
		raw.featureOverlap = raw.featureOverlap.slice(0, 1);
		expect(() => parseCompletedFocusedResearch(snapshot(raw), input)).toThrow(
			InvalidFocusedResearchResponseError
		);
	});

	it('rejects citations that the web tool did not return', () => {
		const input = request();
		expect(() =>
			parseCompletedFocusedResearch(
				snapshot(output(input), 'https://different.example/page'),
				input
			)
		).toThrow(InvalidFocusedResearchResponseError);
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
		summary: 'The configured campus notice product remains plausible.',
		verdict: 'caution',
		verdictRationale: 'Data access needs validation.',
		findings: [
			{
				category: 'direct-competitors',
				title: 'A competitor exists',
				claim: 'The product page lists transit alerts.',
				interpretation: 'The campus workflow needs to differ.',
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
				name: 'Existing transit tool',
				type: 'direct',
				overlappingFeatures: [input.includedFeatures[0].name],
				missingFeatures: input.includedFeatures.slice(1).map((feature) => feature.name),
				comparison: 'It covers general alerts but not the full configured workflow.',
				sourceUrls: [sourceUrl]
			}
		],
		materialConflicts: [] as Array<{ kind: string; description: string; sourceUrls: string[] }>,
		recommendations: ['Validate the campus data feed.'],
		sourceDetails: [
			{
				url: sourceUrl,
				title: 'Configured product',
				publisher: 'Example',
				publicationDate: null,
				evidenceSummary: 'The page lists transit alert features.'
			}
		],
		gaps: []
	};
}

function snapshot(raw: unknown, consultedUrl = sourceUrl): ResearchProviderSnapshot {
	return {
		id: 'response-1',
		status: 'completed',
		outputText: JSON.stringify(raw),
		consultedSources: [{ url: consultedUrl, title: 'Configured product' }],
		errorCode: null
	};
}
