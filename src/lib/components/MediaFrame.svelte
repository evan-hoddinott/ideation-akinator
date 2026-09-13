<script lang="ts">
	import { onMount } from 'svelte';
	import { pixelViewport } from '$lib/cozy-render';
	let { target, dark = false }: { target: HTMLElement; dark?: boolean } = $props();
	let canvas: HTMLCanvasElement;
	onMount(() => {
		let disposed = false;
		let cleanup = () => {};
		void (async () => {
			const THREE = await import('three');
			if (disposed) return;
			let renderer: InstanceType<typeof THREE.WebGLRenderer>;
			try {
				renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
			} catch {
				return;
			}
			renderer.setPixelRatio(1);
			renderer.setClearColor(0x000000, 0);
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			const scene = new THREE.Scene();
			scene.add(new THREE.HemisphereLight(0xfff4dc, 0x797080, 2));
			const light = new THREE.DirectionalLight(0xffe7c5, 2);
			light.position.set(-100, 250, 600);
			scene.add(light);
			const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 0.1, 1000);
			camera.position.z = 500;
			const material = new THREE.MeshStandardMaterial({
				color: dark ? 0x51465f : 0xc5b89d,
				roughness: 0.94,
				metalness: 0
			});
			let frame: InstanceType<typeof THREE.Mesh> | null = null;
			const resize = () => {
				if (disposed) return;
				const area = canvas.getBoundingClientRect(),
					screen = target.getBoundingClientRect();
				if (!area.width || !area.height || !screen.width || !screen.height) return;
				const pixels = pixelViewport(area.width, area.height, innerHeight);
				renderer.setSize(pixels.width, pixels.height, false);
				camera.right = area.width;
				camera.bottom = -area.height;
				camera.updateProjectionMatrix();
				if (frame) {
					scene.remove(frame);
					frame.geometry.dispose();
				}
				const x = screen.left - area.left,
					y = area.top - screen.top;
				const w = screen.width,
					h = screen.height,
					edge = 6;
				const shape = new THREE.Shape();
				shape.moveTo(x - edge, y + edge);
				shape.lineTo(x + w + edge, y + edge);
				shape.lineTo(x + w + edge, y - h - edge);
				shape.lineTo(x - edge, y - h - edge);
				shape.closePath();
				const hole = new THREE.Path();
				hole.moveTo(x, y);
				hole.lineTo(x, y - h);
				hole.lineTo(x + w, y - h);
				hole.lineTo(x + w, y);
				hole.closePath();
				shape.holes.push(hole);
				frame = new THREE.Mesh(
					new THREE.ExtrudeGeometry(shape, {
						depth: 4,
						bevelEnabled: true,
						bevelSegments: 1,
						steps: 1,
						bevelSize: 2,
						bevelThickness: 2
					}),
					material
				);
				frame.name = 'Player bezel measured from its visible screen';
				scene.add(frame);
				renderer.render(scene, camera);
				canvas.dataset.frame = JSON.stringify({ x, y: -y, width: w, height: h });
			};
			const observer = new ResizeObserver(resize);
			observer.observe(canvas);
			observer.observe(target);
			if (target.parentElement) observer.observe(target.parentElement);
			window.addEventListener('resize', resize);
			resize();
			cleanup = () => {
				observer.disconnect();
				window.removeEventListener('resize', resize);
				frame?.geometry.dispose();
				material.dispose();
				renderer.dispose();
			};
		})();
		return () => {
			disposed = true;
			cleanup();
		};
	});
</script>

<canvas bind:this={canvas} class="media-frame" aria-hidden="true"></canvas>

<style>
	.media-frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		image-rendering: pixelated;
		z-index: 2;
	}
</style>
