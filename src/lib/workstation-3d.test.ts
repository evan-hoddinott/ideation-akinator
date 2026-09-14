import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWorkstation, projectDisplay, reachContact } from './workstation-3d';

describe('3D workstation', () => {
	it('projects all four browser corners onto the CRT plane after camera and cart motion', () => {
		const computer = createWorkstation();
		const camera = new THREE.PerspectiveCamera(31, 1.6, 0.1, 60);
		camera.position.set(0.7, 2.1, 8.4);
		camera.lookAt(0.7, 1.7, 0);
		camera.updateMatrixWorld();
		computer.root.position.x += 0.4;
		computer.root.rotation.z = 0.02;
		computer.update('monitor-turn', 12, 1.1);
		computer.root.updateMatrixWorld(true);
		const style = { transform: '' };
		const rect = { left: 0, top: 30, width: 1440, height: 740 } as DOMRect;
		projectDisplay({ style } as unknown as HTMLElement, computer.screen, camera, rect);
		const matrix = new THREE.Matrix4().fromArray(
			style.transform.slice(9, -1).split(',').map(Number)
		);
		expect(Math.abs(matrix.determinant())).toBeGreaterThan(1e-10);
		for (const [x, y] of [
			[0, 0],
			[320, 0],
			[0, 240],
			[320, 240]
		]) {
			const css = new THREE.Vector3(x, y, 0).applyMatrix4(matrix);
			const projected = new THREE.Vector3((x / 320) * 1.32 - 0.66, 0.44 - (y / 240) * 0.88, 0)
				.applyMatrix4(computer.screen.matrixWorld)
				.project(camera);
			expect(css.x).toBeCloseTo(((projected.x + 1) / 2) * rect.width + rect.left, 5);
			expect(css.y).toBeCloseTo(((1 - projected.y) / 2) * rect.height + rect.top, 5);
		}
		computer.dispose();
	});
	it('reaches a prop contact with attached joints under a rotated parent', () => {
		const root = new THREE.Group();
		root.rotation.y = 1.1;
		const upper = new THREE.Object3D(),
			forearm = new THREE.Object3D(),
			hand = new THREE.Object3D();
		root.add(upper);
		upper.add(forearm);
		forearm.add(hand);
		forearm.position.x = 0.5;
		hand.position.x = 0.5;
		root.updateMatrixWorld(true);
		const target = root.localToWorld(new THREE.Vector3(0.6, 0.5, 0));
		reachContact([forearm, upper], hand, target, 1);
		expect(hand.getWorldPosition(new THREE.Vector3()).distanceTo(target)).toBeLessThan(0.025);
		expect(hand.parent).toBe(forearm);
	});
});

it('keeps the CRT case above the cart throughout the turn', () => {
	const computer = createWorkstation();
	const desktop = computer.root.getObjectByName('CartDesktop')!;
	for (let t = 0; t <= 2.2; t += 0.1) {
		computer.update('monitor-turn', t, t);
		computer.root.updateMatrixWorld(true);
		const caseBounds = new THREE.Box3().setFromObject(computer.monitor);
		const deskBounds = new THREE.Box3().setFromObject(desktop);
		expect(caseBounds.min.y).toBeGreaterThan(deskBounds.max.y);
	}
	computer.dispose();
});

it('expands the browser plane without reversing its orientation', () => {
	const computer = createWorkstation();
	const camera = new THREE.PerspectiveCamera(31, 1.6, 0.1, 60);
	camera.position.set(0.7, 2.1, 8.4);
	camera.lookAt(0.7, 1.7, 0);
	camera.updateMatrixWorld();
	computer.update('desktop-zoom', 12, 0);
	computer.root.updateMatrixWorld(true);
	const style = { transform: '' };
	for (let t = 0; t <= 1; t += 0.05) {
		projectDisplay(
			{ style } as unknown as HTMLElement,
			computer.screen,
			camera,
			{ left: 0, top: 0, width: 1440, height: 900 } as DOMRect,
			t
		);
		const m = new THREE.Matrix4().fromArray(style.transform.slice(9, -1).split(',').map(Number));
		const a = new THREE.Vector3(0, 0, 0).applyMatrix4(m),
			b = new THREE.Vector3(320, 0, 0).applyMatrix4(m),
			c = new THREE.Vector3(0, 240, 0).applyMatrix4(m);
		expect((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)).toBeGreaterThan(0);
	}
	computer.dispose();
});
