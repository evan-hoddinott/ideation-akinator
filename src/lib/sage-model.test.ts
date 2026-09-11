import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AnimationMixer, Box3, Matrix4, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Check the exported asset, so a generator change cannot silently reintroduce
// the research head lift or place the floating shoes inside the seat.
describe('Sage cartoon silhouette', () => {
	it('keeps the head attached and floating shoes clear of the seat throughout all clips', async () => {
		const bytes = readFileSync('static/models/signal-sage.glb');
		const gltf = await new GLTFLoader().parseAsync(
			bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
			''
		);
		const model = gltf.scene;
		const head = model.getObjectByName('head')!;
		const pelvis = model.getObjectByName('pelvis')!;
		const spine = model.getObjectByName('spine')!;
		const torso = model.getObjectByName('RobeTorso')!;
		const restHead = head.position.clone(),
			restPelvis = pelvis.position.clone();
		expect(torso.parent).toBe(spine);
		for (const name of [
			'ThighL',
			'ThighR',
			'KneeL',
			'KneeR',
			'LegL',
			'LegR',
			'UpperArmL',
			'UpperArmR',
			'ForearmL',
			'ForearmR'
		])
			expect(model.getObjectByName(name)).toBeUndefined();
		const seat = model.getObjectByName('ChairSeat') as Mesh;
		const chair = model.getObjectByName('chair')!;
		const inverse = new Matrix4();
		const vertex = new Vector3();
		const bounds = (mesh: Mesh) => {
			const result = new Box3();
			const positions = mesh.geometry.getAttribute('position');
			for (let i = 0; i < positions.count; i++)
				result.expandByPoint(
					vertex
						.fromBufferAttribute(positions, i)
						.applyMatrix4(mesh.matrixWorld)
						.applyMatrix4(inverse)
				);
			return result;
		};
		const mixer = new AnimationMixer(model);
		let maxHeadTranslation = 0,
			maxHipTranslation = 0,
			intersections = 0,
			neckGaps = 0;
		for (const clip of gltf.animations) {
			mixer.stopAllAction();
			mixer.clipAction(clip).reset().play();
			for (let sample = 0; sample < 12; sample++) {
				mixer.setTime((clip.duration * sample) / 12);
				model.updateMatrixWorld(true);
				maxHeadTranslation = Math.max(maxHeadTranslation, head.position.distanceTo(restHead));
				maxHipTranslation = Math.max(maxHipTranslation, pelvis.position.distanceTo(restPelvis));
				inverse.copy(chair.matrixWorld).invert();
				const seatBounds = bounds(seat);
				if (
					!bounds(model.getObjectByName('MonitorCase') as Mesh).intersectsBox(
						bounds(model.getObjectByName('RobeCollar') as Mesh)
					)
				)
					neckGaps++;
				for (const name of ['BootL', 'BootR', 'BootSoleL', 'BootSoleR'])
					if (bounds(model.getObjectByName(name) as Mesh).intersectsBox(seatBounds))
						intersections++;
			}
		}
		expect(gltf.animations).toHaveLength(35);
		expect(maxHeadTranslation).toBeLessThan(0.001);
		expect(maxHipTranslation).toBeLessThan(0.001);
		expect(intersections).toBe(0);
		expect(neckGaps).toBe(0);
	});
});
