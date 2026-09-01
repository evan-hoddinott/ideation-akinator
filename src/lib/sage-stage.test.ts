import { describe, expect, it } from 'vitest';
import { createProject } from '$lib/project-state';
import { clipForMood, projectAltitude, STAGE_ALTITUDES } from '$lib/sage-stage';

describe('Sage stage direction', () => {
	it('places later workflow stages higher in the world', () => {
		expect(STAGE_ALTITUDES.problem).toBeLessThan(STAGE_ALTITUDES.preferences);
		expect(STAGE_ALTITUDES.preferences).toBeLessThan(STAGE_ALTITUDES.research);
		expect(STAGE_ALTITUDES.research).toBeLessThan(STAGE_ALTITUDES.questions);
	});

	it('adds local lift as the problem becomes clearer', () => {
		const project = createProject();
		project.stage = 'problem';
		const startingAltitude = projectAltitude(project);
		project.problemInput.cards[0].text = 'Students cannot find compatible lab partners';
		project.problemInput.clarityLabel = 'Ready to summon';
		expect(projectAltitude(project)).toBeGreaterThan(startingAltitude);
	});

	it('maps strong reactions to distinct animation clips', () => {
		expect(clipForMood('delighted')).toBe('reveal');
		expect(clipForMood('irritated')).toBe('weak_answer');
		expect(clipForMood('suspicious')).toBe('reaction');
	});
});
