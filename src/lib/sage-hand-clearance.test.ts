import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { AnimationMixer, Group, Matrix4, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AuthoredPoseLayer } from './authored-pose-layer';
import { createHandClearance } from './sage-hand-clearance';
import { createWorkstation, reachContact } from './workstation-3d';

it('keeps mitten geometry outside props across all exported clips and research contacts', async () => {
	const bytes = readFileSync('static/models/signal-sage.glb');
	const { scene: sage, animations } = await new GLTFLoader().parseAsync(
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
		''
	);
	const computer = createWorkstation();
	const world = new Group();
	world.add(sage, computer.root);
	const hands = ['HandL', 'HandR'].map((name) => sage.getObjectByName(name) as Mesh);
	const arms = ['L', 'R'].map((side) =>
		['forearm', 'upper_arm'].map((name) => sage.getObjectByName(name + side)!)
	);
	const authored = new AuthoredPoseLayer([...hands, ...arms.flat()]);
	const clear = createHandClearance(sage, computer.root);
	const obstacles: Mesh[] = [];
	world.traverse((node) => {
		if (node instanceof Mesh && !hands.includes(node)) obstacles.push(node);
	});
	const mixer = new AnimationMixer(sage);
	const point = new Vector3(),
		inverse = new Matrix4(),
		target = new Vector3();
	let collisions = 0;

	for (const clip of animations) {
		authored.restore();
		mixer.stopAllAction();
		mixer.clipAction(clip).reset().play();
		const research = clip.name.startsWith('research_') || clip.name.startsWith('workstation_');
		computer.root.visible = research;
		sage.rotation.y = research ? 1.04 : -0.08;
		for (let sample = 0; sample < 24; sample++) {
			authored.restore();
			mixer.setTime((clip.duration * sample) / 24);
			authored.capture();
			world.updateMatrixWorld(true);
			if (research)
				for (let h = 0; h < 2; h++) {
					const contact = clip.name.startsWith('workstation_')
						? h === 0
							? computer.targets.pushLeft
							: computer.targets.pushRight
						: clip.name === 'research_smack'
							? computer.targets.smack
							: clip.name === 'research_cable'
								? computer.targets.cable
								: h === 0
									? computer.targets.left
									: computer.targets.right;
					contact.getWorldPosition(target);
					reachContact(arms[h], hands[h], target, 1);
				}
			world.updateMatrixWorld(true);
			clear();
			for (const hand of hands) {
				const vertices = hand.geometry.getAttribute('position');
				for (const prop of obstacles) {
					if (!research && computer.root.getObjectById(prop.id)) continue;
					inverse.copy(prop.matrixWorld).invert().multiply(hand.matrixWorld);
					const box = prop.geometry.boundingBox!.clone().expandByScalar(-0.0001);
					for (let v = 0; v < vertices.count; v++) {
						point.fromBufferAttribute(vertices, v).applyMatrix4(inverse);
						if (box.containsPoint(point)) {
							collisions++;
						}
					}
				}
			}
			expect(
				hands[0].getWorldPosition(point).distanceTo(hands[1].getWorldPosition(target))
			).toBeGreaterThan(0.4);
		}
	}
	expect(collisions).toBe(0);
	computer.dispose();
});
