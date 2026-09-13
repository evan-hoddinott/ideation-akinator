import { describe, expect, it } from 'vitest';
import {
	createDemoProject,
	createDemoPortfolio,
	createDemoResearchResult,
	createDemoFocusedResearchResult,
	createDemoFinalPlan
} from './demo';
import { createFeatureWorkshop } from './feature-workshop';
import {
	createProjectFinalization,
	parseProjectFinalization,
	parseFocusedResearchResult,
	type FocusedResearchRequest
} from './finalization';
import {
	finalizationConflicts,
	focusedRequestFingerprint,
	nextFinalizationAction
} from './finalization-flow';

function request(): FocusedResearchRequest {
	const project = createDemoProject();
	const portfolio = createDemoPortfolio();
	return {
		projectId: project.id,
		topic: project.problemInput.topic,
		problems: project.problemInput.cards.map((item) => item.text),
		selectedConcept: portfolio.concepts[0],
		includedFeatures: createFeatureWorkshop(portfolio).configurations[0].features.filter(
			(item) => item.included
		),
		deferredFeatures: [],
		constraints: {},
		prototypeBudgetUsd: 1500,
		includeProductionPlanning: false,
		productionBudgetUsd: null,
		broadResearch: createDemoResearchResult()
	};
}

describe('continuous finalization', () => {
	it('blocks an over-deadline final plan even for the fourth concept', () => {
		const input = request();
		input.constraints.deadline = '6 weeks';
		input.selectedConcept.isStretch = true;
		const result = createDemoFocusedResearchResult(input);
		const plan = createDemoFinalPlan({ ...input, focusedResearch: result });
		plan.prototypeTimeline = '6–8 weeks';
		const state = { ...createProjectFinalization(), plan };
		expect(finalizationConflicts(input, state).map((item) => item.kind)).toEqual(['deadline']);
		expect(nextFinalizationAction(input, state)).toBe('conflict');
	});
	it('advances from research to plan to printing without intermediate collection steps', () => {
		const input = request();
		const state = createProjectFinalization();
		expect(nextFinalizationAction(input, state)).toBe('research');
		state.research = { jobId: 'job', status: 'running', result: null };
		expect(nextFinalizationAction(input, state)).toBe('wait');
		state.research = {
			jobId: 'job',
			status: 'completed',
			result: createDemoFocusedResearchResult(input)
		};
		expect(nextFinalizationAction(input, state)).toBe('plan');
		state.plan = createDemoFinalPlan({ ...input, focusedResearch: state.research.result! });
		expect(nextFinalizationAction(input, state)).toBe('print');
		state.printPresented = true;
		expect(nextFinalizationAction(input, state)).toBe('results');
	});
	it('persists plan failure and retries only the plan with completed research intact', () => {
		const input = request();
		const state = {
			...createProjectFinalization(),
			planStatus: 'failed' as const,
			research: {
				jobId: 'paid-job',
				status: 'partial' as const,
				result: createDemoFocusedResearchResult(input)
			}
		};
		const restored = parseProjectFinalization(JSON.parse(JSON.stringify(state)))!;
		expect(restored).toEqual(state);
		expect(nextFinalizationAction(input, restored)).toBe('retry-plan');
		expect(restored.research.jobId).toBe('paid-job');
	});
	it('leaves cancelled and failed research awaiting an explicit retry', () => {
		const input = request();
		for (const status of ['failed', 'cancelled'] as const) {
			const state = {
				...createProjectFinalization(),
				research: { jobId: 'job', status, result: null }
			};
			expect(nextFinalizationAction(input, state)).toBe('retry-research');
		}
	});
	it('blocks cited hard conflicts while a weakened originality verdict alone can proceed', () => {
		const input = request();
		const result = { ...createDemoFocusedResearchResult(input), verdict: 'weakened' as const };
		const state = {
			...createProjectFinalization(),
			research: { jobId: 'job', status: 'completed' as const, result }
		};
		expect(nextFinalizationAction(input, state)).toBe('plan');
		result.materialConflicts = [
			{
				id: 'data-access',
				kind: 'scope',
				description: 'The required feed is not available to this team.',
				sourceIds: [result.sources[0].id]
			}
		];
		expect(nextFinalizationAction(input, state)).toBe('conflict');
		expect(parseFocusedResearchResult(result, input)).not.toBeNull();
		expect(
			parseFocusedResearchResult(
				{
					...result,
					materialConflicts: [{ ...result.materialConflicts[0], sourceIds: ['invented'] }]
				},
				input
			)
		).toBeNull();
	});
	it('allows the disclosed fourth budget exception but catches a worse estimate and excluded technology', () => {
		const input = request();
		input.selectedConcept = {
			...input.selectedConcept,
			isStretch: true,
			prototypeBudget: {
				minimumUsd: 2000,
				maximumUsd: 3000,
				assumptions: ['Disclosed stretch range']
			}
		};
		const result = createDemoFocusedResearchResult(input);
		const plan = createDemoFinalPlan({ ...input, focusedResearch: result });
		plan.prototypeBudget.maximumUsd = 3000;
		const state = {
			...createProjectFinalization(),
			research: { jobId: 'job', status: 'completed' as const, result },
			plan
		};
		expect(finalizationConflicts(input, state)).toEqual([]);
		plan.prototypeBudget.maximumUsd = 3001;
		expect(finalizationConflicts(input, state).map((item) => item.id)).toEqual(['prototype-cost']);
		input.constraints.excludedTechnologies = 'Arduino';
		plan.technologyRecommendations = [
			{ area: 'Controller', choice: 'Arduino Uno', rationale: 'A microcontroller' }
		];
		expect(finalizationConflicts(input, state).map((item) => item.kind)).toEqual([
			'budget',
			'technology'
		]);
	});
	it('invalidates responses when limits, evidence, project or deferred scope change', () => {
		const input = request();
		const original = focusedRequestFingerprint(input);
		for (const changed of [
			{ ...input, projectId: 'another-project' },
			{ ...input, prototypeBudgetUsd: 999 },
			{ ...input, constraints: { deadline: '2 weeks' } },
			{
				...input,
				deferredFeatures: [{ id: 'later', name: 'Tracking', description: 'Location updates' }]
			},
			{ ...input, broadResearch: { ...input.broadResearch, summary: 'Changed research evidence' } }
		])
			expect(focusedRequestFingerprint(changed)).not.toBe(original);
		expect(focusedRequestFingerprint({ ...input, constraints: { a: 'one', b: 'two' } })).toBe(
			focusedRequestFingerprint({ ...input, constraints: { b: 'two', a: 'one' } })
		);
	});
});
