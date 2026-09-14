<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import type { MagicBallFrame } from '$lib/magic-ball';
	import type { AnimationAction, Object3D } from 'three';
	import type { WorkstationView } from '$lib/workstation-3d';
	import type { SagePersonality } from '$lib/personality';
	import type { OracleEffect } from '$lib/oracle-audio';
	import { SageAnimationDirector } from '$lib/sage-animation';
	import { pixelViewport, cozyMaterialColors } from '$lib/cozy-render';
	import { heldScroll } from '$lib/held-scroll';
	import { AuthoredPoseLayer } from '$lib/authored-pose-layer';
	import {
		clipForMood,
		faceProfileForMood,
		normalizedCursorTarget,
		speechMeter,
		type SageClip,
		type SageScreenAnchors
	} from '$lib/sage-stage';

	let {
		personality,
		altitude,
		researching = false,
		workstation = null,
		magicBall = null,
		paused = false,
		speaking = false,
		voicePulse = 0,
		voiceEnergy = 0.5,
		performance = null,
		resetSignal = 0,
		allowPopup = true,
		onAnchors = () => {},
		onFallbackChange = () => {},
		onEffect = () => {},
		onSecret
	}: {
		personality: SagePersonality;
		altitude: number;
		researching?: boolean;
		workstation?: WorkstationView | null;
		magicBall?: MagicBallFrame | null;
		paused?: boolean;
		speaking?: boolean;
		voicePulse?: number;
		voiceEnergy?: number;
		performance?: SageClip | null;
		resetSignal?: number;
		allowPopup?: boolean;
		onAnchors?: (anchors: SageScreenAnchors) => void;
		onFallbackChange?: (fallback: boolean) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
		onSecret: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();
	let stageElement = $state<HTMLDivElement>();
	let modelReady = $state(false);
	let activeClip = $state<SageClip>('idle');
	let modelFailed = $state(false);
	let motionFallback = $state(false);
	let useFallback = $derived(personality.calmMode || motionFallback || modelFailed);
	$effect(() => onFallbackChange(useFallback));
	let popupVisible = $state(false);
	let popupSwatting = $state(false);
	let popupImpact = $state(false);
	type PopupPhase =
		'hidden' | 'ignoring' | 'glance' | 'waiting' | 'comment' | 'anticipate' | 'swat';
	let popupPhase = $state<PopupPhase>('hidden');
	let popupTimers: number[] = [];
	let resetting = $state(false);
	let lastResetSignal = untrack(() => resetSignal);
	let playClip: ((clip: SageClip, returnToIdle?: boolean) => void) | null = null;
	let lastReactionCounter = -1;
	let lastPerformance: SageClip | null = null;
	let lastSpeaking = false;
	let lastAltitude = 0;
	let mounted = false;
	let threeStarted = false;
	let cleanupThree = () => {};
	let cursorX = 0;
	let cursorY = 0;

	$effect(() => {
		if (resetSignal <= lastResetSignal) return;
		lastResetSignal = resetSignal;
		resetting = true;
		playClip?.('drop', false);
		onEffect('sage-error', 0.34);
		const timer = window.setTimeout(() => (resetting = false), 3_050);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		const counter = personality.eventCounter;
		const mood = personality.mood;
		if (!playClip || performance || popupSwatting || counter === lastReactionCounter) return;
		lastReactionCounter = counter;
		playClip(clipForMood(mood), true);
	});

	$effect(() => {
		const requested = performance;
		if (!playClip || requested === lastPerformance) return;
		lastPerformance = requested;
		playClip(requested ?? 'idle', false);
	});

	$effect(() => {
		const nowSpeaking = speaking;
		if (!playClip || performance || popupSwatting || nowSpeaking === lastSpeaking) return;
		lastSpeaking = nowSpeaking;
		if (nowSpeaking) playClip('talk', false);
		else playClip('idle', false);
	});

	$effect(() => {
		const nextAltitude = altitude;
		if (!playClip || performance || Math.abs(nextAltitude - lastAltitude) < 0.018) return;
		lastAltitude = nextAltitude;
		playClip('ascend', true);
	});

	$effect(() => {
		const calmMode = personality.calmMode;
		const fallback = motionFallback;
		if (!mounted || paused || calmMode || fallback || threeStarted) return;
		void startThree();
	});

	$effect(() => {
		if (
			!allowPopup ||
			!!$heldScroll ||
			workstation?.phase === 'lifting' ||
			workstation?.phase === 'presenting' ||
			personality.calmMode ||
			personality.achievements.includes('FORBIDDEN FLOPPY') ||
			popupVisible
		)
			return;
		const popupTimer = window.setTimeout(showPopupTutorial, 2_200);
		return () => window.clearTimeout(popupTimer);
	});

	function showPopupTutorial() {
		popupVisible = true;
		popupPhase = 'ignoring';
		onEffect('popup-appear', 0.28);
		popupTimers.forEach((timer) => window.clearTimeout(timer));
		popupTimers = [
			window.setTimeout(() => {
				popupPhase = 'glance';
				playClip?.('popup_notice', true);
			}, 900),
			window.setTimeout(() => (popupPhase = 'waiting'), 1_650),
			window.setTimeout(() => (popupPhase = 'comment'), 2_750),
			window.setTimeout(() => {
				popupPhase = 'anticipate';
				playClip?.('popup_swat', false);
			}, 3_850),
			window.setTimeout(swatPopup, 4_250)
		];
	}

	function dismissPopup() {
		if (popupSwatting) return;
		popupTimers.forEach((timer) => window.clearTimeout(timer));
		popupVisible = false;
		popupPhase = 'hidden';
		onEffect('popup-flight', 0.22);
		playClip?.('approval', true);
		onSecret();
	}

	function swatPopup() {
		if (popupSwatting) return;
		popupSwatting = true;
		popupPhase = 'swat';
		window.setTimeout(() => {
			popupImpact = true;
			onEffect('popup-contact', 0.42);
		}, 400);
		window.setTimeout(() => onEffect('popup-flight', 0.3), 470);
		window.setTimeout(() => {
			popupVisible = false;
			popupImpact = false;
			popupPhase = 'hidden';
		}, 1_060);
		window.setTimeout(() => {
			popupSwatting = false;
			onSecret();
		}, 1_500);
	}

	function trackPointer(event: PointerEvent) {
		const target = normalizedCursorTarget(
			event.clientX,
			event.clientY,
			window.innerWidth,
			window.innerHeight
		);
		cursorX = target.x;
		cursorY = target.y;
	}

	onMount(() => {
		mounted = true;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const forcedFallback = new URL(window.location.href).searchParams.has('sageFallback');
		motionFallback = reduceMotion || forcedFallback;
		window.addEventListener('pointermove', trackPointer, { passive: true });
		void startThree();
		return () => {
			mounted = false;
			window.removeEventListener('pointermove', trackPointer);
		};
	});

	onDestroy(() => {
		popupTimers.forEach((timer) => window.clearTimeout(timer));
		cleanupThree();
	});

	async function startThree() {
		if (paused || personality.calmMode || motionFallback || threeStarted || !canvas || !container)
			return;
		threeStarted = true;

		try {
			const THREE = await import('three');
			const { createPaperProp, documentLayout, heldProgress } = await import('$lib/paper-3d');
			const [
				{ GLTFLoader },
				{ OutlineEffect },
				{ createWorkstation, projectDisplay, reachContact },
				{ createHandClearance }
			] = await Promise.all([
				import('three/examples/jsm/loaders/GLTFLoader.js'),
				import('three/examples/jsm/effects/OutlineEffect.js'),
				import('$lib/workstation-3d'),
				import('$lib/sage-hand-clearance')
			]);
			const mountContainer = container;
			const renderCanvas = canvas;

			const renderer = new THREE.WebGLRenderer({
				canvas: renderCanvas,
				alpha: true,
				antialias: false,
				powerPreference: 'high-performance'
			});
			const lookQuery = new URL(window.location.href).searchParams;
			const nativeComparison = import.meta.env.DEV && lookQuery.get('sagePixels') === 'native';
			const pixelTarget = import.meta.env.DEV && lookQuery.get('sagePixels') === '480' ? 480 : 360;
			renderer.setPixelRatio(nativeComparison ? Math.min(window.devicePixelRatio, 1.5) : 1);
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1.0;

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);

			scene.add(new THREE.HemisphereLight(0xfff1d6, 0x8fa28a, 2.1));
			const key = new THREE.DirectionalLight(0xffe3bd, 2.1);
			key.position.set(4, 5, 5);
			scene.add(key);
			const rim = new THREE.DirectionalLight(0xc7c9e2, 0.7);
			rim.position.set(-5, 2, -3);
			scene.add(rim);

			const gltf = await new GLTFLoader().loadAsync('/models/signal-sage.glb?v=hat-crunch-07');
			const sage = gltf.scene;
			sage.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				for (const material of Array.isArray(object.material)
					? object.material
					: [object.material]) {
					if (!(material instanceof THREE.MeshStandardMaterial)) continue;
					if (cozyMaterialColors[material.name] !== undefined)
						material.color.setHex(cozyMaterialColors[material.name]);
					material.metalness = Math.min(material.metalness, 0.08);
					material.roughness = Math.max(material.roughness, 0.8);
				}
			});
			sage.rotation.y = -0.08;
			const presentation = new THREE.Group();
			presentation.add(sage);
			const researchScene = new THREE.Group();
			researchScene.add(presentation);
			scene.add(researchScene);
			const computer = createWorkstation();
			researchScene.add(computer.root);
			computer.root.visible = false;

			const { createPurl } = await import('$lib/purl-3d');
			const chaseCat = createPurl();
			scene.add(chaseCat.root);
			chaseCat.root.visible = false;
			const ball = new THREE.Group();
			scene.add(ball);
			ball.visible = false;
			const ballMaterial = new THREE.MeshStandardMaterial({
				color: 0x292635,
				roughness: 0.65,
				flatShading: true
			});
			ball.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 2), ballMaterial));
			const labelCanvas = document.createElement('canvas');
			labelCanvas.width = 64;
			labelCanvas.height = 64;
			const ink = labelCanvas.getContext('2d')!;
			ink.fillStyle = '#eee3ca';
			ink.beginPath();
			ink.arc(32, 32, 28, 0, Math.PI * 2);
			ink.fill();
			ink.fillStyle = '#292635';
			ink.font = 'bold 42px monospace';
			ink.textAlign = 'center';
			ink.fillText('8', 32, 47);
			const labelTexture = new THREE.CanvasTexture(labelCanvas);
			labelTexture.magFilter = THREE.NearestFilter;
			const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
			const ballLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), labelMaterial);
			ballLabel.position.z = 0.243;
			ball.add(ballLabel);
			const paperProp = createPaperProp();
			const carriedPaper = paperProp.root;
			carriedPaper.visible = false;
			scene.add(carriedPaper);
			const pickupPosition = new THREE.Vector3();
			const pickupRotation = new THREE.Quaternion();
			const pickupHands = [new THREE.Vector3(), new THREE.Vector3()];
			const monitorHands = [new THREE.Vector3(), new THREE.Vector3()];
			const cameraHome = new THREE.Vector3();
			const cameraLookHome = new THREE.Vector3(1, -0.1, 0);
			const screenCenter = new THREE.Vector3();

			const mixer = new THREE.AnimationMixer(sage);
			const actions: Record<string, AnimationAction> = {};
			for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);

			// Fit the camera to every authored pose, not just the idle stance. This keeps the
			// hat, chair, and wide hand gestures inside the canvas at every viewport size.
			const poseEnvelope = new THREE.Box3();
			const sampleBounds = new THREE.Box3();
			const framingClips = new Set(['idle', 'shocked', 'popup_swat', 'reveal', 'forbidden']);
			for (const clip of gltf.animations) {
				if (!framingClips.has(clip.name)) continue;
				mixer.stopAllAction();
				mixer.setTime(0);
				const sampleAction = actions[clip.name];
				sampleAction.reset().setLoop(THREE.LoopOnce, 1).play();
				const steps = Math.max(1, Math.ceil(clip.duration * 24));
				for (let step = 0; step <= steps; step += 1) {
					mixer.setTime((clip.duration * step) / steps);
					sage.updateMatrixWorld(true);
					sampleBounds.setFromObject(sage);
					poseEnvelope.union(sampleBounds);
				}
			}
			mixer.stopAllAction();
			mixer.setTime(0);
			const poseCenter = poseEnvelope.getCenter(new THREE.Vector3());
			const poseSize = poseEnvelope.getSize(new THREE.Vector3());
			sage.position.sub(poseCenter);
			computer.root.position.sub(poseCenter);
			const director = new SageAnimationDirector(mixer, actions, () =>
				speaking ? 'talk' : 'idle'
			);
			playClip = (clip, returnToIdle = false) => {
				if ((clip === 'idle' || clip === 'talk') && director.reacting) return;
				director.play(clip, returnToIdle);
			};

			playClip('idle');
			if (performance) {
				lastPerformance = performance;
				playClip(performance, false);
			}
			modelReady = true;

			const outline = new OutlineEffect(renderer, {
				defaultThickness: 0.0025,
				defaultColor: [0.15, 0.12, 0.13],
				defaultAlpha: 0.9,
				defaultKeepAlive: true
			});
			let elapsed = 0;
			let poseRemainder = 0;
			let lastFrame = window.performance.now();
			let frameId = 0;
			let lastFaceStep = -1;
			let lastVoicePulse = voicePulse;
			let lastVoiceAt = 0;
			let smoothedCursorX = 0;
			let smoothedCursorY = 0;
			let researchTurn = 0;
			let lastWorkstationPhase = '';
			let phaseElapsed = 0;
			let wasWorkstation = false;
			const contactPoint = new THREE.Vector3();
			let gazeWeight = 1;
			let lastAnchorUpdate = 0;
			const eyeLeft = sage.getObjectByName('EyeLeft');
			const eyeRight = sage.getObjectByName('EyeRight');
			const mouth = sage.getObjectByName('Mouth');
			const headBone = sage.getObjectByName('head');
			const spineBone = sage.getObjectByName('spine');
			const hatSecondary = sage.getObjectByName('hat_secondary');
			const robeSecondary = sage.getObjectByName('robe_secondary');
			const seatMarker = sage.getObjectByName('ChairSeat');
			const headMarker = sage.getObjectByName('MonitorScreen');
			const leftHandMarker = sage.getObjectByName('HandL');
			const rightHandMarker = sage.getObjectByName('HandR');
			const anchorVector = new THREE.Vector3();
			const leftArm = [sage.getObjectByName('forearmL'), sage.getObjectByName('upper_armL')].filter(
				(part): part is Object3D => !!part
			);
			const rightArm = [
				sage.getObjectByName('forearmR'),
				sage.getObjectByName('upper_armR')
			].filter((part): part is Object3D => !!part);
			const shoes = ['BootL', 'BootR', 'BootSoleL', 'BootSoleR']
				.map((name) => sage.getObjectByName(name))
				.filter((part): part is Object3D => !!part);
			const clearHands = createHandClearance(sage, computer.root);
			const proceduralPose = new AuthoredPoseLayer([
				leftHandMarker,
				rightHandMarker,
				...shoes,
				...leftArm,
				...rightArm,
				headBone,
				spineBone,
				hatSecondary,
				robeSecondary
			]);
			const proceduralEuler = new THREE.Euler();
			const proceduralQuaternion = new THREE.Quaternion();
			const faceParts = [eyeLeft, eyeRight, mouth].filter(
				(part): part is NonNullable<typeof part> => !!part
			);
			for (const part of faceParts) {
				if (!(part instanceof THREE.Mesh)) continue;
				const oldMaterials = Array.isArray(part.material) ? part.material : [part.material];
				part.material = new THREE.MeshBasicMaterial({ color: 0xffbf63, toneMapped: false });
				for (const material of oldMaterials) material.dispose();
			}
			const baseFace = new Map(
				faceParts.map((part) => [
					part,
					{
						position: part.position.clone(),
						rotation: part.rotation.clone(),
						scale: part.scale.clone()
					}
				])
			);

			const resize = () => {
				const width = Math.max(mountContainer.clientWidth, 1);
				const height = Math.max(mountContainer.clientHeight, 1);
				const pixel = pixelViewport(width, height, window.innerHeight, pixelTarget);
				renderer.setSize(
					nativeComparison ? width : pixel.width,
					nativeComparison ? height : pixel.height,
					false
				);
				renderCanvas.dataset.pixelScale = String(nativeComparison ? 1 : pixel.scale);
				camera.aspect = width / height;
				const verticalFov = THREE.MathUtils.degToRad(camera.fov);
				const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
				const fitHeight = (poseSize.y * 1.08) / 0.74;
				const fitWidth = (poseSize.x * 1.08) / 0.78;
				const verticalDistance = fitHeight / 2 / Math.tan(verticalFov / 2);
				const horizontalDistance = fitWidth / 2 / Math.tan(horizontalFov / 2);
				const distance =
					(Math.max(verticalDistance, horizontalDistance) + poseSize.z * 0.55) *
					(magicBall ? 0.82 : researching ? 0.6 : 0.65);
				camera.position.set(0, 0, distance);
				if (workstation || $heldScroll) {
					camera.position.set(1, 0.55, Math.max(8.4, 10.5 / camera.aspect));
					cameraHome.copy(camera.position);
					camera.lookAt(1, -0.1, 0);
					camera.near = 0.1;
					camera.far = 60;
					camera.updateProjectionMatrix();
					return;
				}
				camera.near = Math.max(0.01, distance - poseSize.z * 2);
				camera.far = distance + poseSize.z * 4;
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
			};
			const resizeObserver = new ResizeObserver(resize);
			resizeObserver.observe(mountContainer);
			resize();

			const render = (now = window.performance.now()) => {
				const holdAnimation =
					workstation?.phase === 'lifting' ||
					($heldScroll && $heldScroll.dataset.reading !== 'true');
				if (holdAnimation && now - lastFrame < 1000 / 12) {
					frameId = window.requestAnimationFrame(render);
					return;
				}
				const delta = Math.min((now - lastFrame) / 1000, holdAnimation ? 0.15 : 0.05);
				lastFrame = now;
				if (paused || document.hidden || personality.calmMode || motionFallback) {
					frameId = window.requestAnimationFrame(render);
					return;
				}
				elapsed += delta;

				// The mixer owns the authored pose. Remove last frame's procedural offsets
				// before advancing it, then save a clean base for this rendered frame.
				proceduralPose.restore();
				poseRemainder += delta;
				const poseDelta = Math.floor(poseRemainder * 12) / 12;
				if (poseDelta > 0) {
					director.update(poseDelta);
					poseRemainder -= poseDelta;
				}
				const actionName = director.current;
				if (activeClip !== actionName) activeClip = actionName;
				proceduralPose.capture();
				for (const shoe of shoes) {
					const offset = shoe.name.endsWith('L') ? 0 : Math.PI;
					shoe.position.y += Math.sin(elapsed * 2.3 + offset) * 0.025;
				}
				const scrollElement = $heldScroll;
				const phase = workstation?.phase;
				const phaseKey = scrollElement ? 'unfurling' : (phase ?? '');
				if (!!(workstation || scrollElement) !== wasWorkstation) {
					wasWorkstation = !!(workstation || scrollElement);
					resize();
				}
				if (phase === 'lifting' && lastWorkstationPhase !== 'lifting') {
					scene.updateMatrixWorld(true);
					computer.paper.getWorldPosition(pickupPosition);
					computer.paper.getWorldQuaternion(pickupRotation);
					leftHandMarker?.getWorldPosition(pickupHands[0]);
					rightHandMarker?.getWorldPosition(pickupHands[1]);
				}
				if (scrollElement && phaseKey !== lastWorkstationPhase) {
					leftHandMarker?.getWorldPosition(pickupHands[0]);
					rightHandMarker?.getWorldPosition(pickupHands[1]);
				}
				if (phaseKey !== lastWorkstationPhase) {
					if (phase === 'monitor-grip') {
						leftHandMarker?.getWorldPosition(monitorHands[0]);
						rightHandMarker?.getWorldPosition(monitorHands[1]);
					}
					lastWorkstationPhase = phaseKey;
					phaseElapsed = 0;
				}
				phaseElapsed = scrollElement
					? phaseElapsed + delta
					: (workstation?.elapsedSeconds ?? phaseElapsed + delta);
				computer.root.visible = !!phase && phase !== 'exit' && phase !== 'presenting';
				presentation.scale.setScalar(1);
				presentation.position.x = 0;
				presentation.position.z = 0;
				presentation.position.y = workstation ? 0 : Math.sin(elapsed * 1.3) * 0.024;
				// The chair rolls a short distance toward the cart as he reaches for its near side.
				if (phase && ['monitor-grip', 'monitor-turn', 'desktop-zoom'].includes(phase)) {
					const reach =
						phase === 'monitor-grip' ? THREE.MathUtils.smoothstep(phaseElapsed, 0, 0.9) : 1;
					const turn =
						phase === 'monitor-grip'
							? 0
							: phase === 'desktop-zoom'
								? 1
								: THREE.MathUtils.smoothstep(phaseElapsed, 0, 2.2);
					presentation.position.x = reach * THREE.MathUtils.lerp(0.82, 0.58, turn);
					presentation.position.z = reach * THREE.MathUtils.lerp(-0.6, -0.1, turn);
				}
				const targetTurn =
					phase && phase !== 'exit' && phase !== 'presenting' && phase !== 'lifting' ? 1.12 : 0;
				researchTurn += (targetTurn - researchTurn) * Math.min(delta * 4, 1);
				presentation.rotation.y =
					researchTurn + (workstation ? 0 : Math.sin(elapsed * 0.7) * 0.018);
				researchScene.position.x = 0;
				researchScene.rotation.z = 0;
				if (phase === 'exit')
					researchScene.position.x = Math.pow(Math.min(phaseElapsed / 0.9, 1), 2) * 12;
				if (phase === 'arrival') {
					const t = Math.min(phaseElapsed / 1.95, 1);
					researchScene.position.x = 12 * Math.pow(1 - t, 3);
				}
				if (phase === 'parking') {
					researchScene.position.x =
						Math.sin(phaseElapsed * 10) * 0.12 * Math.max(0, 1 - phaseElapsed);
					researchScene.rotation.z =
						Math.sin(phaseElapsed * 10) * 0.018 * Math.max(0, 1 - phaseElapsed);
				}
				if (phase) computer.update(phase, elapsed, phaseElapsed);
				if (workstation?.purpose === 'concepts') {
					const zoom =
						phase === 'desktop-zoom' ? THREE.MathUtils.smoothstep(phaseElapsed, 0, 1.8) : 0;
					researchScene.updateMatrixWorld(true);
					computer.screen.getWorldPosition(screenCenter);
					const distance =
						1.32 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect * 0.96);
					camera.position
						.copy(cameraHome)
						.lerp(screenCenter.clone().add(new THREE.Vector3(0, 0, distance)), zoom);
					camera.lookAt(cameraLookHome.clone().lerp(screenCenter, zoom));
					camera.updateMatrixWorld(true);
				}

				if (voicePulse !== lastVoicePulse) {
					lastVoicePulse = voicePulse;
					lastVoiceAt = elapsed;
				}
				const pulseAge = elapsed - lastVoiceAt;
				const activeEnergy = pulseAge < 0.11 ? voiceEnergy : 0.34;
				smoothedCursorX += (cursorX - smoothedCursorX) * Math.min(delta * 4.8, 1);
				smoothedCursorY += (cursorY - smoothedCursorY) * Math.min(delta * 4.8, 1);

				const authoredPerformance = actionName !== 'idle';
				gazeWeight += ((authoredPerformance ? 0.12 : 1) - gazeWeight) * (1 - Math.exp(-delta * 6));
				if (headBone) {
					proceduralEuler.set(
						-smoothedCursorY * 0.075 * gazeWeight,
						smoothedCursorX * 0.12 * gazeWeight,
						speaking ? Math.sin(elapsed * 8.5) * 0.012 : 0,
						'XYZ'
					);
					proceduralQuaternion.setFromEuler(proceduralEuler);
					headBone.quaternion.multiply(proceduralQuaternion);
					if (phase === 'noticed' || phase === 'printing') {
						const glance = phase === 'printing' ? 1 : Math.min(phaseElapsed / 0.8, 1);
						proceduralEuler.set(0.3 * glance, 0.12 * glance, 0, 'XYZ');
						proceduralQuaternion.setFromEuler(proceduralEuler);
						headBone.quaternion.multiply(proceduralQuaternion);
					}
				}
				if (spineBone && speaking && !authoredPerformance) {
					proceduralEuler.set(Math.sin(elapsed * 6.5) * 0.012, 0, 0, 'XYZ');
					proceduralQuaternion.setFromEuler(proceduralEuler);
					spineBone.quaternion.multiply(proceduralQuaternion);
					spineBone.position.y += Math.max(0, Math.sin(elapsed * 13)) * 0.006;
				}
				if (hatSecondary) {
					proceduralEuler.set(
						Math.sin(elapsed * 1.9) * 0.018,
						0,
						Math.sin(elapsed * 2.4 + 0.8) * 0.035,
						'XYZ'
					);
					proceduralQuaternion.setFromEuler(proceduralEuler);
					hatSecondary.quaternion.multiply(proceduralQuaternion);
				}
				if (robeSecondary) {
					proceduralEuler.set(
						Math.sin(elapsed * 1.7 + 1.2) * 0.022,
						0,
						Math.sin(elapsed * 2.1) * 0.012,
						'XYZ'
					);
					proceduralQuaternion.setFromEuler(proceduralEuler);
					robeSecondary.quaternion.multiply(proceduralQuaternion);
				}

				const faceFps = actionName === 'popup_swat' ? 24 : personality.mood === 'thinking' ? 8 : 12;
				const faceStep = Math.floor(elapsed * faceFps);
				if (faceStep !== lastFaceStep) {
					lastFaceStep = faceStep;
					const profile = faceProfileForMood(personality.mood);
					const blink =
						(faceStep % 67 === 0 || faceStep % 113 === 0) && personality.mood !== 'shocked'
							? 0.16
							: 1;
					const meter = speechMeter(speaking, elapsed, activeEnergy);
					for (const part of faceParts) {
						const materials =
							'material' in part
								? Array.isArray(part.material)
									? part.material
									: [part.material]
								: [];
						for (const material of materials) {
							if ('color' in material) material.color.setHex(profile.color);
							if ('emissive' in material) material.emissive.setHex(profile.color);
						}
					}
					if (eyeLeft) {
						const base = baseFace.get(eyeLeft)!;
						eyeLeft.scale.set(
							base.scale.x * profile.eyeWidth,
							base.scale.y * profile.leftEyeHeight * blink,
							base.scale.z
						);
						eyeLeft.position.y = base.position.y + profile.eyeLift;
						eyeLeft.rotation.z = base.rotation.z + profile.eyeTilt;
					}
					if (eyeRight) {
						const base = baseFace.get(eyeRight)!;
						eyeRight.scale.set(
							base.scale.x * profile.eyeWidth,
							base.scale.y * profile.rightEyeHeight * blink,
							base.scale.z
						);
						eyeRight.position.y = base.position.y + profile.eyeLift;
						eyeRight.rotation.z = base.rotation.z - profile.eyeTilt;
					}
					if (mouth) {
						const base = baseFace.get(mouth)!;
						mouth.scale.set(
							base.scale.x * profile.mouthWidth * meter.width,
							base.scale.y * profile.mouthHeight * meter.height,
							base.scale.z
						);
					}
				}

				if (phase && computer.root.visible) {
					researchScene.updateMatrixWorld(true);
					const monitorHeld = ['monitor-grip', 'monitor-turn', 'desktop-zoom'].includes(phase);
					if (monitorHeld) {
						const errors: number[] = [];
						[leftHandMarker, rightHandMarker].forEach((hand, i) => {
							if (!hand) return;
							computer.monitorGrips[i].getWorldPosition(contactPoint);
							if (phase === 'monitor-grip')
								contactPoint.lerpVectors(
									monitorHands[i],
									contactPoint,
									THREE.MathUtils.smoothstep(phaseElapsed, 0, 0.9)
								);
							reachContact(i === 0 ? leftArm : rightArm, hand, contactPoint, 1, 16);
							errors.push(hand.getWorldPosition(new THREE.Vector3()).distanceTo(contactPoint));
						});
						renderCanvas.dataset.monitorGripError = errors
							.map((value) => value.toFixed(3))
							.join(',');
						if (import.meta.env.DEV)
							renderCanvas.dataset.monitorPose = JSON.stringify({
								hands: [leftHandMarker, rightHandMarker].map((hand) =>
									hand?.getWorldPosition(new THREE.Vector3()).toArray()
								),
								shoulders: [leftArm.at(-1), rightArm.at(-1)].map((joint) =>
									joint?.getWorldPosition(new THREE.Vector3()).toArray()
								),
								targets: computer.monitorGrips.map((target) =>
									target.getWorldPosition(new THREE.Vector3()).toArray()
								)
							});
					}
					const typing =
						!monitorHeld &&
						(actionName === 'research_typing' || actionName === 'research_one_hand');
					const pushing = phase === 'arrival' || phase === 'parking' || phase === 'turning';
					if (
						leftHandMarker &&
						!monitorHeld &&
						(actionName === 'research_typing' ||
							pushing ||
							actionName === 'research_cable' ||
							actionName === 'research_complete')
					) {
						const target =
							actionName === 'research_cable'
								? computer.targets.cable
								: pushing
									? computer.targets.pushLeft
									: computer.targets.left;
						target.getWorldPosition(contactPoint);
						if (typing) contactPoint.y += 0.018 * Math.max(0, Math.sin(elapsed * 14));
						reachContact(leftArm, leftHandMarker, contactPoint, 1);
						if ((typing || actionName === 'research_complete') && leftHandMarker.parent) {
							leftHandMarker.position.copy(leftHandMarker.parent.worldToLocal(contactPoint));
							leftHandMarker.updateMatrixWorld(true);
						}
					}
					if (
						rightHandMarker &&
						(typing ||
							pushing ||
							actionName === 'research_smack' ||
							actionName === 'research_complete')
					) {
						const target =
							actionName === 'research_smack'
								? computer.targets.smack
								: pushing
									? computer.targets.pushRight
									: computer.targets.right;
						target.getWorldPosition(contactPoint);
						if (typing) contactPoint.y += 0.018 * Math.max(0, Math.sin(elapsed * 14 + Math.PI));
						reachContact(rightArm, rightHandMarker, contactPoint, 1);
						if ((typing || actionName === 'research_complete') && rightHandMarker.parent) {
							rightHandMarker.position.copy(rightHandMarker.parent.worldToLocal(contactPoint));
							rightHandMarker.updateMatrixWorld(true);
						}
					}
				}
				scene.updateMatrixWorld(true);
				if (!phase || !['monitor-grip', 'monitor-turn', 'desktop-zoom'].includes(phase))
					clearHands();
				// The same sheet travels from the printer to a camera-facing reading position.
				// At rest it cuts a depth window to accessible HTML; the model mittens stay in front.
				const holdingPaper = phase === 'lifting' || phase === 'presenting' || !!scrollElement;
				carriedPaper.visible = holdingPaper || phase === 'printing';
				// Use the same textured sheet during feed and pickup. The printer plane
				// supplies its physical slot position but never renders a replacement sheet.
				if (phase === 'printing') {
					computer.paper.getWorldPosition(carriedPaper.position);
					computer.paper.getWorldQuaternion(carriedPaper.quaternion);
					carriedPaper.scale.set(0.7, 0.76 * computer.paper.scale.y, 1);
					paperProp.update(false, false);
				}
				computer.paper.visible = false;

				if (holdingPaper) {
					const rect = renderCanvas.getBoundingClientRect();
					const { width, height, left, top } = documentLayout(
						window.innerWidth,
						window.innerHeight
					);
					const atScreen = (x: number, y: number) => {
						const ray = new THREE.Vector3(
							((x - rect.left) / rect.width) * 2 - 1,
							1 - ((y - rect.top) / rect.height) * 2,
							0.5
						)
							.unproject(camera)
							.sub(camera.position)
							.normalize();
						const forward = camera.getWorldDirection(new THREE.Vector3());
						return camera.position.clone().addScaledVector(ray, 3 / ray.dot(forward));
					};
					const end = atScreen(left + width / 2, top + height / 2);
					const endWidth = atScreen(left, top).distanceTo(atScreen(left + width, top));
					const endHeight = atScreen(left, top).distanceTo(atScreen(left, top + height));
					const grip = heldProgress(phaseElapsed, 0.8);
					const raw =
						phase === 'presenting'
							? 1
							: heldProgress(phaseElapsed - (scrollElement ? 0.3 : 0.8), scrollElement ? 1.8 : 2.6);
					const travel = raw * raw * (3 - 2 * raw);
					const opening = scrollElement
						? Math.max(0.06, heldProgress(phaseElapsed - 0.9, 1, 10))
						: 1;
					const reading = scrollElement ? phaseElapsed >= 2.2 : phase === 'presenting';
					if (scrollElement) {
						scrollElement.dataset.model = 'true';
						const justOpened = reading && scrollElement.dataset.reading !== 'true';
						scrollElement.dataset.reading = String(reading);
						if (justOpened)
							scrollElement
								.querySelector<HTMLElement>('.scroll-content')
								?.focus({ preventScroll: true });
						if (!reading) {
							pickupPosition.set(0, -0.1, 1);
							pickupRotation.copy(camera.quaternion);
						}
					}
					paperProp.update(reading, !!scrollElement, opening);
					renderCanvas.dataset.documentOpening = String(opening);
					renderCanvas.dataset.documentTravel = String(travel);
					presentation.scale.setScalar(
						THREE.MathUtils.lerp(1, Math.max(1, camera.position.z / 8.4), travel)
					);
					presentation.updateMatrixWorld(true);
					if (headMarker) {
						const headPosition = headMarker.getWorldPosition(new THREE.Vector3());
						const depth = headPosition.clone().project(camera).z;
						const peek = new THREE.Vector3(
							((window.innerWidth / 2 - rect.left) / rect.width) * 2 - 1,
							1 - ((top - 35 - rect.top) / rect.height) * 2,
							depth
						).unproject(camera);
						presentation.position.add(peek.sub(headPosition).multiplyScalar(travel));
						presentation.updateMatrixWorld(true);
					}
					carriedPaper.position.lerpVectors(pickupPosition, end, travel);
					carriedPaper.position.y += Math.sin(travel * Math.PI) * 0.35;
					carriedPaper.quaternion.copy(pickupRotation).slerp(camera.quaternion, travel);
					if (!reading && travel > 0)
						carriedPaper.rotateZ(
							Math.sin((Math.floor(phaseElapsed * 12) / 12) * 8) * 0.045 * (1 - travel)
						);
					carriedPaper.scale.set(
						THREE.MathUtils.lerp(0.7, endWidth, travel),
						THREE.MathUtils.lerp(0.76, endHeight, travel) * opening,
						1
					);
					carriedPaper.updateMatrixWorld(true);
					[leftHandMarker, rightHandMarker].forEach((hand, index) => {
						if (!hand?.parent) return;
						const side = index === 0 ? -1 : 1;
						const handMesh = hand as import('three').Mesh;
						handMesh.geometry.computeBoundingSphere();
						const baseRadius =
							handMesh.geometry.boundingSphere!.radius * hand.getWorldScale(new THREE.Vector3()).x;
						const endRadius = atScreen(0, 0).distanceTo(
							atScreen(window.innerWidth <= 760 ? 20 : 32, 0)
						);
						const radius = THREE.MathUtils.lerp(baseRadius, endRadius, travel);
						hand.scale.multiplyScalar(radius / baseRadius);
						const target = carriedPaper.localToWorld(
							new THREE.Vector3(
								side * 0.505,
								scrollElement
									? THREE.MathUtils.lerp(side * 0.5, 0.08, heldProgress(phaseElapsed - 1.9, 0.3))
									: 0.08,
								radius + (scrollElement ? 0.08 : 0.04)
							)
						);
						if (phase === 'lifting' && grip < 1)
							target.lerpVectors(pickupHands[index], target, grip * grip * (3 - 2 * grip));
						hand.position.copy(hand.parent.worldToLocal(target));
						// Floating mittens remain attached to their original animated parent nodes.
						hand.updateMatrixWorld(true);
					});
				}

				ball.visible = !!magicBall;
				chaseCat.root.visible = !!magicBall;
				if (magicBall) {
					const { phase: ballPhase, time: ballTime } = magicBall;
					const shaking = ballPhase === 'shake';
					const throwing = ballPhase === 'throw' || ballPhase === 'chase';
					const origin = new THREE.Vector3(0, 0.6, 0.85);
					presentation.localToWorld(origin);
					ball.position.copy(origin);
					if (shaking) {
						ball.position.x += Math.sin(ballTime * 27) * 0.18;
						ball.position.y += Math.cos(ballTime * 27) * 0.14;
					}
					if (throwing) {
						const flight = Math.max(0, ballTime - 0.35);
						ball.position.x += flight * 7;
						ball.position.y += flight * 3 - flight * flight * 4;
					}
					ball.rotation.z = shaking ? Math.sin(ballTime * 27) * 0.4 : throwing ? ballTime * 12 : 0;
					[leftHandMarker, rightHandMarker].forEach((hand, i) => {
						if (!hand?.parent) return;
						const target =
							throwing && ballTime > 0.35
								? origin.clone().add(new THREE.Vector3(0.6 + i * 0.3, 0.4, 0.1))
								: ball.position.clone().add(new THREE.Vector3(i === 0 ? -0.26 : 0.26, 0, 0));
						reachContact(i === 0 ? leftArm : rightArm, hand, target, 1);
						hand.position.copy(hand.parent.worldToLocal(target));
						hand.updateMatrixWorld(true);
					});
					if (headBone) headBone.rotation.x += shaking ? Math.sin(ballTime * 12) * 0.025 : 0.18;
					chaseCat.root.scale.setScalar(0.85);
					chaseCat.root.position.set(-1.6, -1.7, 1);
					const chase = Math.max(0, ballTime - 0.85);
					if (throwing) chaseCat.root.position.x += chase * 7;
					chaseCat.root.rotation.y = throwing ? Math.PI / 2 : 0.35;
					chaseCat.update(elapsed, throwing ? 'run' : shaking ? 'alert' : 'sit');
				}

				if (holdingPaper) clearHands();
				if (workstation) {
					workstation.screen.style.visibility = computer.root.visible ? 'visible' : 'hidden';
					projectDisplay(
						workstation.screen,
						computer.screen,
						camera,
						renderCanvas.getBoundingClientRect(),
						phase === 'desktop-zoom' ? THREE.MathUtils.smoothstep(phaseElapsed, 0, 1.8) : 0
					);
				}

				if (
					(researching || workstation) &&
					now - lastAnchorUpdate >= 80 &&
					seatMarker &&
					headMarker &&
					leftHandMarker &&
					rightHandMarker
				) {
					lastAnchorUpdate = now;
					presentation.updateMatrixWorld(true);
					const stageRect = renderCanvas.getBoundingClientRect();
					if (!stageRect) {
						frameId = window.requestAnimationFrame(render);
						return;
					}
					const settledResearchShiftX = 0;
					const projectMarker = (marker: NonNullable<typeof seatMarker>) => {
						marker.getWorldPosition(anchorVector).project(camera);
						return {
							x:
								stageRect.left +
								((anchorVector.x + 1) / 2) * stageRect.width +
								settledResearchShiftX,
							y: stageRect.top + ((1 - anchorVector.y) / 2) * stageRect.height
						};
					};
					onAnchors({
						seat: projectMarker(seatMarker),
						head: projectMarker(headMarker),
						leftHand: projectMarker(leftHandMarker),
						rightHand: projectMarker(rightHandMarker),
						keyboardLeft: projectMarker(
							phase === 'arrival' || phase === 'parking' || phase === 'turning'
								? computer.targets.pushLeft
								: computer.targets.left
						),
						keyboardRight: projectMarker(
							phase === 'arrival' || phase === 'parking' || phase === 'turning'
								? computer.targets.pushRight
								: computer.targets.right
						),
						updatedAt: now
					});
				}

				outline.render(scene, camera);
				frameId = window.requestAnimationFrame(render);
			};
			render();

			cleanupThree = () => {
				window.cancelAnimationFrame(frameId);
				director.dispose();
				computer.dispose();
				chaseCat.dispose();
				ball.traverse((o) => {
					if (o instanceof THREE.Mesh) o.geometry.dispose();
				});
				ballMaterial.dispose();
				labelTexture.dispose();
				labelMaterial.dispose();
				paperProp.dispose();
				resizeObserver.disconnect();
				mixer.stopAllAction();
				sage.traverse((object) => {
					if (!(object instanceof THREE.Mesh)) return;
					object.geometry.dispose();
					const materials = Array.isArray(object.material) ? object.material : [object.material];
					for (const material of materials) material.dispose();
				});
				renderer.dispose();
			};
		} catch (error) {
			console.warn('Signal Sage 3D fell back to the pixel portrait.', error);
			modelFailed = true;
			useFallback = true;
		}
	}
