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
		requiredTechnologies: ['Web browser', 'Database'],
		majorComponents: ['Publishing service', 'Rider interface'],
		featureBlueprint: ['Targeted alerts', 'Route status', 'Saved stops'].map((name, i) => ({
			id: `f${i}`,
			name,
			description: `Provide ${name.toLowerCase()} to riders.`,
			tier: i === 0 ? 'core' : 'optional',
			dependencies: i ? ['f0'] : [],
			dependencyOnly: false,
			scopeImpact: 'Adds publishing and testing work.'
		})),
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
	it('rejects a stretch deadline exception and asks the model to repair it', async () => {
		const input = request();
		input.constraints.deadline = 'Working prototype within 6 weeks';
		const invalid = result();
		expect(parseConceptGenerationResult(invalid, input)).toBeNull();
		const repaired = result();
		repaired.concepts[3].prototypeTimeline = '4–6 weeks';
		const seen: string[] = [];
		const client = {
			create: vi.fn(async (parameters: Record<string, unknown>) => {
				seen.push(String(parameters.input));
				return {
					status: 'completed',
					output_text: JSON.stringify(seen.length === 1 ? invalid : repaired)
				};
			})
		};
		expect(await generateConceptPortfolio(client, 'test-model', input)).toEqual(repaired);
		expect(seen[1]).toContain('deadline_exceeded');
	});
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

	it('retries an incomplete response with a concise repair instruction and one shared deadline', async () => {
		const inputs: string[] = [];
		const signals: (AbortSignal | undefined)[] = [];
		const output = result();
		const parsed = await generateConceptPortfolio(
			{
				create: async (parameters, options) => {
					inputs.push(String(parameters.input));
					signals.push(options?.signal);
					return {
						output_text: JSON.stringify(output),
						status: inputs.length === 1 ? 'incomplete' : 'completed',
						incomplete_details: { reason: 'max_output_tokens' }
					};
				}
			},
			'test-model',
			request()
		);
		expect(parsed).toEqual(output);
		expect(inputs).toHaveLength(2);
		expect(inputs[1]).toContain('incomplete_max_output_tokens');
		expect(inputs[1]).toContain('4–6 short feature entries');
		expect(signals[0]).toBeInstanceOf(AbortSignal);
		expect(signals[1]).toBe(signals[0]);
	});

	it('reports incomplete output distinctly and does not call the provider after cancellation', async () => {
		const incomplete = {
			create: vi.fn().mockResolvedValue({
				output_text: '{',
				status: 'incomplete',
				incomplete_details: { reason: 'max_output_tokens' }
			})
		};
		await expect(
			generateConceptPortfolio(incomplete, 'test-model', request())
		).rejects.toMatchObject({ reason: 'incomplete_max_output_tokens' });
		expect(incomplete.create).toHaveBeenCalledTimes(2);
		const cancelled = { create: vi.fn() };
		await expect(
			generateConceptPortfolio(cancelled, 'test-model', request(), AbortSignal.abort())
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(cancelled.create).not.toHaveBeenCalled();
	});
});

describe('rough design contract', () => {
	it('requires all nine fields in new output while retaining legacy saved concepts', () => {
		const old = result();
		delete old.concepts[0].requiredTechnologies;
		expect(parseConceptGenerationResult(old, request())).toBeNull();
		expect(parseConceptGenerationResult(old)).not.toBeNull();
	});
	it('rejects forbidden required technology even on the fourth idea', () => {
		const input = request();
		input.constraints.excludedTechnologies = 'Arduino';
		const output = result();
		output.concepts[3].requiredTechnologies = ['Arduino Uno'];
		expect(parseConceptGenerationResult(output, input)).toBeNull();
	});
	it('rejects circular or inconsistent feature blueprints', () => {
		const output = result();
		output.concepts[0].featureBlueprint![0].dependencies = ['f1'];
		expect(parseConceptGenerationResult(output, request())).toBeNull();
		const mismatch = result();
		mismatch.concepts[0].featureBlueprint![0].name = 'Different feature';
		expect(parseConceptGenerationResult(mismatch, request())).toBeNull();
	});
});
