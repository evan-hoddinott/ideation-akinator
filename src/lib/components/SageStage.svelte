<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { AnimationAction } from 'three';
	import type { SagePersonality } from '$lib/personality';
	import { clipForMood, type SageClip } from '$lib/sage-stage';

	let {
		personality,
		altitude,
		researching = false,
		allowPopup = true,
		onSecret
	}: {
		personality: SagePersonality;
		altitude: number;
		researching?: boolean;
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
	let playClip: ((clip: SageClip, returnToIdle?: boolean) => void) | null = null;
	let lastReactionCounter = -1;
	let lastAltitude = 0;
	let mounted = false;
	let threeStarted = false;
	let cleanupThree = () => {};

	$effect(() => {
		const counter = personality.eventCounter;
		const mood = personality.mood;
		if (!playClip || counter === lastReactionCounter) return;
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
		window.setTimeout(() => onSecret(), 460);
		window.setTimeout(() => {
			popupVisible = false;
			popupSwatting = false;
		}, 820);
	}

	onMount(() => {
		mounted = true;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const forcedFallback = new URL(window.location.href).searchParams.has('sageFallback');
		motionFallback = reduceMotion || forcedFallback;
		void startThree();
		return () => {
			mounted = false;
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
					returnTimer = window.setTimeout(() => playClip?.('idle'), 980);
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
			const eyeLeft = sage.getObjectByName('EyeLeft');
			const eyeRight = sage.getObjectByName('EyeRight');
			const mouth = sage.getObjectByName('Mouth');

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
				presentation.rotation.y = (researching ? -0.52 : 0) + Math.sin(elapsed * 0.7) * 0.018;

				const faceFps = actionName === 'popup_swat' ? 24 : personality.mood === 'thinking' ? 8 : 12;
				const faceStep = Math.floor(elapsed * faceFps);
				if (faceStep !== lastFaceStep) {
					lastFaceStep = faceStep;
					const blink = faceStep % 37 === 0 ? 0.18 : 1;
					if (eyeLeft) eyeLeft.scale.y = blink;
					if (eyeRight) eyeRight.scale.y = blink;
					if (mouth) mouth.scale.x = 0.88 + (faceStep % 3) * 0.06;
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
			<small>{popupSwatting ? 'SAGE INTERCEPTION IN PROGRESS' : 'CLICK TO CLAIM / REGRET'}</small>
		</button>
	{/if}

	{#if modelFailed}
		<span class="fallback-note">3D SIGNAL LOST · PORTRAIT CHANNEL ACTIVE</span>
	{/if}
</div>

<style>
	.live-sage-stage {
		position: fixed;
		left: clamp(30px, 4vw, 90px);
		top: calc(56% - (var(--sage-altitude) * 25vh));
		width: min(49vw, 820px);
		height: min(calc(84vh - (var(--sage-altitude) * 20vh)), 900px);
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
		animation: sage-fetch-computer 1.8s steps(12, end) both;
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
		left: -2%;
		right: auto;
		top: 18%;
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
		transform: rotate(3deg);
		animation: popup-arrival 300ms steps(4, end);
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
		animation: popup-swat 520ms cubic-bezier(0.7, -0.3, 0.9, 0.2) forwards;
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
			transform: translate(80px, -50px) rotate(12deg) scale(0.5);
			opacity: 0;
		}
		to {
			transform: rotate(3deg) scale(1);
			opacity: 1;
		}
	}

	@keyframes popup-swat {
		0% {
			transform: rotate(3deg);
		}
		20% {
			transform: translateX(-28px) rotate(-8deg) scale(1.06);
		}
		100% {
			transform: translate(65vw, 30vh) rotate(420deg) scale(0.25);
			opacity: 0;
		}
	}

	@keyframes sage-fetch-computer {
		0%,
		14% {
			transform: translateX(0) rotate(0);
		}
		36% {
			transform: translateX(-115%) rotate(-6deg);
		}
		58% {
			transform: translateX(-115%) rotate(-6deg);
		}
		84% {
			transform: translateX(-8%) rotate(3deg);
		}
		100% {
			transform: translateX(-4%) rotate(1deg);
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
