import * as THREE from 'three';
import { createPurl } from './purl-3d';

export type WorkstationPhase =
	| 'exit'
	| 'arrival'
	| 'parking'
	| 'turning'
	| 'researching'
	| 'noticed'
	| 'printing'
	| 'lifting'
	| 'presenting';
export type ConceptPerformancePhase =
	'composing' | 'mail-arrival' | 'monitor-grip' | 'monitor-turn' | 'desktop-zoom';
export interface WorkstationView {
	screen: HTMLDivElement;
	phase: WorkstationPhase | ConceptPerformancePhase;
	elapsedSeconds?: number;
	purpose?: 'concepts';
	paper?: HTMLElement;
}

/** Physical props use the Sage's world units. The CRT faces the seated wizard. */
export function createWorkstation() {
	const root = new THREE.Group();
	root.name = 'ResearchWorkstation';
	const cream = new THREE.MeshStandardMaterial({ color: 0xd1c5ab, roughness: 0.83 });
	const light = new THREE.MeshStandardMaterial({ color: 0xf0e2c5, roughness: 0.78 });
	const dark = new THREE.MeshStandardMaterial({ color: 0x626777, roughness: 0.85 });
	const metal = new THREE.MeshStandardMaterial({
		color: 0x8d8d88,
		metalness: 0.08,
		roughness: 0.9
	});
	const purple = new THREE.MeshStandardMaterial({ color: 0x998bad, roughness: 0.7 });
	const green = new THREE.MeshBasicMaterial({ color: 0xb1d9a1 });
	const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xfff4d8, side: THREE.DoubleSide });
	// Cut a depth-tested window through the WebGL canvas to the browser display below.
	// Hands and the tower can still occlude the screen using the scene's depth buffer.
	const screenMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		blending: THREE.NoBlending,
		opacity: 0
	});
	const box = (
		name: string,
		size: number[],
		position: number[],
		material: THREE.Material = cream,
		parent: THREE.Object3D = root
	) => {
		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(...(size as [number, number, number])),
			material
		);
		mesh.name = name;
		mesh.position.set(...(position as [number, number, number]));
		parent.add(mesh);
		return mesh;
	};
	const cylinder = (
		name: string,
		radius: number,
		length: number,
		position: number[],
		material = metal
	) => {
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
		mesh.name = name;
		mesh.position.set(...(position as [number, number, number]));
		root.add(mesh);
		return mesh;
	};
	box('CartDesktop', [2.8, 0.13, 1.5], [0, 1.22, 0], metal);
	box('CartLowerShelf', [2.64, 0.1, 1.32], [0, 0.32, 0], dark);
	const wheels: THREE.Mesh[] = [];
	for (const x of [-1.18, 1.18])
		for (const z of [-0.55, 0.55]) {
			cylinder('CartLeg', 0.055, 0.95, [x, 0.72, z]);
			box('CasterFork', [0.16, 0.18, 0.12], [x, 0.15, z], metal);
			const wheel = cylinder('CartWheel', 0.15, 0.12, [x, 0.035, z], dark);
			wheel.rotation.z = Math.PI / 2;
			wheels.push(wheel);
			const hub = cylinder('WheelHub', 0.065, 0.135, [x, 0.035, z], light);
			hub.rotation.z = Math.PI / 2;
		}
	box('MonitorFoot', [0.86, 0.08, 0.55], [-0.32, 1.33, -0.18], light);
	box('MonitorNeck', [0.28, 0.25, 0.23], [-0.32, 1.47, -0.24], cream);
	const monitor = new THREE.Group();
	monitor.name = 'ResearchCRT';
	monitor.position.set(-0.32, 2.03, -0.22);
	monitor.rotation.y = 0.35;
	root.add(monitor);
	box('CRTDeepCase', [1.52, 1.13, 0.85], [0, 0, -0.16], cream, monitor);
	box('CRTRearCase', [1.13, 0.87, 0.35], [0, 0.02, -0.72], dark, monitor);
	// An actual open bezel surrounds the projected browser display.
	box('BezelTop', [1.64, 0.14, 0.17], [0, 0.55, 0.32], light, monitor);
	box('BezelBottom', [1.64, 0.21, 0.17], [0, -0.515, 0.32], light, monitor);
	box('BezelLeft', [0.16, 0.93, 0.17], [-0.74, 0.03, 0.32], light, monitor);
	box('BezelRight', [0.16, 0.93, 0.17], [0.74, 0.03, 0.32], light, monitor);
	const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.88), screenMaterial);
	screen.name = 'ResearchDisplay';
	screenMaterial.userData.outlineParameters = { visible: false };
	screen.position.set(0, 0.04, 0.409);
	monitor.add(screen);
	const power = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), green);
	power.position.set(0.59, -0.52, 0.415);
	monitor.add(power);
	for (let i = 0; i < 7; i++) {
		box('CRTVent', [0.012, 0.32, 0.025], [0.766, 0.05, -0.46 + i * 0.072], dark, monitor);
	}
	const tower = new THREE.Group();
	tower.position.set(0.12, 0, -0.24);
	root.add(tower);
	box('ComputerTower', [0.56, 0.83, 1.02], [0.96, 1.7, -0.12], cream, tower);
	box('TowerFront', [0.58, 0.85, 0.07], [0.96, 1.7, 0.43], light, tower);
	for (const y of [1.88, 1.76]) box('DiskDrive', [0.4, 0.07, 0.026], [0.96, y, 0.478], dark, tower);
	for (let i = 0; i < 5; i++)
		box('TowerVent', [0.37, 0.016, 0.02], [0.96, 1.41 + i * 0.038, 0.48], dark, tower);
	const towerLED = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.025), green);
	towerLED.position.set(1.12, 1.65, 0.49);
	tower.add(towerLED);
	box('KeyboardTray', [1.6, 0.055, 0.76], [-0.75, 1.27, 0.96], metal);
	box('Keyboard', [1.36, 0.07, 0.4], [-0.75, 1.33, 1.0], light);
	const pushHandle = cylinder('CartPushHandle', 0.045, 1.5, [-0.4, 1.37, 1.35], dark);
	pushHandle.rotation.z = Math.PI / 2;
	for (const x of [-1.1, 0.3]) box('HandleBracket', [0.045, 0.2, 0.65], [x, 1.28, 1.05], metal);
	for (let row = 0; row < 4; row++)
		for (let col = 0; col < 12; col++) {
			box(
				'Key',
				[0.087, 0.026, 0.061],
				[-1.29 + col * 0.098, 1.379, 0.87 + row * 0.085],
				row === 3 && col > 3 && col < 8 ? purple : cream
			);
		}
	for (const x of [-1.16, 0.57]) {
		box('Speaker', [0.23, 0.36, 0.25], [x, 1.46, 0.12], light);
		const cone = cylinder('SpeakerCone', 0.076, 0.028, [x, 1.47, 0.263], dark);
		cone.rotation.x = Math.PI / 2;
	}
	box('Printer', [1.14, 0.32, 0.76], [-0.3, 0.55, 0.15], light);
	box('PrinterSlot', [0.9, 0.045, 0.02], [-0.3, 0.59, 0.54], dark);
	box('PrinterOutputTray', [0.84, 0.018, 0.82], [-0.3, 0.555, 0.94], dark);
	const printerLight = box('PrinterReadyLight', [0.07, 0.045, 0.025], [0.14, 0.65, 0.545], green);
	const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.76), paperMaterial);
	paper.name = 'PrintedResearch';
	paper.rotation.x = -Math.PI / 2;
	paper.position.set(-0.3, 0.58, 0.65);
	root.add(paper);
	for (let i = 0; i < 5; i++)
		box('PrintedLine', [0.5 - (i % 2) * 0.12, 0.013, 0.003], [0, 0, 0], dark, paper).position.set(
			-0.04,
			-0.22 + i * 0.09,
			0.004
		);
	cylinder('SageMug', 0.12, 0.24, [-1.15, 1.42, -0.46], purple);
	const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.027, 4, 8), purple);
	handle.position.set(-1.3, 1.43, -0.46);
	root.add(handle);
	const cablePath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(0.95, 1.55, -0.65),
		new THREE.Vector3(1.48, 0.85, -0.7),
		new THREE.Vector3(1.46, 0.12, 0.2),
		new THREE.Vector3(0.65, 0.2, 0.55),
		new THREE.Vector3(0.4, 0.8, -0.62),
		new THREE.Vector3(-0.3, 1.8, -0.9)
	]);
	root.add(new THREE.Mesh(new THREE.TubeGeometry(cablePath, 24, 0.024, 5, false), purple));
	root.position.set(1.85, -0.2, 0.1);
	root.rotation.y = -1.05;
	const contact = (x: number, y: number, z: number) => {
		const target = new THREE.Object3D();
		target.position.set(x, y, z);
		root.add(target);
		return target;
	};
	const targets = {
		left: contact(-0.4, 1.65, 1.08),
		pushLeft: contact(-0.64, 1.45, 1.35),
		pushRight: contact(-1, 1.45, 1.35),
		right: contact(-1.1, 1.65, 1.08),
		smack: contact(0.38, 2.61, -0.18),
		cable: contact(1.4, 0.87, -0.5)
	};
	const monitorContact = (y: number, z: number) => {
		const target = new THREE.Object3D();
		target.position.set(-0.83, y, z);
		monitor.add(target);
		return target;
	};
	// Both hands grip the accessible side of the heavy CRT, at the bezel and rear case.
	const monitorGrips = [monitorContact(0.12, 0.36), monitorContact(-0.24, -0.28)];
	const cat = createPurl();
	const purl = cat.root;
	purl.scale.setScalar(0.65);
	purl.position.set(0.05, 1.4, 0.85);
	purl.rotation.y = 1.05;
	purl.visible = false;
	root.add(purl);
	return {
		root,
		monitor,
		monitorGrips,
		screen,
		paper,
		targets,
		update(phase: WorkstationPhase | ConceptPerformancePhase, time: number, phaseTime: number) {
			const conceptPhase = [
				'composing',
				'mail-arrival',
				'monitor-grip',
				'monitor-turn',
				'desktop-zoom'
			].includes(phase);
			purl.visible = conceptPhase;
			const pawing = phase === 'composing' && Math.floor(phaseTime / 3) % 3 === 1;
			cat.update(time, pawing ? 'paw' : phase === 'mail-arrival' ? 'alert' : 'sit');
			const turn =
				phase === 'desktop-zoom'
					? 1
					: phase === 'monitor-turn'
						? THREE.MathUtils.smoothstep(phaseTime, 0, 2.2)
						: 0;
			monitor.position.y = 2.13;
			monitor.rotation.y = THREE.MathUtils.lerp(conceptPhase ? 0 : 0.35, 1.05, turn);
			paper.visible = phase === 'printing';
			paper.scale.y = THREE.MathUtils.clamp(phaseTime / 2.4, 0.01, 1);
			paper.position.z = 0.55 + paper.scale.y * 0.38;
			printerLight.visible =
				['noticed', 'printing', 'lifting', 'presenting'].includes(phase) &&
				(phase !== 'printing' || Math.sin(time * 10) > -0.3);
			for (const wheel of wheels) if (phase === 'arrival') wheel.rotateY(-0.18);
			towerLED.visible = Math.sin(time * 9) > -0.5;
		},
		dispose() {
			root.traverse((object) => {
				if (object instanceof THREE.Mesh) object.geometry.dispose();
			});
			for (const material of [
				cream,
				light,
				dark,
				metal,
				purple,
				green,
				paperMaterial,
				screenMaterial
			])
				material.dispose();
			cat.dispose();
		}
	};
}

