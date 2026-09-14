import { describe, expect, it } from 'vitest';
import { AnimationClip, AnimationMixer, NumberKeyframeTrack, Object3D } from 'three';
import { SageAnimationDirector } from './sage-animation';

function setup() {
	const model = new Object3D();
	const mixer = new AnimationMixer(model);
	const actions = Object.fromEntries(
		['idle', 'talk', 'approval'].map((name, index) => [
			name,
			mixer.clipAction(
				new AnimationClip(name, 1, [
					new NumberKeyframeTrack('.position[x]', [0, 1], [index + 1, index + 1])
				])
			)
		])
	);
	return { model, actions, director: new SageAnimationDirector(mixer, actions) };
}

describe('Sage animation transitions', () => {
	it('keeps normalized weights through rapid idle-talk-idle interruptions', () => {
		const { model, actions, director } = setup();
		director.play('idle');
		director.update(0.01);
		director.play('talk');
		director.update(0.06);
		director.play('idle');
		for (let i = 0; i < 60; i++) {
			director.update(1 / 60);
			expect(model.position.x).toBeGreaterThanOrEqual(1);
			expect(model.position.x).toBeLessThanOrEqual(2);
		}
		expect(actions.idle.isRunning()).toBe(true);
		expect(actions.talk.isScheduled()).toBe(false);
		expect(model.position.x).toBeCloseTo(1);
		director.dispose();
	});

	it('returns after the animation finishes and retains a pose when told to hold', () => {
		const { director } = setup();
		director.play('approval', true);
		director.update(0.5);
		expect(director.current).toBe('approval');
		director.update(0.6);
		expect(director.current).toBe('idle');
		director.play('approval', false);
		director.update(2);
		expect(director.current).toBe('approval');
		director.dispose();
	});
});

it('replaces legacy fall requests with idle', () => {
	const { director, actions } = setup();
	director.play('talk');
	director.play('drop', true);
	director.update(0.3);
	expect(director.current).toBe('idle');
	expect(actions.idle.isRunning()).toBe(true);
	expect(director.reacting).toBe(false);
	director.dispose();
});
