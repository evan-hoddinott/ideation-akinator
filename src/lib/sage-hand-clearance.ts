import { Box3, Matrix4, Mesh, Object3D, Vector3 } from 'three';

/** Conservative mitten spheres against each prop's oriented local bounds. */
export function createHandClearance(sage: Object3D, workstation: Object3D) {
	const hands = ['HandL', 'HandR'].map((name) => sage.getObjectByName(name) as Mesh);
	const obstacles: { mesh: Mesh; box: Box3; inverse: Matrix4; scale: number }[] = [];
	for (const root of [sage, workstation])
		root.traverse((mesh) => {
			if (!(mesh instanceof Mesh) || hands.includes(mesh)) return;
			mesh.geometry.computeBoundingBox();
			obstacles.push({
				mesh,
				box: mesh.geometry.boundingBox!.clone(),
				inverse: new Matrix4(),
				scale: 1
			});
		});
	const radii = hands.map((hand) => {
		hand.geometry.computeBoundingSphere();
		return hand.geometry.boundingSphere!.radius;
	});
	const desired = new Vector3();
	const directions: Vector3[] = [];
	for (let x = -1; x <= 1; x++)
		for (let y = -1; y <= 1; y++)
			for (let z = -1; z <= 1; z++) {
				if (x || y || z) directions.push(new Vector3(x, y, z).normalize());
			}
	const center = new Vector3(),
		local = new Vector3(),
		nearest = new Vector3();
	const direction = new Vector3(),
		scale = new Vector3(),
		other = new Vector3();
	const visible = (mesh: Object3D): boolean => {
		for (let node: Object3D | null = mesh; node; node = node.parent)
			if (!node.visible) return false;
		return true;
	};
	return () => {
		const active = obstacles.filter(({ mesh }) => visible(mesh));
		for (const obstacle of active) {
			obstacle.inverse.copy(obstacle.mesh.matrixWorld).invert();
			obstacle.mesh.getWorldScale(scale);
			obstacle.scale = Math.min(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
		}
		for (let h = 0; h < hands.length; h++) {
			const hand = hands[h];
			hand.getWorldPosition(center);
			desired.copy(center);
			hand.getWorldScale(scale);
			const radius =
				radii[h] * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)) + 0.012;
			for (let pass = 0; pass < 24; pass++) {
				let moved = false;
				for (const { mesh, box, inverse, scale: obstacleScale } of active) {
					local.copy(center).applyMatrix4(inverse);
					box.clampPoint(local, nearest);
					direction.subVectors(local, nearest);
					const distance = direction.length(),
						clearance = radius / obstacleScale;
					if (distance >= clearance) continue;
					if (distance > 1e-8) local.addScaledVector(direction, (clearance - distance) / distance);
					else {
						let depth = Infinity;
						let axis: 'x' | 'y' | 'z' = 'x';
						let side = 1;
						for (const candidate of ['x', 'y', 'z'] as const) {
							for (const sign of [-1, 1]) {
								const gap =
									sign === -1
										? local[candidate] - box.min[candidate]
										: box.max[candidate] - local[candidate];
								if (gap < depth) {
									depth = gap;
									axis = candidate;
									side = sign;
								}
							}
						}
						local[axis] = (side === -1 ? box.min[axis] : box.max[axis]) + side * clearance;
					}
					center.copy(local).applyMatrix4(mesh.matrixWorld);
					moved = true;
				}
				// Resolve the second mitten against the already placed first mitten.
				if (h === 1) {
					hands[0].getWorldPosition(other);
					direction.subVectors(center, other);
					const distance = direction.length();
					hands[0].getWorldScale(scale);
					const separation =
						radius +
						radii[0] * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)) +
						0.012;
					if (distance < separation) {
						if (distance < 1e-8) direction.set(1, 0, 0);
						else direction.divideScalar(distance);
						center.copy(other).addScaledVector(direction, separation);
						moved = true;
					}
				}
				if (!moved) break;
			}
			// In a tight corner, successive pushes can oppose each other. Find
			// the nearest free floating position around the authored gesture.
			const isClear = () => {
				for (const { box, inverse, scale: obstacleScale } of active) {
					local.copy(center).applyMatrix4(inverse);
					if (box.distanceToPoint(local) < radius / obstacleScale - 0.00001) return false;
				}
				if (h === 1) {
					hands[0].getWorldPosition(other);
					hands[0].getWorldScale(scale);
					if (
						center.distanceTo(other) <
						radius +
							radii[0] * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)) +
							0.011
					)
						return false;
				}
				return true;
			};
			if (!isClear()) {
				search: for (let distance = 0.08; distance <= 6; distance += 0.08) {
					for (const direction of directions) {
						center.copy(desired).addScaledVector(direction, distance);
						if (isClear()) break search;
					}
				}
			}
			hand.position.copy(hand.parent!.worldToLocal(center));
			hand.updateMatrixWorld(true);
		}
	};
}
