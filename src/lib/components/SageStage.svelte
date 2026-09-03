<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { AnimationAction } from 'three';
	import type { SagePersonality } from '$lib/personality';
	import {
		clipForMood,
		faceProfileForMood,
		normalizedCursorTarget,
		speechMeter,
		type SageClip
	} from '$lib/sage-stage';

	let {
		personality,
		altitude,
		researching = false,
		speaking = false,
		voicePulse = 0,
		voiceEnergy = 0.5,
		resetSignal = 0,
		allowPopup = true,
		onSecret
	}: {
		personality: SagePersonality;
		altitude: number;
		researching?: boolean;
		speaking?: boolean;
		voicePulse?: number;
		voiceEnergy?: number;
		resetSignal?: number;
		allowPopup?: boolean;
		onSecret: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();
	let modelReady = $state(false);
	let modelFailed = $state(false);
	let motionFallback = $state(false);
	let useFallback = $derived(personality.calmMode || motionFallback || modelFailed);
	let popupVisible = $state(false);
	let popupSwatting = $state(false);
	let popupImpact = $state(false);
	let resetting = $state(false);
	let lastResetSignal = 0;
	let playClip: ((clip: SageClip, returnToIdle?: boolean) => void) | null = null;
	let lastReactionCounter = -1;
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
		const timer = window.setTimeout(() => (resetting = false), 3_050);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		const counter = personality.eventCounter;
		const mood = personality.mood;
		if (!playClip || popupSwatting || counter === lastReactionCounter) return;
		lastReactionCounter = counter;
		playClip(clipForMood(mood), true);
	});

	$effect(() => {
		const nextAltitude = altitude;
		if (!playClip || Math.abs(nextAltitude - lastAltitude) < 0.018) return;
		lastAltitude = nextAltitude;
		playClip('ascend', true);
	});

	$effect(() => {
		const calmMode = personality.calmMode;
		const fallback = motionFallback;
		if (!mounted || calmMode || fallback || threeStarted) return;
		void startThree();
	});

	$effect(() => {
		if (
			!allowPopup ||
			personality.calmMode ||
			personality.achievements.includes('FORBIDDEN FLOPPY') ||
			popupVisible
		)
			return;
		const popupTimer = window.setTimeout(() => (popupVisible = true), 2_200);
		return () => window.clearTimeout(popupTimer);
	});

	function swatPopup() {
		if (popupSwatting) return;
		popupSwatting = true;
		playClip?.('popup_swat', true);
		window.setTimeout(() => (popupImpact = true), 400);
		window.setTimeout(() => {
			popupVisible = false;
			popupImpact = false;
		}, 920);
		window.setTimeout(() => {
			popupSwatting = false;
			onSecret();
		}, 1_440);
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

	onDestroy(() => cleanupThree());

	async function startThree() {
		if (personality.calmMode || motionFallback || threeStarted || !canvas || !container) return;
		threeStarted = true;

		try {
			const THREE = await import('three');
			const [{ GLTFLoader }, { OutlineEffect }] = await Promise.all([
				import('three/examples/jsm/loaders/GLTFLoader.js'),
				import('three/examples/jsm/effects/OutlineEffect.js')
			]);
			const mountContainer = container;

			const renderer = new THREE.WebGLRenderer({
				canvas,
				alpha: true,
				antialias: false,
				powerPreference: 'high-performance'
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1.15;

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);

			scene.add(new THREE.HemisphereLight(0xbfeaff, 0x17062d, 2.4));
			const key = new THREE.DirectionalLight(0xffd1b6, 4.4);
			key.position.set(4, 5, 5);
			scene.add(key);
			const rim = new THREE.DirectionalLight(0x7a73ff, 4.8);
			rim.position.set(-5, 2, -3);
			scene.add(rim);

			const gltf = await new GLTFLoader().loadAsync('/models/signal-sage.glb');
			const sage = gltf.scene;
			sage.rotation.y = -0.08;
			const presentation = new THREE.Group();
			presentation.add(sage);
			scene.add(presentation);

			const mixer = new THREE.AnimationMixer(sage);
			const actions: Record<string, AnimationAction> = {};
			for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);

			// Fit the camera to every authored pose, not just the idle stance. This keeps the
			// hat, chair, and wide hand gestures inside the canvas at every viewport size.
			const poseEnvelope = new THREE.Box3();
			const sampleBounds = new THREE.Box3();
			for (const clip of gltf.animations) {
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
			let activeAction: AnimationAction | null = null;
			let actionName: SageClip = 'idle';
			let actionTime = 0;
			let actionFps = 12;
			let returnTimer = 0;

			playClip = (clip, returnToIdle = false) => {
				const next = actions[clip];
				if (!next) return;
				activeAction?.stop();
				actionName = clip;
				actionTime = 0;
				actionFps = clip === 'popup_swat' || clip === 'reveal' ? 24 : 12;
				next.reset();
				next.enabled = true;
				next.setLoop(
					clip === 'idle' ? THREE.LoopRepeat : THREE.LoopOnce,
					clip === 'idle' ? Infinity : 1
				);
				next.clampWhenFinished = clip !== 'idle';
				next.play();
				activeAction = next;
				window.clearTimeout(returnTimer);
				if (returnToIdle && clip !== 'idle') {
					const recoveryDelay = Math.ceil(next.getClip().duration * 1_000) + 80;
					returnTimer = window.setTimeout(() => playClip?.('idle'), recoveryDelay);
				}
			};

			playClip('idle');
			modelReady = true;

			const outline = new OutlineEffect(renderer, {
				defaultThickness: 0.0045,
				defaultColor: [0.025, 0.012, 0.07],
				defaultAlpha: 0.9,
				defaultKeepAlive: true
			});
			let elapsed = 0;
			let lastFrame = performance.now();
			let frameId = 0;
			let lastFaceStep = -1;
			let lastVoicePulse = voicePulse;
			let lastVoiceAt = 0;
			let smoothedCursorX = 0;
			let smoothedCursorY = 0;
			let researchTurn = 0;
			const eyeLeft = sage.getObjectByName('EyeLeft');
			const eyeRight = sage.getObjectByName('EyeRight');
			const mouth = sage.getObjectByName('Mouth');
			const headBone = sage.getObjectByName('head');
			const spineBone = sage.getObjectByName('spine');
			const hatSecondary = sage.getObjectByName('hat_secondary');
			const robeSecondary = sage.getObjectByName('robe_secondary');
			const faceParts = [eyeLeft, eyeRight, mouth].filter(
				(part): part is NonNullable<typeof part> => !!part
			);
			for (const part of faceParts) {
				if (!(part instanceof THREE.Mesh)) continue;
				part.material = Array.isArray(part.material)
					? part.material.map((material) => material.clone())
					: part.material.clone();
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
				renderer.setSize(width, height, false);
				camera.aspect = width / height;
				const verticalFov = THREE.MathUtils.degToRad(camera.fov);
				const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
				const fitHeight = (poseSize.y * 1.08) / 0.74;
				const fitWidth = (poseSize.x * 1.08) / 0.78;
				const verticalDistance = fitHeight / 2 / Math.tan(verticalFov / 2);
				const horizontalDistance = fitWidth / 2 / Math.tan(horizontalFov / 2);
				const distance = Math.max(verticalDistance, horizontalDistance) + poseSize.z * 0.55;
				camera.position.set(0, 0, distance);
				camera.near = Math.max(0.01, distance - poseSize.z * 2);
				camera.far = distance + poseSize.z * 4;
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
			};
			const resizeObserver = new ResizeObserver(resize);
			resizeObserver.observe(mountContainer);
			resize();

			const render = (now = performance.now()) => {
				const delta = Math.min((now - lastFrame) / 1000, 0.05);
				lastFrame = now;
				elapsed += delta;
				actionTime += delta;
				const steppedTime = Math.floor(actionTime * actionFps) / actionFps;
				mixer.setTime(steppedTime);
				presentation.position.y = Math.sin(elapsed * 1.7) * 0.035;
				researchTurn += ((researching ? Math.PI : 0) - researchTurn) * Math.min(delta * 2.2, 1);
				presentation.rotation.y = researchTurn + Math.sin(elapsed * 0.7) * 0.018;

				if (voicePulse !== lastVoicePulse) {
					lastVoicePulse = voicePulse;
					lastVoiceAt = elapsed;
				}
				const pulseAge = elapsed - lastVoiceAt;
				const activeEnergy = pulseAge < 0.11 ? voiceEnergy : 0.34;
				smoothedCursorX += (cursorX - smoothedCursorX) * Math.min(delta * 4.8, 1);
				smoothedCursorY += (cursorY - smoothedCursorY) * Math.min(delta * 4.8, 1);

				const authoredPerformance = actionName !== 'idle';
				const gazeWeight = authoredPerformance ? 0.18 : 1;
				if (headBone) {
					if (researching) headBone.rotation.y -= researchTurn * 0.12;
					headBone.rotation.y += smoothedCursorX * 0.12 * gazeWeight;
					headBone.rotation.x += -smoothedCursorY * 0.075 * gazeWeight;
					if (speaking) headBone.rotation.z += Math.sin(elapsed * 8.5) * 0.012;
				}
				if (spineBone && speaking && !authoredPerformance) {
					spineBone.rotation.x += Math.sin(elapsed * 6.5) * 0.012;
					spineBone.position.y += Math.max(0, Math.sin(elapsed * 13)) * 0.006;
				}
				if (hatSecondary) {
					hatSecondary.rotation.z += Math.sin(elapsed * 2.4 + 0.8) * 0.035;
					hatSecondary.rotation.x += Math.sin(elapsed * 1.9) * 0.018;
				}
				if (robeSecondary) {
					robeSecondary.rotation.x += Math.sin(elapsed * 1.7 + 1.2) * 0.022;
					robeSecondary.rotation.z += Math.sin(elapsed * 2.1) * 0.012;
				}

				const faceFps = actionName === 'popup_swat' ? 24 : personality.mood === 'thinking' ? 8 : 12;
				const faceStep = Math.floor(elapsed * faceFps);
				if (faceStep !== lastFaceStep) {
					lastFaceStep = faceStep;
					const profile = faceProfileForMood(personality.mood);
					const blink = faceStep % 41 === 0 && personality.mood !== 'shocked' ? 0.16 : 1;
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

				outline.render(scene, camera);
				frameId = window.requestAnimationFrame(render);
			};
			render();

			cleanupThree = () => {
				window.cancelAnimationFrame(frameId);
				window.clearTimeout(returnTimer);
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
			console.warn('Signal Sage 3D fell back to the illustrated portrait.', error);
			modelFailed = true;
			useFallback = true;
		}
	}
</script>

<div
	class="live-sage-stage"
	class:fallback={useFallback}
	class:ready={modelReady}
	class:researching
	class:resetting
	data-mood={personality.mood}
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
				src={`/images/sage/${personality.mood}.webp`}
				alt={useFallback
					? 'The Signal Sage, shown as an illustrated CRT wizard because calm mode or the 3D fallback is active'
					: ''}
			/>
		{/if}
	</div>

	{#if popupVisible && !personality.calmMode}
		<button
			class="joke-popup"
			class:swatted={popupSwatting}
			type="button"
			onclick={swatPopup}
			aria-label="Dismiss a suspicious Crystal RAM popup"
		>
			<span class="popup-bar">TOTALLY_REAL_PRIZE.EXE <b>×</b></span>
			<img src="/images/retro/magic-hit.gif" alt="" />
			<strong>YOU WON 8MB<br />OF CRYSTAL RAM!!!</strong>
			<small>{popupSwatting ? 'BAD WINDOW. BAD.' : 'CLICK TO CLOSE BEFORE HE NOTICES'}</small>
		</button>
	{/if}
	{#if popupImpact}<span class="swat-impact" aria-hidden="true">WHAP!</span>{/if}

	{#if modelFailed}
		<span class="fallback-note">3D SIGNAL LOST · PORTRAIT CHANNEL ACTIVE</span>
	{/if}
</div>

<style>
	.live-sage-stage {
		position: fixed;
		left: clamp(36px, 7vw, 130px);
		top: calc(46% - (var(--sage-altitude) * 18vh));
		width: min(58vw, 880px);
		height: min(calc(82vh - (var(--sage-altitude) * 10vh)), 900px);
		z-index: 7;
		pointer-events: none;
		transform: translateY(-50%);
		transition: top 720ms cubic-bezier(0.16, 0.9, 0.22, 1);
	}

	.sage-motion,
	.sage-motion canvas {
		width: 100%;
		height: 100%;
	}

	.sage-motion canvas {
		display: block;
		opacity: 0;
		filter: drop-shadow(0 24px 24px #0009);
		transition: opacity 260ms ease;
	}

	.ready .sage-motion canvas {
		opacity: 1;
	}
	.ready .sage-motion canvas.hidden {
		opacity: 0;
	}

	.researching .sage-motion {
		animation: sage-fetch-computer 3.55s steps(22, end) both;
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
		max-width: 72%;
		max-height: 88%;
		object-fit: contain;
		filter: drop-shadow(0 22px 24px #000a);
		transform: translate(-50%, -50%);
	}

	.sage-fallback.loading {
		opacity: 0.48;
		filter: grayscale(0.5) drop-shadow(0 22px 24px #000a);
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
		animation: popup-swat 620ms steps(8, end) forwards;
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

	@keyframes sage-fetch-computer {
		0%,
		8% {
			transform: translateX(0) rotate(0);
		}
		28% {
			transform: translateX(-115%) rotate(-6deg);
		}
		43% {
			transform: translateX(-115%) rotate(-6deg);
		}
		76% {
			transform: translateX(56%) rotate(3deg);
		}
		100% {
			transform: translateX(52%) rotate(1deg);
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
			left: 0;
			width: 48vw;
			height: 70vh;
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
			top: 25vh;
			width: 100vw;
			height: 47vh;
		}
		.joke-popup {
			left: auto;
			right: 3%;
			top: 10%;
			transform: scale(0.72) rotate(3deg);
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
		}
	}
</style>
