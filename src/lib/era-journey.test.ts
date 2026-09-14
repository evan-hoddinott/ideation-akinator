import { describe, expect, it } from 'vitest';
import { createProject, loadProject, saveProject } from './project-state';
import { EraJourney, projectSceneryAltitude } from './era-journey';
import { internetEraIndex } from './internet-era';
import { createDemoResultsProject } from './demo';
const at = (era: number) => (era + 0.5) / 14;
const tick = (journey: EraJourney, seconds: number, era: number) => {
	for (let i = 0; i < seconds * 100; i++) journey.advance(0.01, at(era));
};
describe('milestone-directed travel', () => {
	it('never unlocks an era through idle time', () => {
		const journey = new EraJourney(at(0));
		tick(journey, 120, 0);
		expect([journey.current, journey.next, journey.mix]).toEqual([0, 0, 0]);
	});
	it('crosses straight to the authorized milestone without a timed backlog', () => {
		const journey = new EraJourney(at(1));
		tick(journey, 0.5, 5);
		expect(journey.next).toBe(5);
		expect(journey.mix).toBeCloseTo(0.5);
		tick(journey, 0.6, 5);
		expect(journey.current).toBe(5);
		tick(journey, 30, 5);
		expect(journey.current).toBe(5);
	});
	it('handles quick advances, revisions and reduced motion', () => {
		const journey = new EraJourney(at(3));
		tick(journey, 0.2, 4);
		tick(journey, 1.1, 5);
		expect(journey.current).toBe(5);
		tick(journey, 1.1, 2);
		expect(journey.current).toBe(2);
		journey.advance(0, at(8), true);
		expect([journey.current, journey.next, journey.mix]).toEqual([8, 8, 0]);
	});
});
describe('encounter destinations', () => {
	it('visits the fourteen eras through meaningful workflow milestones', () => {
		const p = createProject();
		const era = () => internetEraIndex(projectSceneryAltitude(p));
		expect(era()).toBe(0);
		p.stage = 'problem';
		expect(era()).toBe(1);
		p.encounter = { preferencePage: 0, problemReview: true, seen: [] };
		expect(era()).toBe(2);
		p.stage = 'preferences';
		expect(era()).toBe(3);
		p.encounter.preferencePage = 2;
		expect(era()).toBe(4);
		p.encounter.preferencePage = 3;
		expect(era()).toBe(5);
		p.stage = 'research';
		expect(era()).toBe(6);
		const complete = createDemoResultsProject();
		p.research = complete.research;
		expect(era()).toBe(7);
		p.stage = 'questions';
		expect(era()).toBe(8);
		p.stage = 'concepts';
		expect(era()).toBe(9);
		p.featureWorkshop = complete.featureWorkshop;
		expect(era()).toBe(10);
		p.stage = 'focused';
		expect(era()).toBe(11);
		p.finalization = structuredClone(complete.finalization);
		p.finalization.printPresented = false;
		expect(era()).toBe(12);
		p.finalization.printPresented = true;
		expect(era()).toBe(13);
	});
	it('holds while editing or retrying and does not treat a generated plan as the ending', () => {
		const p = createDemoResultsProject();
		p.finalization.printPresented = false;
		const before = projectSceneryAltitude(p);
		p.preferences.prototypeBudgetUsd = 900;
		p.preferences.technologyTags.push('Python');
		p.finalization.planStatus = 'failed';
		expect(projectSceneryAltitude(p)).toBe(before);
		expect(internetEraIndex(before)).toBe(12);
	});
	it('does not carry the feature chapter into replacement concepts', () => {
		const p = createDemoResultsProject();
		p.stage = 'concepts';
		p.featureWorkshop.selectedConceptId = null;
		p.encounter = {
			preferencePage: 0,
			problemReview: true,
			seen: [],
			workshopOpened: true,
			workshopGeneration: p.concepts.portfolio!.generationNumber
		};
		expect(internetEraIndex(projectSceneryAltitude(p))).toBe(10);
		p.concepts.portfolio!.generationNumber++;
		expect(internetEraIndex(projectSceneryAltitude(p))).toBe(9);
	});
	it('persists presentation checkpoints while accepting older saves', () => {
		let value: string | null = null;
		const storage = {
			getItem: () => value,
			setItem: (_key: string, v: string) => {
				value = v;
			},
			removeItem: () => {
				value = null;
			}
		};
		const p = createProject();
		p.stage = 'preferences';
		saveProject(storage, p);
		expect(loadProject(storage).status).toBe('ready');
		p.encounter = { preferencePage: 4, problemReview: true, seen: ['concepts'] };
		saveProject(storage, p);
		const restored = loadProject(storage).project!;
		expect(restored.encounter).toEqual(p.encounter);
		expect(internetEraIndex(projectSceneryAltitude(restored))).toBe(5);
	});
});
