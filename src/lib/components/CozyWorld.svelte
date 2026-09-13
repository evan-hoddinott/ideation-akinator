<script lang="ts">
	import { onMount } from 'svelte';
	import { pixelViewport } from '$lib/cozy-render';
	import { ERA_HEIGHT, EraJourney } from '$lib/era-journey';
	import { createWebpageBackdrop } from '$lib/webpage-backdrop';
	import { pixelRevealRanks, revealedPixelCount } from '$lib/pixel-gradient';
	let {
		altitude,
		calm = false,
		paused = false,
		onEraChange = () => {}
	}: {
		altitude: number;
		calm?: boolean;
		paused?: boolean;
		onEraChange?: (index: number) => void;
	} = $props();
	let canvas: HTMLCanvasElement;
	onMount(() => {
		let disposed = false,
			cleanup = () => {};
		void (async () => {
			try {
				const THREE = await import('three');
				const { createWebpageWorld } = await import('$lib/webpage-world');
				if (disposed) return;
				const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
				renderer.setPixelRatio(1);
				renderer.outputColorSpace = THREE.SRGBColorSpace;
				const scene = new THREE.Scene();
				scene.add(new THREE.HemisphereLight(0xfff1db, 0xa6ac98, 2.1));
				const sunlight = new THREE.DirectionalLight(0xffe7c5, 1.8);
				sunlight.position.set(-5, 10, 8);
				scene.add(sunlight);
				const world = createWebpageWorld();
				scene.add(world.root);
				const skies = Array.from({ length: 14 }, (_, index) => createWebpageBackdrop(index));
				let masks: import('three').DataTexture[] = [];
				const camera = new THREE.OrthographicCamera(-14, 14, 10, -10, 0.1, 100);
				const a = new THREE.WebGLRenderTarget(1, 1, {
					minFilter: THREE.NearestFilter,
					magFilter: THREE.NearestFilter
				});
				const b = a.clone();
				const material = new THREE.ShaderMaterial({
					uniforms: {
						before: { value: a.texture },
						after: { value: b.texture },
						progress: { value: 0 },
						revealOrder: { value: null as import('three').DataTexture | null },
						revealCount: { value: 0 },
						resolution: { value: new THREE.Vector2(1, 1) }
					},
					vertexShader:
						'varying vec2 uv0; void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',
					fragmentShader: `uniform sampler2D before;uniform sampler2D after;uniform sampler2D revealOrder;uniform float revealCount;varying vec2 uv0;
 void main(){vec3 packedRank=floor(texture2D(revealOrder,uv0).rgb*255.+.5);float rank=packedRank.r+packedRank.g*256.+packedRank.b*65536.;
 gl_FragColor=mix(texture2D(before,uv0),texture2D(after,uv0),1.-step(revealCount,rank));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
				});
				const quadGeometry = new THREE.PlaneGeometry(2, 2);
				const composite = new THREE.Scene();
				const quad = new THREE.Mesh(quadGeometry, material);
				quad.frustumCulled = false;
				composite.add(quad);
				const resize = () => {
					const size = pixelViewport(innerWidth, innerHeight, innerHeight);
					renderer.setSize(size.width, size.height, false);
					skies.forEach((s) => s.resize());
					world.zones.forEach((zone, index) => {
						zone.scale.set(innerWidth < 760 ? 0.48 : 1, innerWidth < 760 ? 0.55 : 1, 1);
						zone.position.y = index * ERA_HEIGHT + (innerWidth < 760 ? 8 : 0);
					});
					a.setSize(size.width, size.height);
					b.setSize(size.width, size.height);
					material.uniforms.resolution.value.set(size.width, size.height);
					masks.forEach((m) => m.dispose());
					masks = [false, true].map((reverse) => {
						const ranks = pixelRevealRanks(size.width, size.height, reverse);
						const data = new Uint8Array(ranks.length * 4);
						ranks.forEach((rank, i) => {
							data[i * 4] = rank & 255;
							data[i * 4 + 1] = (rank >>> 8) & 255;
							data[i * 4 + 2] = (rank >>> 16) & 255;
							data[i * 4 + 3] = 255;
						});
						const texture = new THREE.DataTexture(data, size.width, size.height);
						texture.magFilter = THREE.NearestFilter;
						texture.minFilter = THREE.NearestFilter;
						texture.needsUpdate = true;
						return texture;
					});

					const halfWidth = Math.max(9, (10 * innerWidth) / innerHeight);
					camera.left = -halfWidth;
					camera.right = halfWidth;
					camera.top = (halfWidth * innerHeight) / innerWidth;
					camera.bottom = -camera.top;
					camera.updateProjectionMatrix();
				};
				resize();
				window.addEventListener('resize', resize);
				const reduced = matchMedia('(prefers-reduced-motion: reduce)');
				const journey = new EraJourney(altitude);
				const preview = import.meta.env.DEV ? new URL(location.href).searchParams : null;
				let frame = 0,
					previous = 0,
					lastEra = -1;
				let sceneTime = 0;
				let pausedFrame = '';
				const renderEra = (
					index: number,
					drift: number,
					target: import('three').WebGLRenderTarget
				) => {
					const y = index * ERA_HEIGHT + drift;
					camera.position.set(0, y, 30);
					camera.lookAt(0, y, 0);
					world.zones.forEach((zone, i) => (zone.visible = i === index));
					world.zones[index].children.forEach((child) => {
						if (
							/Video player|Player control bar|Scrubber rail|Video playhead|Rating star|Pause button|Play button/.test(
								child.name
							)
						)
							child.visible = innerWidth >= 760;
					});
					scene.background = skies[index].texture;
					renderer.setRenderTarget(target);
					renderer.render(scene, camera);
				};
				const draw = (now: number) => {
					frame = requestAnimationFrame(draw);
					if (document.hidden) {
						previous = now;
						return;
					}
					if (now - previous < 1000 / 24) return;
					const delta = Math.min((now - previous) / 1000, 0.1);
					previous = now;
					if (!paused) journey.advance(delta, altitude, calm || reduced.matches);
					if (preview?.has('webMix')) {
						const safe = (value: string | null, max: number) =>
							Math.max(0, Math.min(max, Number(value) || 0));
						journey.current = Math.floor(safe(preview.get('webFrom'), 13));
						journey.next = Math.floor(safe(preview.get('webTo'), 13));
						journey.mix = safe(preview.get('webMix'), 1);
					}
					if (!paused) sceneTime += delta;
					const era = journey.mix < 0.5 ? journey.current : journey.next;
					if (era !== lastEra) {
						onEraChange(era);
						lastEra = era;
					}
					canvas.dataset.era = String(era);
					canvas.dataset.merge = journey.mix.toFixed(6);
					canvas.dataset.revealed = String(revealedPixelCount(journey.mix, a.width * a.height));
					// Native media pages own their player and measured 3D bezel.
					// Keep the journey clock, but do not render an opaque world behind them.
					const nativeMedia = [8, 10, 11].includes(era) && journey.current === journey.next;
					canvas.style.visibility = nativeMedia ? 'hidden' : 'visible';
					if (nativeMedia) return;
					const frameKey = `${innerWidth}:${innerHeight}:${journey.current}:${journey.next}:${journey.mix}`;
					if (paused && pausedFrame === frameKey) return;
					pausedFrame = paused ? frameKey : '';
					world.animate(sceneTime, calm || reduced.matches);
					skies[journey.current].animate(sceneTime, calm || reduced.matches);
					if (journey.next !== journey.current)
						skies[journey.next].animate(sceneTime, calm || reduced.matches);
					const direction = Math.sign(journey.next - journey.current);
					renderEra(journey.current, journey.mix * 2.8 * direction, a);
					if (journey.next !== journey.current)
						renderEra(journey.next, -(1 - journey.mix) * 2.8 * direction, b);
					material.uniforms.progress.value = journey.mix;
					material.uniforms.revealOrder.value = masks[direction < 0 ? 1 : 0];
					material.uniforms.revealCount.value = revealedPixelCount(journey.mix, a.width * a.height);
					renderer.setRenderTarget(null);
					renderer.render(composite, camera);
				};
				frame = requestAnimationFrame(draw);
				cleanup = () => {
					cancelAnimationFrame(frame);
					window.removeEventListener('resize', resize);
					world.dispose();
					masks.forEach((m) => m.dispose());
					skies.forEach((s) => s.dispose());
					a.dispose();
					b.dispose();
					material.dispose();
					quadGeometry.dispose();
					renderer.dispose();
				};
			} catch (error) {
				console.warn('Cozy scenery is using its static sky fallback.', error);
			}
		})();
		return () => {
			disposed = true;
			cleanup();
		};
	});
</script>

<canvas bind:this={canvas} class="cozy-world" aria-hidden="true"></canvas>

<style>
	.cozy-world {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		pointer-events: none;
	}
</style>
