import { describe, expect, it } from 'vitest';
import { createProject } from '$lib/project-state';
import {
	clipForMood,
	faceProfileForMood,
	normalizedCursorTarget,
	projectAltitude,
	speechMeter,
	STAGE_ALTITUDES
} from '$lib/sage-stage';

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
		expect(clipForMood('suspicious')).toBe('suspicious');
		expect(clipForMood('shocked')).toBe('shocked');
		expect(clipForMood('smug')).toBe('smug');
	});

	it('gives each extreme mood a readable CRT expression', () => {
		expect(faceProfileForMood('shocked').mouthHeight).toBeGreaterThan(2);
		expect(faceProfileForMood('suspicious').leftEyeHeight).toBeLessThan(
			faceProfileForMood('suspicious').rightEyeHeight
		);
		expect(faceProfileForMood('defeated').color).not.toBe(faceProfileForMood('delighted').color);
	});

	it('clamps cursor tracking to the visible screen', () => {
		expect(normalizedCursorTarget(960, 540, 1920, 1080)).toEqual({ x: 0, y: 0 });
		expect(normalizedCursorTarget(4000, -20, 1920, 1080)).toEqual({ x: 1, y: -1 });
	});

	it('widens and raises the face meter only while speaking', () => {
		expect(speechMeter(false, 1, 1)).toEqual({ width: 1, height: 1 });
		const active = speechMeter(true, 1, 0.8);
		expect(active.width).toBeGreaterThan(1);
		expect(active.height).toBeGreaterThan(1);
	});
});
