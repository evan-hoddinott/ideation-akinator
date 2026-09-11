import * as THREE from 'three';

/** Both the HTML reading area and the camera-facing prop use this footprint. */
export function documentLayout(width: number, height: number) {
	const paperWidth = Math.min(1120, width - (width <= 760 ? 72 : 112));
	const top = Math.max(80, height * 0.14);
	return {
		width: paperWidth,
		height: Math.max(100, height - top - 48),
		left: (width - paperWidth) / 2,
		top
	};
}

export function heldProgress(time: number, duration: number, fps = 12) {
	return THREE.MathUtils.clamp(Math.floor(time * fps) / (duration * fps), 0, 1);
}

/** Authored folds and curled corners, with a separate rim for the readable HTML inset. */
export function createPaperProp() {
	const root = new THREE.Group();
	const geometry = new THREE.PlaneGeometry(1.035, 1.035, 48, 56);
	const positions = geometry.attributes.position;
	for (let i = 0; i < positions.count; i++) {
		const x = positions.getX(i),
			y = positions.getY(i);
		const edge = Math.pow(Math.max(Math.abs(x), Math.abs(y)) / 0.5175, 7);
		const fold = Math.abs(x * 0.7 + y * 0.45 - 0.09) * 0.024 + Math.abs(x - y * 0.8 + 0.2) * 0.018;
		positions.setXYZ(
			i,
			x + edge * Math.sin(y * 37) * 0.004,
			y + edge * Math.sin(x * 29) * 0.005,
			(fold + edge * (0.014 + Math.sin(x * 19 + y * 13) * 0.012)) * 0.45
		);
	}
	geometry.computeVertexNormals();
	const material = new THREE.MeshStandardMaterial({
		color: 0xf1dfb7,
		roughness: 1,
		side: THREE.DoubleSide,
		flatShading: true
	});
	let colorTexture: THREE.Texture | undefined;
	let normalTexture: THREE.Texture | undefined;
	if (typeof document !== 'undefined') {
		const loader = new THREE.TextureLoader();
		colorTexture = loader.load('/images/props/paper-color.jpg');
		colorTexture.colorSpace = THREE.SRGBColorSpace;
		normalTexture = loader.load('/images/props/paper-normalgl.jpg');
		material.map = colorTexture;
		material.normalMap = normalTexture;
		material.normalScale.set(0.5, 0.5);
	}
	const sheet = new THREE.Mesh(geometry, material);
	root.add(sheet);
	const rimGeometry = geometry.clone();
	const indices = geometry.index!;
	const rimIndices: number[] = [];
	for (let i = 0; i < indices.count; i += 3) {
		const vertices = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
		if (
			vertices.every((v) => Math.abs(positions.getX(v)) >= 0.47) ||
			vertices.every((v) => Math.abs(positions.getY(v)) >= 0.47)
		)
			rimIndices.push(...vertices);
	}
	rimGeometry.setIndex(rimIndices);
	const rim = new THREE.Mesh(rimGeometry, material);
	root.add(rim);
	const windowMaterial = new THREE.MeshBasicMaterial({
		color: 0,
		blending: THREE.NoBlending,
		opacity: 0
	});
	windowMaterial.userData.outlineParameters = { visible: false };
	const window = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), windowMaterial);
	root.add(window);
	const rollerMaterial = new THREE.MeshStandardMaterial({
		color: 0xb98a48,
		roughness: 0.9,
		flatShading: true
	});
	const rollerGeometry = new THREE.CylinderGeometry(0.033, 0.033, 1.13, 8);
	const rollers = [-1, 1].map((side) => {
		const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
		roller.rotation.z = Math.PI / 2;
		roller.position.set(0, side * 0.52, 0.04);
		root.add(roller);
		return roller;
	});
	return {
		root,
		update(reading: boolean, scroll: boolean, opening = 1) {
			sheet.visible = !reading;
			rim.visible = reading;
			window.visible = reading;
			for (const roller of rollers) {
				roller.visible = scroll;
				roller.scale.set(1 / Math.max(opening, 0.06), 1, 1);
				roller.quaternion
					.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
					.multiply(
						new THREE.Quaternion().setFromAxisAngle(
							new THREE.Vector3(0, 1, 0),
							opening * Math.PI * 4
						)
					);
			}
		},
		dispose() {
			colorTexture?.dispose();
			normalTexture?.dispose();
			geometry.dispose();
			rimGeometry.dispose();
			window.geometry.dispose();
			rollerGeometry.dispose();
			material.dispose();
			windowMaterial.dispose();
			rollerMaterial.dispose();
		}
	};
}
