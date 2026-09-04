import type { Object3D, Quaternion, Vector3 } from 'three';

interface TransformSnapshot {
	position: Vector3;
	quaternion: Quaternion;
	scale: Vector3;
}

/**
 * Keeps procedural motion separate from transforms owned by an animation mixer.
 *
 * Restore the last clean mixer pose before advancing the mixer, capture the new
 * clean pose, then add gaze, speech, or secondary motion for the rendered frame.
 */
export class AuthoredPoseLayer {
	private readonly snapshots = new Map<Object3D, TransformSnapshot>();

	constructor(nodes: Array<Object3D | null | undefined>) {
		for (const node of nodes) {
			if (!node || this.snapshots.has(node)) continue;
			this.snapshots.set(node, {
				position: node.position.clone(),
				quaternion: node.quaternion.clone(),
				scale: node.scale.clone()
			});
		}
	}

	restore(): void {
		for (const [node, snapshot] of this.snapshots) {
			node.position.copy(snapshot.position);
			node.quaternion.copy(snapshot.quaternion);
			node.scale.copy(snapshot.scale);
		}
	}

	capture(): void {
		for (const [node, snapshot] of this.snapshots) {
			snapshot.position.copy(node.position);
			snapshot.quaternion.copy(node.quaternion);
			snapshot.scale.copy(node.scale);
		}
	}
}
