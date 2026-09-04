import { describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { AuthoredPoseLayer } from './authored-pose-layer';

describe('AuthoredPoseLayer', () => {
	it('prevents a procedural rotation from accumulating between rendered frames', () => {
		const head = new Object3D();
		const layer = new AuthoredPoseLayer([head]);

		for (let frame = 0; frame < 120; frame += 1) {
			layer.restore();
			layer.capture();
			head.rotation.y += 0.12;
			expect(head.rotation.y).toBeCloseTo(0.12, 5);
		}
	});

	it('composes procedural motion from a newly captured authored pose', () => {
		const head = new Object3D();
		const layer = new AuthoredPoseLayer([head]);

		layer.restore();
		head.rotation.y = 0.2;
		layer.capture();
		head.rotation.y += 0.12;
		expect(head.rotation.y).toBeCloseTo(0.32, 5);

		layer.restore();
		expect(head.rotation.y).toBeCloseTo(0.2, 5);
	});
});
