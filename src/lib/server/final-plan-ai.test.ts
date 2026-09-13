import {
	createDemoFinalPlan,
	createDemoFocusedResearchResult,
	createDemoPortfolio,
	createDemoProject,
	createDemoResearchResult
} from '$lib/demo';
import {
	finalizationFingerprint,
	parseFocusedResearchRequest,
	parseFinalProjectPlan,
	type FinalRecalculationRequest,
	type FocusedResearchRequest
} from '$lib/finalization';
import { createFeatureWorkshop } from '$lib/feature-workshop';
import { describe, expect, it } from 'vitest';
import {
	buildFinalPlanParameters,
	generateFinalProjectPlan,
	InvalidFinalPlanResponseError
} from './final-plan-ai';

describe('final plan AI orchestration', () => {
	it('uses a separate non-web structured recalculation contract', () => {
		const parameters = buildFinalPlanParameters('test-model', request());
		expect(parameters).toMatchObject({
			model: 'test-model',
			store: false,
			text: { format: { name: 'recalculated_project_plan', strict: true } }
		});
		expect(parameters).not.toHaveProperty('tools');
		expect(parameters.instructions).toContain('every confirmed feature');
	});

	it('injects the sealed identity and accepts a valid recalculation', async () => {
		const input = request();
		const plan = createDemoFinalPlan(input, new Date('2026-09-01T12:00:00Z'));
		const result = await generateFinalProjectPlan(
			{ create: async () => ({ output_text: JSON.stringify(plan) }) },
			'test-model',
			input,
			undefined,
			new Date('2026-09-01T12:00:00Z')
		);
		expect(result.productName).toBe(input.selectedConcept.name);
		expect(result.confirmedFeatures.map((feature) => feature.id)).toEqual(
			input.includedFeatures.map((feature) => feature.id)
		);
	});

	it('retries malformed output once', async () => {
		const input = request();
		const plan = createDemoFinalPlan(input);
		let calls = 0;
		const result = await generateFinalProjectPlan(
			{
				create: async () => ({ output_text: JSON.stringify(++calls === 1 ? { nope: true } : plan) })
			},
			'test-model',
			input
		);
		expect(calls).toBe(2);
		expect(result.selectedConceptId).toBe(input.selectedConcept.id);
	});

	it('rejects a weakened verdict without a material warning', async () => {
		const input = request();
		input.focusedResearch = { ...input.focusedResearch, verdict: 'weakened' };
		const plan = { ...createDemoFinalPlan(input), materialWarning: null };
		await expect(
			generateFinalProjectPlan(
				{ create: async () => ({ output_text: JSON.stringify(plan) }) },
				'test-model',
				input
			)
		).rejects.toBeInstanceOf(InvalidFinalPlanResponseError);
	});
});

function request(): FinalRecalculationRequest {
	const project = createDemoProject();
	const portfolio = createDemoPortfolio();
	const concept = portfolio.concepts[0];
	const features = createFeatureWorkshop(portfolio).configurations[0].features.filter(
		(feature) => feature.included
	);
	const base: FocusedResearchRequest = {
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
	return { ...base, focusedResearch: createDemoFocusedResearchResult(base) };
}

describe('deferred roadmap contract', () => {
	it('preserves the chosen roadmap independently of model output and prototype scope', async () => {
		const input = request();
		input.deferredFeatures = [
			{
				id: 'later-display',
				name: 'Station display',
				description: 'Add a public display after the initial pilot.'
			}
		];
		const plan = createDemoFinalPlan(input);
		const result = await generateFinalProjectPlan(
			{ create: async () => ({ output_text: JSON.stringify({ ...plan, deferredFeatures: [] }) }) },
			'test-model',
			input
		);
		expect(result.deferredFeatures).toEqual(input.deferredFeatures);
		expect(result.confirmedFeatures.some((f) => f.id === 'later-display')).toBe(false);
		expect(result.prototypeBudget).toEqual(plan.prototypeBudget);
		expect(parseFinalProjectPlan({ ...result, deferredFeatures: [] }, input)).toBeNull();
	});
	it('invalidates finalization when the roadmap changes without changing the prototype', () => {
		const input = request();
		const old = finalizationFingerprint(input.selectedConcept.id, input.includedFeatures);
		const changed = finalizationFingerprint(input.selectedConcept.id, input.includedFeatures, [
			{ id: 'later', name: 'History', description: 'Save completed journeys.' }
		]);
		expect(changed).not.toBe(old);
		expect(
			parseFocusedResearchRequest({ ...input, deferredFeatures: [input.includedFeatures[0]] })
		).toBeNull();
	});
});