</script>

<div
	bind:this={stageElement}
	class="live-sage-stage"
	class:holding-paper={workstation?.phase === 'lifting' ||
		workstation?.phase === 'presenting' ||
		!!$heldScroll}
	class:fallback={useFallback}
	class:ready={modelReady}
	class:researching={researching || !!workstation}
	class:consulting={!!magicBall}
	data-magic-phase={magicBall?.phase}
	data-magic-cycle={magicBall?.cycle}
	class:concept-performance={workstation?.purpose === 'concepts'}
	class:resetting
	data-mood={personality.mood}
	data-performance={performance ?? 'idle'}
	data-active-clip={activeClip}
	style={`--sage-altitude: ${altitude}`}
>
	<div class="sage-motion" bind:this={container}>
		<canvas
			bind:this={canvas}
			class:hidden={useFallback}
			aria-hidden={useFallback}
			aria-label="The Signal Sage, a low-poly CRT wizard in a floating chair"
		></canvas>
		{#if useFallback || !modelReady}
			<img
				class="sage-fallback"
				class:loading={!useFallback && !modelReady}
				src={`/images/sage-pixel/${personality.mood}.svg`}
				alt={useFallback
					? 'The Signal Sage, shown as a pixel portrait because calm mode or the 3D fallback is active'
					: ''}
			/>
		{/if}
	</div>

	{#if popupVisible && !personality.calmMode && !$heldScroll && workstation?.phase !== 'lifting' && workstation?.phase !== 'presenting'}
		<button
			class="joke-popup"
			class:swatted={popupSwatting}
			data-phase={popupPhase}
			type="button"
			onclick={dismissPopup}
			aria-label="Dismiss a suspicious Crystal RAM popup"
		>
			<span class="popup-bar">TOTALLY_REAL_PRIZE.EXE <b>×</b></span>
			<img src="/images/retro/magic-hit.gif" alt="" />
			<strong>YOU WON 8MB<br />OF CRYSTAL RAM!!!</strong>
			<small
				>{popupSwatting
					? 'BAD WINDOW. BAD.'
					: popupPhase === 'comment'
						? 'ARE YOU GOING TO CLEAN THAT UP?'
						: popupPhase === 'waiting'
							? 'HE IS PRETENDING NOT TO SEE IT'
							: 'CLICK TO CLOSE BEFORE HE NOTICES'}</small
			>
		</button>
	{/if}
	{#if popupImpact}<span class="swat-impact" aria-hidden="true">WHAP!</span>{/if}

	{#if modelFailed}
		<span class="fallback-note">3D SIGNAL LOST · PORTRAIT CHANNEL ACTIVE</span>
	{/if}
</div>

<style>
	:global(.app-frame) .live-sage-stage.consulting {
		left: 0;
		top: 0;
		width: 100vw;
		height: calc(100dvh - 280px);
		transform: none;
		transition: none;
	}
	@media (max-width: 760px) {
		:global(.app-frame) .live-sage-stage.consulting {
			height: calc(100dvh - 340px);
		}
	}

	.live-sage-stage {
		position: fixed;
		left: 15%;
		top: calc(14px - var(--sage-altitude) * 12px);
		width: 65vw;
		height: calc(100dvh - var(--dialogue-height) + 18px);
		z-index: 7;
		pointer-events: none;
		transform: none;
		transition: top 720ms cubic-bezier(0.16, 0.9, 0.22, 1);
	}

	:global(.app-frame[data-stage='concepts']) .live-sage-stage {
		left: -3%;
		top: 8vh;
		width: 44vw;
		height: min(82vh, 800px);
	}

	.live-sage-stage:not(.researching)[data-active-clip='ascend'] .sage-motion {
		animation: chair-lift 1.5s cubic-bezier(0.2, 0.8, 0.3, 1) both;
	}
	@keyframes chair-lift {
		0% {
			transform: translateY(0);
		}
		28% {
			transform: translateY(-30px);
		}
		100% {
			transform: translateY(0);
		}
	}

	/* Dialogue uses the larger hero framing above. Research needs its own authored
	   camera footprint so the turned chair, hands, keyboard, and cart read as one
	   performance instead of a giant canvas colliding with the workstation. */
	.live-sage-stage.researching {
		left: 0;
		top: 0;
		width: 100vw;
		height: 100dvh;
		transform: none;
		transition: none;
	}
	:global(.app-frame[data-stage='concepts']) .live-sage-stage.concept-performance {
		left: 0;
		top: 0;
		width: 100vw;
		height: 100dvh;
		transition: none;
	}

	:global(.app-frame) .live-sage-stage.holding-paper {
		z-index: 21;
		left: 0;
		top: 0;
		width: 100vw;
		height: 100dvh;
		transition: none;
	}

	.sage-motion,
	.sage-motion canvas {
		width: 100%;
		height: 100%;
	}

	.sage-motion canvas {
		display: block;
		image-rendering: pixelated;
		opacity: 0;
		filter: none;
		transition: opacity 260ms ease;
	}

	.researching .sage-motion canvas {
		filter: none;
	}

	.ready .sage-motion canvas {
		opacity: 1;
	}
	.ready .sage-motion canvas.hidden {
		opacity: 0;
	}

	.resetting .sage-motion {
		animation: sage-reset-fall 3s steps(28, end) both;
	}

	.resetting::before,
	.resetting::after {
		position: absolute;
		z-index: 8;
		left: 50%;
		pointer-events: none;
		font-family: 'Courier New', monospace;
	}

	.resetting::before {
		content: 'POOF!';
		top: 38%;
		color: #fff06c;
		font-size: 34px;
		text-shadow: 4px 4px #ca35c5;
		animation: reset-poof 650ms steps(6, end) both;
	}

	.resetting::after {
		content: 'NEW CHAIR DEPLOYED';
		bottom: 3%;
		padding: 6px;
		color: #7fffe4;
		background: #08051ddd;
		font-size: 8px;
		animation: reset-chair-label 520ms steps(5, end) 2.45s both;
	}

	.sage-fallback {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 256px;
		height: 256px;
		object-fit: contain;
		image-rendering: pixelated;
		box-shadow: 8px 8px #49404f;
		transform: translate(-50%, -50%);
	}

	.sage-fallback.loading {
		opacity: 0.48;
	}
	@media (max-width: 760px) {
		.sage-fallback {
			width: 128px;
			height: 128px;
		}
	}

	.joke-popup {
		position: absolute;
		left: 3%;
		right: auto;
		top: 25%;
		width: 220px;
		padding: 30px 10px 12px;
		border: 4px outset #ddd;
		background: #c0c0c0;
		color: #100030;
		font:
			700 12px 'Courier New',
			monospace;
		text-align: center;
		box-shadow: 10px 12px 0 #06020d99;
		pointer-events: auto;
		transform: rotate(-2deg);
		animation: popup-arrival 300ms steps(4, end);
		cursor: pointer;
	}

	.joke-popup::after {
		position: absolute;
		right: -19px;
		bottom: -17px;
		width: 34px;
		height: 34px;
		content: '☝';
		font-size: 27px;
		filter: drop-shadow(2px 2px #fff);
		animation: popup-nag 680ms steps(2, end) infinite;
	}

	.popup-bar {
		position: absolute;
		left: 3px;
		right: 3px;
		top: 3px;
		display: flex;
		justify-content: space-between;
		padding: 3px 5px;
		background: #150093;
		color: white;
		font-size: 9px;
		text-align: left;
	}
	.joke-popup img {
		width: 62px;
		height: 62px;
		image-rendering: pixelated;
	}
	.joke-popup strong,
	.joke-popup small {
		display: block;
	}
	.joke-popup strong {
		color: #760076;
		font-size: 14px;
	}
	.joke-popup small {
		margin-top: 7px;
		color: #222;
		font-size: 8px;
	}

	.joke-popup.swatted {
		pointer-events: none;
		animation: popup-swat 620ms steps(8, end) 400ms forwards;
	}
	.joke-popup[data-phase='glance'],
	.joke-popup[data-phase='waiting'] {
		box-shadow:
			10px 12px 0 #06020d99,
			0 0 0 5px #ffe66b;
	}
	.joke-popup[data-phase='anticipate'] {
		transform: translateX(12px) rotate(5deg) scale(1.04);
	}

	.joke-popup.swatted::after {
		display: none;
	}

	.swat-impact {
		position: absolute;
		z-index: 4;
		left: 9%;
		top: 31%;
		color: #fff65a;
		font:
			700 clamp(28px, 5vw, 66px) 'Silkscreen',
			monospace;
		letter-spacing: -0.12em;
		paint-order: stroke fill;
		-webkit-text-stroke: 8px #4d0b78;
		text-shadow: 8px 8px 0 #ff2868;
		transform: rotate(-14deg);
		animation: impact-pop 520ms steps(6, end) both;
	}

	.fallback-note {
		position: absolute;
		left: 50%;
		bottom: 5%;
		padding: 4px 8px;
		background: #000b;
		color: #a7f6ff;
		font:
			9px 'Courier New',
			monospace;
		transform: translateX(-50%);
	}

	@keyframes popup-arrival {
		from {
			transform: translate(-90px, -40px) rotate(-12deg) scale(0.5);
			opacity: 0;
		}
		to {
			transform: rotate(-2deg) scale(1);
			opacity: 1;
		}
	}

	@keyframes popup-swat {
		0% {
			transform: rotate(-2deg);
		}
		18% {
			transform: translateX(20px) rotate(6deg) scale(1.06);
			filter: brightness(1);
		}
		28% {
			transform: translate(-22px, 4px) rotate(-13deg) scale(0.96, 1.12);
			filter: brightness(2.6) saturate(0);
		}
		100% {
			transform: translate(-56vw, -16vh) rotate(-620deg) scale(0.18);
			opacity: 0;
		}
	}

	@keyframes popup-nag {
		50% {
			transform: translate(-5px, -5px);
		}
	}

	@keyframes impact-pop {
		0% {
			transform: rotate(-14deg) scale(0.2);
			opacity: 0;
		}
		32% {
			transform: rotate(-8deg) scale(1.22);
			opacity: 1;
		}
		100% {
			transform: rotate(-14deg) scale(0.78);
			opacity: 0;
		}
	}

	@keyframes sage-reset-fall {
		0%,
		10% {
			transform: translate(0, 0) rotate(0);
			opacity: 1;
		}
		18% {
			transform: translate(0, -4%) rotate(0) scale(0.96);
			opacity: 0;
		}
		25% {
			transform: translate(0, -22%) rotate(12deg) scale(0.78);
			opacity: 1;
		}
		78% {
			transform: translate(8%, 120vh) rotate(760deg) scale(0.42);
			opacity: 1;
		}
		79% {
			transform: translate(0, -120vh) rotate(0) scale(0.7);
			opacity: 0;
		}
		100% {
			transform: translate(0, 0) rotate(0) scale(1);
			opacity: 1;
		}
	}

	@keyframes reset-poof {
		0% {
			transform: translate(-50%, -50%) scale(0.2);
			opacity: 0;
		}
		45% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) scale(2.2);
			opacity: 0;
		}
	}

	@keyframes reset-chair-label {
		from {
			transform: translate(-50%, 30px);
			opacity: 0;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}

	@media (max-width: 1180px) {
		.live-sage-stage {
			left: 12%;
			width: 72vw;
		}
		.joke-popup {
			left: 2%;
			right: auto;
			transform: scale(0.86) rotate(3deg);
		}
	}

	@media (max-width: 760px) {
		.live-sage-stage {
			left: 0;
			top: 32px;
			width: 100vw;
			height: 46dvh;
		}
		.joke-popup {
			left: 0;
			right: auto;
			top: 4%;
			transform: scale(0.55) rotate(3deg);
			transform-origin: top left;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.live-sage-stage {
			transition: none;
		}
		.joke-popup {
			animation: none;
		}

		.researching .sage-motion {
			animation: none;
			transform: none;
		}
	}
</style>
