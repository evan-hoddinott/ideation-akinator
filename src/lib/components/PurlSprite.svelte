<script lang="ts">
	import { onMount } from 'svelte';
	import type { PurlAction } from '$lib/purl-3d';
	let {
		action = 'sit',
		size = 96,
		calm = false,
		paused = false,
		label = 'Purl the cat'
	}: {
		action?: PurlAction;
		size?: number;
		calm?: boolean;
		paused?: boolean;
		label?: string;
	} = $props();
	let canvas = $state<HTMLCanvasElement>();
	let failed = $state(false);
	onMount(() => {
		let alive = true;
		let cleanup = () => {};
		(async () => {
			try {
				const THREE = await import('three');
				const { createPurl } = await import('$lib/purl-3d');
				if (!alive) return;
				const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
				renderer.setSize(96, 96, false);
				renderer.setPixelRatio(1);
				const scene = new THREE.Scene();
				scene.add(new THREE.HemisphereLight(0xfff1d6, 0x8fa28a, 2.1));
				const light = new THREE.DirectionalLight(0xffffff, 2);
				light.position.set(2, 4, 3);
				scene.add(light);
				const cat = createPurl();
				scene.add(cat.root);
				cat.root.rotation.y = -0.35;
				const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
				camera.position.set(1.5, 1.1, 2.5);
				camera.lookAt(0, 0.65, 0);
				const reduced = matchMedia('(prefers-reduced-motion: reduce)');
				let raf = 0,
					last = performance.now(),
					elapsed = 0;
				const draw = (now: number) => {
					if (!alive) return;
					if (now - last >= 1000 / 15) {
						if (!paused && !document.hidden) elapsed += Math.min((now - last) / 1000, 0.1);
						last = now;
						cat.update(elapsed, action, calm || reduced.matches);
						renderer.render(scene, camera);
					}
					raf = requestAnimationFrame(draw);
				};
				raf = requestAnimationFrame(draw);
				cleanup = () => {
					cancelAnimationFrame(raf);
					cat.dispose();
					renderer.dispose();
				};
			} catch {
				if (alive) failed = true;
			}
		})();
		return () => {
			alive = false;
			cleanup();
		};
	});
</script>

<span
	class="purl-model"
	role="img"
	aria-label={label}
	data-purl-action={action}
	style={`width:${size}px;height:${size}px`}
>
	{#if failed}<span class="fallback">♧</span>{:else}<canvas bind:this={canvas} aria-hidden="true"
		></canvas>{/if}
</span>

<style>
	.purl-model {
		display: inline-block;
		flex-shrink: 0;
		vertical-align: middle;
	}
	canvas {
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
	}
	.fallback {
		font-size: 48px;
		color: #e9e1cb;
	}
</style>
