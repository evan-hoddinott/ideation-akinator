import { describe, expect, it, vi } from 'vitest';
import {
	COMPARISON_DIMENSIONS,
	parseConceptGenerationRequest,
	parseConceptGenerationResult,
	type ConceptGenerationRequest,
	type ConceptGenerationResult,
	type ProjectConcept
} from './concepts';
import {
	buildConceptParameters,
	generateConceptPortfolio,
	InvalidConceptResponseError
} from './server/concept-ai';

function request(): ConceptGenerationRequest {
	return {
		projectId: 'project-1',
		topic: 'Campus transit',
		problems: ['Students miss buses when route changes are buried.'],
		technologyTags: ['Web app'],
		industryTags: ['Education', 'Transportation'],
		innovationLevel: 3,
		prototypeBudgetUsd: 1_000,
		includeProductionPlanning: true,
		productionBudgetUsd: 10_000,
		constraints: { teamSize: 'Solo' },
		research: {
			summary: 'Existing transit apps cover schedules but campus-specific notices remain uneven.',
			findings: [
				{
					id: 'finding-1',
					category: 'competitors',
					title: 'Transit apps',
					claim: 'A current product provides route planning.',
					interpretation: 'A campus tool needs a narrower advantage.',
					sourceIds: ['source-1']
				}
			],
			sources: [
				{
					id: 'source-1',
					url: 'https://example.com/transit',
					title: 'Transit product page',
					publisher: 'Example Transit',
					publicationDate: null,
					retrievedAt: '2026-09-01T10:00:00.000Z',
					stage: 'broad',
					evidenceSummary: 'Describes current route-planning functions.'
				}
			],
			gaps: [],
			retrievedAt: '2026-09-01T10:00:00.000Z',
			disclaimer: 'Best-effort broad research.'
		},
		interview: {
			status: 'completed',
			questions: [],
			answers: [],
			currentQuestionIndex: 0,
			completionReason: 'Enough detail is available.',
			confidence: 'normal'
		},
		rejectedConcepts: []
	};
}

function concept(index: number): ProjectConcept {
	const stretch = index === 3;
	return {
		id: `concept-${index + 1}`,
		name: ['Signal Bell', 'Route Steward', 'Stop Beacon', 'Campus Transit Twin'][index],
		pitch: `A distinct product direction number ${index + 1} for campus riders.`,
		description:
			'This concept addresses missed service changes with a concrete product mechanism that a solo builder can prototype.',
		targetUser: 'Students who rely on campus transit',
		problemsAddressed: ['Route changes are easy to miss.'],
		distinctApproach: [
			'notification layer',
			'staff workflow',
			'physical stop display',
			'predictive simulation'
		][index],
		proposedFeatures: ['Targeted alerts', 'Route status', 'Saved stops'],
		highLevelRequirements: ['Import service updates', 'Deliver readable status notices'],
		implementationOutline: ['Validate the update feed', 'Build and test the prototype'],
		prototypeBudget: {
			minimumUsd: stretch ? 1_200 : 100 + index * 100,
			maximumUsd: stretch ? 1_800 : 500 + index * 100,
			assumptions: ['The builder supplies their own computer.']
		},
		productionBudget: {
			minimumUsd: stretch ? 15_000 : 3_000,
			maximumUsd: stretch ? 25_000 : 8_000,
			assumptions: ['A small campus pilot comes first.']
		},
		prototypeTimeline: stretch ? '10 to 14 weeks' : '3 to 6 weeks',
		competitors: [
			{
				name: 'Example Transit',
				type: 'direct',
				comparison: 'It handles general route planning but not this campus-specific mechanism.',
				sourceIds: ['source-1']
			}
		],
		mainAdvantage: 'It narrows the workflow to campus service changes.',
		majorAssumptions: ['The campus exposes service updates.'],
		majorRisks: ['Feed access may be inconsistent.'],
		confidence: 'medium',
		evidenceGaps: ['No campus pilot evidence was found.'],
		isStretch: stretch,
		isRecommended: index === 0,
		archetype: [
			'Helpful familiar',
			'Workflow familiar',
			'Sidewalk familiar',
			'Forbidden simulator'
		][index],
		rarity: stretch ? 'cursed rare' : 'uncommon practical',
		icon: ['terminal', 'workbench', 'beacon', 'satellite'][index] as ProjectConcept['icon'],
		sageReason: 'It matches the strongest signal without pretending the evidence is complete.',
		comparison: COMPARISON_DIMENSIONS.map((dimension) => ({
			dimension,
			rating: dimension === 'technical-risk' ? ('low' as const) : ('high' as const),
			explanation: 'The available inputs support this qualitative rating.'
		}))
	};
}

function result(): ConceptGenerationResult {
	return { concepts: [0, 1, 2, 3].map(concept) };
}

describe('concept portfolio contract', () => {
	it('accepts a complete generation request and exactly four distinct concepts', () => {
		const input = request();
		expect(parseConceptGenerationRequest(input)).toEqual(input);
		expect(parseConceptGenerationResult(result(), input)).toEqual(result());
	});

	it('rejects a second stretch concept and an invented source reference', () => {
		const input = request();
		const twoStretch = result();
		twoStretch.concepts[1].isStretch = true;
		expect(parseConceptGenerationResult(twoStretch, input)).toBeNull();

		const inventedSource = result();
		inventedSource.concepts[0].competitors[0].sourceIds = ['made-up-source'];
		expect(parseConceptGenerationResult(inventedSource, input)).toBeNull();
	});

	it('rejects over-budget practical concepts and recycled rejected directions', () => {
		const input = request();
		const overBudget = result();
		overBudget.concepts[2].prototypeBudget.maximumUsd = 1_001;
		expect(parseConceptGenerationResult(overBudget, input)).toBeNull();

		input.rejectedConcepts = [
			{ name: 'Signal Bell', pitch: 'An earlier rejected product pitch.', distinctApproach: 'old' }
		];
		expect(parseConceptGenerationResult(result(), input)).toBeNull();

		input.rejectedConcepts = [
			{
				name: 'Different old name',
				pitch: 'An earlier rejected product pitch.',
				distinctApproach: 'notification layer'
			}
		];
		expect(parseConceptGenerationResult(result(), input)).toBeNull();
	});

	it('uses strict structured output without storing provider responses', () => {
		const parameters = buildConceptParameters('test-model', request());
		expect(parameters).toMatchObject({
			model: 'test-model',
			store: false,
			text: { format: { type: 'json_schema', strict: true } }
		});
	});

	it('retries one malformed result and returns the valid replacement', async () => {
		const client = {
			create: vi
				.fn()
				.mockResolvedValueOnce({ output_text: '{bad json' })
				.mockResolvedValueOnce({ output_text: JSON.stringify(result()) })
		};
		await expect(generateConceptPortfolio(client, 'test-model', request())).resolves.toEqual(
			result()
		);
		expect(client.create).toHaveBeenCalledTimes(2);
	});

	it('fails after the one bounded malformed-output retry', async () => {
		const client = { create: vi.fn().mockResolvedValue({ output_text: '{}' }) };
		await expect(generateConceptPortfolio(client, 'test-model', request())).rejects.toBeInstanceOf(
			InvalidConceptResponseError
		);
		expect(client.create).toHaveBeenCalledTimes(2);
	});
});