/** Maps a 320x240 DOM display to the exact perspective plane, without reparenting Svelte DOM. */
export function projectDisplay(
	element: HTMLElement,
	screen: THREE.Object3D,
	camera: THREE.Camera,
	rect: DOMRect
) {
	const local = new THREE.Matrix4().set(
		1.32 / (element.clientWidth || 320),
		0,
		0,
		-0.66,
		0,
		-0.88 / (element.clientHeight || 240),
		0,
		0.44,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1
	);
	const clip = new THREE.Matrix4()
		.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
		.multiply(screen.matrixWorld)
		.multiply(local);
	const viewport = new THREE.Matrix4().set(
		rect.width / 2,
		0,
		0,
		rect.left + rect.width / 2,
		0,
		-rect.height / 2,
		0,
		rect.top + rect.height / 2,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1
	);
	const matrix = viewport.multiply(clip);
	// CSS requires a positive homogeneous scale, normalized to the display's origin.
	const divisor = matrix.elements[15];
	if (element.dataset?.desktopExpand === 'true') return;
	element.style.transform = `matrix3d(${matrix.elements.map((value) => value / divisor).join(',')})`;
}

/** CCD keeps the original articulated sleeves and hands attached to fixed prop contacts. */
export function reachContact(
	joints: THREE.Object3D[],
	hand: THREE.Object3D,
	target: THREE.Vector3,
	weight: number,
	iterations = 5
) {
	const origin = new THREE.Vector3(),
		end = new THREE.Vector3();
	const from = new THREE.Vector3(),
		to = new THREE.Vector3();
	const parentRotation = new THREE.Quaternion(),
		rotation = new THREE.Quaternion();
	for (let pass = 0; pass < iterations; pass++)
		for (const joint of joints) {
			joint.getWorldPosition(origin);
			hand.getWorldPosition(end);
			from.copy(end).sub(origin).normalize();
			to.copy(target).sub(origin).normalize();
			rotation.setFromUnitVectors(from, to);
			joint.parent!.getWorldQuaternion(parentRotation);
			rotation.premultiply(parentRotation.clone().invert()).multiply(parentRotation);
			rotation.slerp(new THREE.Quaternion(), 1 - weight);
			joint.quaternion.premultiply(rotation);
			joint.updateWorldMatrix(false, true);
		}
}
