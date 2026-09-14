import * as THREE from 'three';
export type PurlAction = 'sit' | 'paw' | 'sleep' | 'groom' | 'alert' | 'yawn' | 'walk' | 'run';
/** Original low-poly Purl. All joints share the same floor anchor. */
export function createPurl() {
	const root = new THREE.Group();
	root.name = 'Purl';
	const fur = new THREE.MeshStandardMaterial({ color: 0xe9e1cb, roughness: 1, flatShading: true });
	const dark = new THREE.MeshStandardMaterial({ color: 0x45404b, roughness: 1, flatShading: true });
	const pink = new THREE.MeshStandardMaterial({ color: 0xc18c91, roughness: 1, flatShading: true });
	const mesh = (
		shape: THREE.BufferGeometry,
		material: THREE.Material,
		parent: THREE.Object3D,
		x: number,
		y: number,
		z: number
	) => {
		const m = new THREE.Mesh(shape, material);
		m.position.set(x, y, z);
		parent.add(m);
		return m;
	};
	const body = mesh(new THREE.IcosahedronGeometry(0.4, 1), fur, root, 0, 0.48, 0);
	body.scale.set(1, 1.02, 1.25);
	const head = new THREE.Group();
	head.position.set(0, 0.91, 0.31);
	root.add(head);
	mesh(new THREE.IcosahedronGeometry(0.34, 1), fur, head, 0, 0, 0).scale.set(1.12, 1, 0.98);
	const ears = [-1, 1].map((side) => {
		const ear = mesh(new THREE.ConeGeometry(0.145, 0.23, 4), fur, head, side * 0.2, 0.28, 0);
		ear.rotation.z = side * -0.2;
		mesh(new THREE.ConeGeometry(0.083, 0.14, 4), pink, ear, 0, 0, 0.055);
		return ear;
	});
	for (const side of [-1, 1]) {
		const eye = mesh(new THREE.SphereGeometry(0.035, 6, 4), dark, head, side * 0.14, 0.015, 0.318);
		eye.name = 'eye';
		mesh(new THREE.IcosahedronGeometry(0.12, 1), fur, head, side * 0.085, -0.095, 0.29);
	}
	mesh(new THREE.ConeGeometry(0.042, 0.055, 3), pink, head, 0, -0.075, 0.405).rotation.z = Math.PI;
	const legs = [
		[-0.23, 0.28],
		[0.23, 0.28],
		[-0.23, -0.29],
		[0.23, -0.29]
	].map(([x, z]) => {
		const joint = new THREE.Group();
		joint.position.set(x, 0.36, z);
		root.add(joint);
		mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.31, 5), fur, joint, 0, -0.14, 0);
		mesh(new THREE.IcosahedronGeometry(0.12, 0), fur, joint, 0, -0.29, 0.05).scale.set(
			1,
			0.65,
			1.3
		);
		return joint;
	});
	const tail = new THREE.Group();
	tail.position.set(0, 0.52, -0.42);
	tail.rotation.x = -0.7;
	root.add(tail);
	mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6), fur, tail, 0, 0.2, 0);
	mesh(new THREE.IcosahedronGeometry(0.105, 1), dark, tail, 0, 0.48, 0);
	return {
		root,
		update(time: number, action: PurlAction = 'sit', calm = false) {
			const t = calm ? 0 : time;
			head.children
				.filter((child) => child.name === 'eye')
				.forEach((eye) => {
					eye.scale.y = action === 'sleep' || Math.sin(t * 0.85) > 0.992 ? 0.15 : 1;
				});
			const moving = action === 'walk' || action === 'run';
			const pace = action === 'run' ? 15 : 7;
			body.position.y =
				0.48 + (moving ? Math.abs(Math.sin(t * pace)) * 0.065 : Math.sin(t * 2) * 0.012);
			body.rotation.x = action === 'sleep' ? 0.5 : 0;
			head.rotation.set(
				action === 'groom' ? Math.sin(t * 5) * 0.2 : action === 'sleep' ? 0.4 : 0,
				action === 'alert' ? 0.25 : Math.sin(t * 0.9) * 0.09,
				action === 'yawn' ? 0.13 : 0
			);
			legs.forEach((leg, i) => {
				leg.rotation.x = moving
					? Math.sin(t * pace + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.65
					: action === 'paw' && i === 0
						? -0.9 + Math.sin(t * 7) * 0.3
						: 0;
			});
			tail.rotation.z = Math.sin(t * 2) * 0.3;
			ears.forEach((ear, i) => (ear.rotation.x = Math.max(0, Math.sin(t * 1.3 + i)) * 0.15));
		},
		dispose() {
			root.traverse((o) => {
				if (o instanceof THREE.Mesh) o.geometry.dispose();
			});
			[fur, dark, pink].forEach((m) => m.dispose());
		}
	};
}
