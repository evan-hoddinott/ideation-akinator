import type { FocusedResearchRequest, MaterialConflict, ProjectFinalization } from './finalization';
import { exceedsDeadline } from './deadline';

// Include the evidence and limits, not just feature IDs. A response for an old
// configuration must never become the current project's research or final plan.
export function focusedRequestFingerprint(input: FocusedResearchRequest): string {
	return JSON.stringify(canonical(input));
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, item]) => [key, canonical(item)])
		);
	}
	return value;
}

export function finalizationConflicts(
	input: FocusedResearchRequest,
	state: ProjectFinalization
): MaterialConflict[] {
	const conflicts = [...(state.research.result?.materialConflicts ?? [])];
	const plan = state.plan;
	if (!plan) return conflicts;
	if (exceedsDeadline(plan.prototypeTimeline, input.constraints.deadline)) {
		conflicts.push({
			id: 'prototype-deadline',
			kind: 'deadline',
			sourceIds: [],
			description: `The plan estimates ${plan.prototypeTimeline}, beyond your deadline: ${input.constraints.deadline}. Revise the scope or explicitly change the deadline before finalizing.`
		});
	}
	const cap = input.selectedConcept.isStretch
		? Math.max(input.prototypeBudgetUsd, input.selectedConcept.prototypeBudget.maximumUsd)
		: input.prototypeBudgetUsd;
	if (plan.prototypeBudget.maximumUsd > cap) {
		conflicts.push({
			id: 'prototype-cost',
			kind: 'budget',
			sourceIds: [],
			description: `The recalculated prototype reaches $${plan.prototypeBudget.maximumUsd.toLocaleString('en-US')}. ${input.selectedConcept.isStretch ? 'The disclosed stretch estimate' : 'Your prototype limit'} was $${cap.toLocaleString('en-US')}. Revise the scope or explicitly change the limit before finalizing.`
		});
	}
	if (
		input.includeProductionPlanning &&
		input.productionBudgetUsd !== null &&
		plan.productionBudget &&
		plan.productionBudget.maximumUsd > input.productionBudgetUsd
	) {
		conflicts.push({
			id: 'production-cost',
			kind: 'budget',
			sourceIds: [],
			description: `Production is estimated up to $${plan.productionBudget.maximumUsd.toLocaleString('en-US')}, above your $${input.productionBudgetUsd.toLocaleString('en-US')} production limit.`
		});
	}
	const excluded = (input.constraints.excludedTechnologies ?? '')
		.split(',')
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
	for (const technology of plan.technologyRecommendations) {
		if (
			excluded.some(
				(item) =>
					technology.choice.toLowerCase() === item ||
					technology.choice.toLowerCase().startsWith(`${item} `)
			)
		) {
			conflicts.push({
				id: `excluded-${conflicts.length}`,
				kind: 'technology',
				sourceIds: [],
				description: `The plan requires ${technology.choice}, which conflicts with your technology exclusions. Revise the approach or change that exclusion.`
			});
		}
	}
	return conflicts;
}

export function nextFinalizationAction(
	input: FocusedResearchRequest,
	state: ProjectFinalization
):
	| 'research'
	| 'wait'
	| 'conflict'
	| 'plan'
	| 'retry-plan'
	| 'retry-research'
	| 'print'
	| 'results' {
	if (finalizationConflicts(input, state).length) return 'conflict';
	if (state.plan) return state.printPresented ? 'results' : 'print';
	if (state.planStatus === 'running') return 'wait';
	if (state.research.result) return state.planStatus === 'failed' ? 'retry-plan' : 'plan';
	if (state.research.status === 'queued' || state.research.status === 'running') return 'wait';
	return state.research.status === 'idle' ? 'research' : 'retry-research';
}
