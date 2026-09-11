import { describe, expect, it } from 'vitest';
import { createProject } from './project-state';
import {
	EraJourney,
	ERA_DWELL_SECONDS,
	ERA_MERGE_SECONDS,
	projectSceneryAltitude
} from './era-journey';
const at = (era: number) => (era + 0.5) / 14;
const tick = (journey: EraJourney, seconds: number, target: number) => {
	for (let i = 0; i < Math.ceil(seconds * 100); i++) journey.advance(0.01, at(target));
};
describe('era travel', () => {
	it('holds the scene, crosses progressively, and does not skip intermediate eras', () => {
		const journey = new EraJourney(at(0));
		tick(journey, ERA_DWELL_SECONDS - 0.1, 5);
		expect(journey.next).toBe(0);
		tick(journey, 0.2, 5);
		expect(journey.next).toBe(1);
		tick(journey, ERA_MERGE_SECONDS / 2, 5);
		expect(journey.mix).toBeGreaterThan(0.4);
		expect(journey.mix).toBeLessThan(0.6);
		tick(journey, ERA_MERGE_SECONDS / 2 + 0.1, 5);
		expect(journey.current).toBe(1);
		tick(journey, 2, 5);
		expect(journey.current).toBe(1);
		expect(journey.next).toBe(1);
	});
	it('supports returning through history and immediate reduced-motion travel', () => {
		const journey = new EraJourney(at(8));
		tick(journey, ERA_DWELL_SECONDS + 0.1, 2);
		expect(journey.next).toBe(7);
		journey.advance(0.01, at(2), true);
		expect(journey.current).toBe(2);
		expect(journey.mix).toBe(0);
	});
	it('finishes a crossing safely before responding to a reversed target', () => {
		const journey = new EraJourney(at(3));
		tick(journey, ERA_DWELL_SECONDS + 1, 6);
		tick(journey, ERA_MERGE_SECONDS, 1);
		expect(journey.current).toBe(4);
		tick(journey, ERA_DWELL_SECONDS + 1, 1);
		expect(journey.next).toBe(3);
	});
});

describe('scenery milestones', () => {
	it('holds the same webpage while editing problem text, clarity, tags and budgets', () => {
		const project = createProject();
		project.stage = 'problem';
		const problem = projectSceneryAltitude(project);
		project.problemInput.cards[0].text = 'Students cannot find their bus';
		project.problemInput.clarityLabel = 'Ready to summon';
		expect(projectSceneryAltitude(project)).toBe(problem);
		project.stage = 'preferences';
		const preferences = projectSceneryAltitude(project);
		project.preferences.technologyTags.push('Svelte');
		project.preferences.prototypeBudgetUsd = 900;
		expect(projectSceneryAltitude(project)).toBe(preferences);
	});
	it('advances at a completed workflow milestone', () => {
		const project = createProject();
		project.stage = 'problem';
		const problem = projectSceneryAltitude(project);
		project.stage = 'preferences';
		expect(projectSceneryAltitude(project)).toBeGreaterThan(problem);
	});
});
