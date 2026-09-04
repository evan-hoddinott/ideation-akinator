<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { AnimationAction } from 'three';
	import type { SagePersonality } from '$lib/personality';
	import type { OracleEffect } from '$lib/oracle-audio';
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
		speaking = false,
		voicePulse = 0,
		voiceEnergy = 0.5,
		performance = null,
		resetSignal = 0,
		allowPopup = true,
		onAnchors = () => {},
		onEffect = () => {},
		onSecret
	}: {
		personality: SagePersonality;
		altitude: number;
		researching?: boolean;
		speaking?: boolean;
		voicePulse?: number;
		voiceEnergy?: number;
		performance?: SageClip | null;
		resetSignal?: number;
		allowPopup?: boolean;
		onAnchors?: (anchors: SageScreenAnchors) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
		onSecret: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();
	let stageElement = $state<HTMLDivElement>();
	let modelReady = $state(false);
	let modelFailed = $state(false);
	let motionFallback = $state(false);
	let useFallback = $derived(personality.calmMode || motionFallback || modelFailed);
	let popupVisible = $state(false);
	let popupSwatting = $state(false);
	let popupImpact = $state(false);
	type PopupPhase =
		'hidden' | 'ignoring' | 'glance' | 'waiting' | 'comment' | 'anticipate' | 'swat';
	let popupPhase = $state<PopupPhase>('hidden');
	let popupTimers: number[] = [];
	let resetting = $state(false);
	let lastResetSignal = 0;
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
		if (!playClip || performance || nowSpeaking === lastSpeaking) return;
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
		if (personality.calmMode || motionFallback || threeStarted || !canvas || !container) return;
		threeStarted = true;

		try {
			const THREE = await import('three');
			const [{ GLTFLoader }, { OutlineEffect }] = await Promise.all([
				import('three/examples/jsm/loaders/GLTFLoader.js'),
				import('three/examples/jsm/effects/OutlineEffect.js')
			]);
			const mountContainer = container;
			const renderCanvas = canvas;

			const renderer = new THREE.WebGLRenderer({
				canvas: renderCanvas,
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

			const gltf = await new GLTFLoader().loadAsync('/models/signal-sage.glb?v=0097df12');
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
			let activeAction: AnimationAction | null = null;
			let actionName: SageClip = 'idle';
			let returnTimer = 0;
			const transitionTimers = new SvelteSet<number>();
			const loopingClips = new Set<SageClip>([
				'idle',
				'talk',
				'research_typing',
				'research_one_hand'
			]);

			playClip = (clip, returnToIdle = false) => {
				const next = actions[clip];
				if (!next) return;
				const previous = activeAction;
				actionName = clip;
				if (previous === next && loopingClips.has(clip)) return;
				next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
				next.enabled = true;
				next.setLoop(
					loopingClips.has(clip) ? THREE.LoopRepeat : THREE.LoopOnce,
					loopingClips.has(clip) ? Infinity : 1
				);
				next.clampWhenFinished = !loopingClips.has(clip);
				next.play();
				if (previous && previous !== next) {
					next.crossFadeFrom(previous, 0.16, false);
					const transitionTimer = window.setTimeout(() => {
						previous.stop();
						transitionTimers.delete(transitionTimer);
					}, 190);
					transitionTimers.add(transitionTimer);
				}
				activeAction = next;
				window.clearTimeout(returnTimer);
				if (returnToIdle && clip !== 'idle') {
					const recoveryDelay = Math.ceil(next.getClip().duration * 1_000) + 80;
					returnTimer = window.setTimeout(() => playClip?.('idle'), recoveryDelay);
				}
			};

			playClip('idle');
			if (performance) {
				lastPerformance = performance;
				playClip(performance, false);
			}
			modelReady = true;

			const outline = new OutlineEffect(renderer, {
				defaultThickness: 0.0045,
				defaultColor: [0.025, 0.012, 0.07],
				defaultAlpha: 0.9,
				defaultKeepAlive: true
			});
			let elapsed = 0;
			let lastFrame = window.performance.now();
			let frameId = 0;
			let lastFaceStep = -1;
			let lastVoicePulse = voicePulse;
			let lastVoiceAt = 0;
			let smoothedCursorX = 0;
			let smoothedCursorY = 0;
			let researchTurn = 0;
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
			const proceduralPose = new AuthoredPoseLayer([
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
				const distance = (Math.max(verticalDistance, horizontalDistance) + poseSize.z * 0.55) * 0.6;
				camera.position.set(0, 0, distance);
				camera.near = Math.max(0.01, distance - poseSize.z * 2);
				camera.far = distance + poseSize.z * 4;
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
			};
			const resizeObserver = new ResizeObserver(resize);
			resizeObserver.observe(mountContainer);
			resize();

			const render = (now = window.performance.now()) => {
				const delta = Math.min((now - lastFrame) / 1000, 0.05);
				lastFrame = now;
				elapsed += delta;

				// The mixer owns the authored pose. Remove last frame's procedural offsets
				// before advancing it, then save a clean base for this rendered frame.
				proceduralPose.restore();
				mixer.update(delta);
				proceduralPose.capture();
				presentation.position.y = Math.sin(elapsed * 1.7) * 0.035;
				const turnedTowardWorkstation =
					actionName === 'workstation_turn' || actionName.startsWith('research_');
				const targetTurn = turnedTowardWorkstation ? Math.PI : 0;
				researchTurn += (targetTurn - researchTurn) * Math.min(delta * 2.4, 1);
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
					proceduralEuler.set(
						-smoothedCursorY * 0.075 * gazeWeight,
						smoothedCursorX * 0.12 * gazeWeight,
						speaking ? Math.sin(elapsed * 8.5) * 0.012 : 0,
						'XYZ'
					);
					proceduralQuaternion.setFromEuler(proceduralEuler);
					headBone.quaternion.multiply(proceduralQuaternion);
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

				if (
					researching &&
					now - lastAnchorUpdate >= 80 &&
					seatMarker &&
					headMarker &&
					leftHandMarker &&
					rightHandMarker
				) {
					lastAnchorUpdate = now;
					presentation.updateMatrixWorld(true);
					const stageRect = stageElement?.getBoundingClientRect();
					if (!stageRect) return;
					const settledResearchShiftX = stageRect.width * 0.38;
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
						updatedAt: now
					});
				}

				outline.render(scene, camera);
				frameId = window.requestAnimationFrame(render);
			};
			render();

			cleanupThree = () => {
				window.cancelAnimationFrame(frameId);
				window.clearTimeout(returnTimer);
				for (const timer of transitionTimers) window.clearTimeout(timer);
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
	bind:this={stageElement}
	class="live-sage-stage"
	class:fallback={useFallback}
	class:ready={modelReady}
	class:researching
	class:resetting
	data-mood={personality.mood}
	data-performance={performance ?? 'idle'}
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
	.live-sage-stage {
		position: fixed;
		left: clamp(10px, 2vw, 42px);
		top: calc(46% - (var(--sage-altitude) * 18vh));
		width: min(72vw, 1100px);
		height: min(calc(98vh - (var(--sage-altitude) * 8vh)), 1020px);
		z-index: 7;
		pointer-events: none;
		transform: translateY(-50%);
		transition: top 720ms cubic-bezier(0.16, 0.9, 0.22, 1);
	}

	/* Dialogue uses the larger hero framing above. Research needs its own authored
	   camera footprint so the turned chair, hands, keyboard, and cart read as one
	   performance instead of a giant canvas colliding with the workstation. */
	.live-sage-stage.researching {
		left: clamp(6px, 1vw, 18px);
		top: 48%;
		width: min(55vw, 840px);
		height: min(76vh, 800px);
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

	.researching[data-performance='workstation_exit'] .sage-motion {
		animation: sage-leaves-for-computer 900ms steps(8, end) both;
	}

	.researching[data-performance='workstation_push'] .sage-motion {
		animation: sage-pushes-computer-in 1.95s steps(14, end) both;
	}

	.researching[data-performance='workstation_park'] .sage-motion {
		animation: sage-parks-computer 1.1s steps(8, end) both;
	}

	.researching[data-performance='workstation_turn'] .sage-motion {
		animation: sage-turns-at-computer 1.3s steps(10, end) both;
	}

	.researching[data-performance^='research_'] .sage-motion {
		transform: translateX(38%);
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

	@keyframes sage-leaves-for-computer {
		from {
			transform: translateX(0) rotate(0);
		}
		to {
			transform: translateX(calc(110vw + 38%)) rotate(4deg);
		}
	}

	@keyframes sage-pushes-computer-in {
		from {
			transform: translateX(calc(110vw + 38%)) rotate(4deg);
		}
		72% {
			transform: translateX(35%) rotate(-2deg);
		}
		to {
			transform: translateX(38%) rotate(1deg);
		}
	}

	@keyframes sage-parks-computer {
		0%,
		100% {
			transform: translateX(38%) rotate(1deg);
		}
		35% {
			transform: translateX(32%) rotate(-3deg);
		}
		62% {
			transform: translateX(41%) rotate(2deg);
		}
	}

	@keyframes sage-turns-at-computer {
		from {
			transform: translateX(38%) rotate(1deg);
		}
		55% {
			transform: translateX(36%) rotate(-1deg);
		}
		to {
			transform: translateX(38%) rotate(0);
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
			transform: translateX(38%);
		}
	}
</style>
