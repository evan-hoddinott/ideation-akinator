import { describe, expect, it } from 'vitest';
import { parseConceptPortfolio } from './concepts';
import {
	createDemoFinalPlan,
	createDemoFocusedResearchJob,
	createDemoFocusedResearchResult,
	createDemoPortfolio,
	createDemoProject,
	createDemoResearchJob,
	createDemoResearchResult,
	DEMO_INTERVIEW_QUESTIONS,
	demoIntakeInsights,
	isDemoProject,
	nextDemoInterview
} from './demo';
import {
	parseFinalProjectPlan,
	parseFocusedResearchJobView,
	parseFocusedResearchResult,
	type FinalRecalculationRequest,
	type FocusedResearchRequest
} from './finalization';
import { createFeatureWorkshop } from './feature-workshop';
import { parseIntakeInsights } from './intake-insights';
import { createInterview } from './interview';
import { parseBroadResearchResult, parseResearchJobView } from './research';

describe('token-free visual demo', () => {
	it('starts with a complete editable intake and demo identity', () => {
		const project = createDemoProject(new Date('2026-09-01T10:00:00Z'));
		expect(isDemoProject(project)).toBe(true);
		expect(project.stage).toBe('problem');
		expect(project.problemInput.cards).toHaveLength(2);
		expect(project.preferences.prototypeBudgetUsd).toBe(1_500);
	});

	it('keeps every canned AI boundary inside the production parsers', () => {
		expect(parseIntakeInsights(demoIntakeInsights())).not.toBeNull();
		expect(parseBroadResearchResult(createDemoResearchResult())).not.toBeNull();
		expect(parseResearchJobView(createDemoResearchJob('running'))).not.toBeNull();
		expect(parseResearchJobView(createDemoResearchJob('completed'))).not.toBeNull();
		expect(parseConceptPortfolio(createDemoPortfolio())).not.toBeNull();
		const focused = demoFocusedRequest();
		const focusedResult = createDemoFocusedResearchResult(focused);
		expect(parseFocusedResearchResult(focusedResult, focused)).not.toBeNull();
		expect(
			parseFocusedResearchJobView(createDemoFocusedResearchJob(focused, 'running'))
		).not.toBeNull();
		expect(
			parseFocusedResearchJobView(createDemoFocusedResearchJob(focused, 'completed'))
		).not.toBeNull();
		const finalRequest: FinalRecalculationRequest = { ...focused, focusedResearch: focusedResult };
		expect(parseFinalProjectPlan(createDemoFinalPlan(finalRequest), finalRequest)).not.toBeNull();
	});

	it('asks three local questions and then completes', () => {
		const interview = createInterview();
		const first = nextDemoInterview(interview);
		expect(first.decision).toBe('ask');

		interview.questions = first.decision === 'ask' ? [first.question] : [];
		expect(nextDemoInterview(interview).decision).toBe('ask');
		interview.questions = [...DEMO_INTERVIEW_QUESTIONS];
		expect(nextDemoInterview(interview)).toMatchObject({ decision: 'complete', question: null });
	});
});

function demoFocusedRequest(): FocusedResearchRequest {
	const project = createDemoProject(new Date('2026-09-01T10:00:00Z'));
	const portfolio = createDemoPortfolio(new Date('2026-09-01T10:00:00Z'));
	const concept = portfolio.concepts[0];
	const workshop = createFeatureWorkshop(portfolio);
	const features = workshop.configurations[0].features.filter((feature) => feature.included);
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
		prototypeBudgetUsd: project.preferences.prototypeBudgetUsd!,
		includeProductionPlanning: true,
		productionBudgetUsd: project.preferences.productionBudgetUsd,
		broadResearch: createDemoResearchResult(new Date('2026-09-01T10:00:00Z'))
	};
}

it('provides actionable phases and omits production when it was not requested', () => {
	const input = demoFocusedRequest();
	const request = {
		...input,
		includeProductionPlanning: false,
		productionBudgetUsd: null,
		focusedResearch: createDemoFocusedResearchResult(input)
	};
	const plan = createDemoFinalPlan(request);
	expect(plan.developmentPhases).toHaveLength(3);
	expect(plan.productionBudget).toBeNull();
	expect(
		plan.developmentPhases.every(
			(phase) => phase.implementationSteps?.length && phase.doneWhen && phase.estimatedEffort
		)
	).toBe(true);
	expect(parseFinalProjectPlan(plan, request)?.developmentPhases).toEqual(plan.developmentPhases);
});
