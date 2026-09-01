import { describe, expect, it } from 'vitest';
import type { ConceptPortfolio, ProjectConcept } from './concepts';
import {
	addCustomFeature,
	confirmWorkshopConcept,
	createFeatureWorkshop,
	parseFeatureWorkshopState,
	removeCustomFeature,
	toggleWorkshopFeature
} from './feature-workshop';

function concept(id: string): ProjectConcept {
	return {
		id,
		name: `Project ${id}`,
		pitch: 'A project pitch with enough detail for a useful workshop.',
		description: 'A complete concept used to exercise the local feature workshop.',
		targetUser: 'Student builders',
		problemsAddressed: ['A real problem'],
		distinctApproach: `Distinct approach ${id}`,
		proposedFeatures: ['Signal engine', 'Alert delivery', 'Saved views'],
		highLevelRequirements: ['A requirement', 'Another requirement'],
		implementationOutline: ['Build it', 'Test it'],
		prototypeBudget: { minimumUsd: 100, maximumUsd: 500, assumptions: ['Solo builder'] },
		productionBudget: null,
		prototypeTimeline: '2 to 4 weeks',
		competitors: [],
		mainAdvantage: 'Narrower scope',
		majorAssumptions: ['An assumption'],
		majorRisks: ['A risk'],
		confidence: 'medium',
		evidenceGaps: [],
		isStretch: id === 'four',
		isRecommended: id === 'one',
		archetype: 'Test familiar',
		rarity: 'practical uncommon',
		icon: 'terminal',
		sageReason: 'It fits the evidence.',
		comparison: []
	};
}

function portfolio(): ConceptPortfolio {
	return {
		concepts: ['one', 'two', 'three', 'four'].map(concept),
		generationNumber: 1,
		generatedAt: '2026-09-01T12:00:00.000Z'
	};
}

describe('feature workshop', () => {
	it('creates and round-trips separate configurations for all four projects', () => {
		const workshop = createFeatureWorkshop(portfolio());
		expect(workshop.configurations).toHaveLength(4);
		expect(workshop.configurations[0].features.map((feature) => feature.tier)).toEqual([
			'core',
			'recommended',
			'optional'
		]);
		expect(parseFeatureWorkshopState(workshop)).toEqual(workshop);
	});

	it('explains missing dependencies before selecting them', () => {
		let workshop = createFeatureWorkshop(portfolio());
		workshop = toggleWorkshopFeature(workshop, 'one', 'one:feature:2', false).state;
		workshop = toggleWorkshopFeature(workshop, 'one', 'one:feature:1', false).state;

		const pending = toggleWorkshopFeature(workshop, 'one', 'one:feature:2', true);
		expect(pending.requiresConfirmation.map((feature) => feature.id)).toEqual(['one:feature:1']);
		expect(pending.state).toBe(workshop);

		const applied = toggleWorkshopFeature(workshop, 'one', 'one:feature:2', true, true).state;
		expect(
			applied.configurations[0].features.slice(0, 2).every((feature) => feature.included)
		).toBe(true);
	});

	it('blocks removing a dependency until its dependent feature is removed', () => {
		const workshop = createFeatureWorkshop(portfolio());
		const result = toggleWorkshopFeature(workshop, 'one', 'one:feature:1', false);
		expect(result.blockedBy.map((feature) => feature.id)).toEqual(['one:feature:2']);
		expect(result.state).toBe(workshop);
	});

	it('adds custom features, preserves them, and protects custom dependency chains', () => {
		let workshop = createFeatureWorkshop(portfolio());
		workshop = toggleWorkshopFeature(workshop, 'one', 'one:feature:2', false).state;
		workshop = toggleWorkshopFeature(workshop, 'one', 'one:feature:1', false).state;
		workshop = addCustomFeature(workshop, 'one', {
			id: 'one:custom:1',
			name: 'Dorm display',
			description: 'Show the current signal on a shared dorm display.',
			dependencies: ['one:feature:1']
		});
		workshop = addCustomFeature(workshop, 'one', {
			id: 'one:custom:2',
			name: 'Display themes',
			description: 'Let the display use several terrible themes.',
			dependencies: ['one:custom:1']
		});

		expect(workshop.configurations[0].features).toHaveLength(5);
		expect(workshop.configurations[0].features[0].included).toBe(true);
		expect(removeCustomFeature(workshop, 'one', 'one:custom:1').blockedBy).toHaveLength(1);
	});

	it('confirms exactly one valid project and reopens it when its features change', () => {
		let workshop = createFeatureWorkshop(portfolio());
		workshop = confirmWorkshopConcept(workshop, 'one', new Date('2026-09-01T13:00:00Z'));
		expect(workshop).toMatchObject({
			status: 'confirmed',
			selectedConceptId: 'one',
			confirmedAt: '2026-09-01T13:00:00.000Z'
		});

		workshop = toggleWorkshopFeature(workshop, 'one', 'one:feature:3', true).state;
		expect(workshop).toMatchObject({
			status: 'editing',
			selectedConceptId: 'one',
			confirmedAt: null
		});
	});
});
