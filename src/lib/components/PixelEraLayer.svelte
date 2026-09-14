<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pixelViewport } from '$lib/cozy-render';
	import { pixelRevealRanks, revealedPixelCount } from '$lib/pixel-gradient';

	let {
		journey,
		era,
		children
	}: {
		journey: { current: number; next: number; mix: number };
		era: number;
		children: Snippet;
	} = $props();
	const id = $props.id();
	let width = $state(1),
		height = $state(1),
		scale = $state(1);
	let grid = $state('');
	let mask = $state('');
	let maskCanvas: HTMLCanvasElement;
	let maskContext: CanvasRenderingContext2D | null;
	let maskPixels: ImageData;
	let ranks: Uint32Array[] = [];
	let revision = $state(0);
	let lastMask = '';

	onMount(() => {
		maskCanvas = document.createElement('canvas');
		maskContext = maskCanvas.getContext('2d');
		const resize = () => {
			width = innerWidth;
			height = innerHeight;
			const size = pixelViewport(width, height, height);
			scale = size.scale;
			// A displacement map samples the centre of each render-grid cell.
			// Media artwork samples this grid; native controls keep their readable text.
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx || !maskContext) return;
			const pixels = ctx.createImageData(width, height);
			for (let y = 0; y < height; y++)
				for (let x = 0; x < width; x++) {
					const i = (y * width + x) * 4;
					pixels.data[i] = Math.round(
						255 * (0.5 + (Math.floor(x / scale) * scale + (scale - 1) / 2 - x) / (2 * scale))
					);
					pixels.data[i + 1] = Math.round(
						255 * (0.5 + (Math.floor(y / scale) * scale + (scale - 1) / 2 - y) / (2 * scale))
					);
					pixels.data[i + 3] = 255;
				}
			ctx.putImageData(pixels, 0, 0);
			grid = canvas.toDataURL();
			maskCanvas.width = size.width;
			maskCanvas.height = size.height;
			maskPixels = maskContext.createImageData(size.width, size.height);
			ranks = [
				pixelRevealRanks(size.width, size.height),
				pixelRevealRanks(size.width, size.height, true)
			];
			lastMask = '';
			revision++;
		};
		resize();
		window.addEventListener('resize', resize);
		return () => window.removeEventListener('resize', resize);
	});

	$effect(() => {
		if (!revision || !maskContext) return;
		if (journey.current === journey.next) {
			mask = '';
			lastMask = '';
			return;
		}
		const count = revealedPixelCount(journey.mix, maskCanvas.width * maskCanvas.height);
		const key = `${journey.current}:${journey.next}:${count}`;
		if (key === lastMask) return;
		lastMask = key;
		const order = ranks[journey.next < journey.current ? 1 : 0];
		const incoming = era === journey.next;
		for (let y = 0; y < maskCanvas.height; y++)
			for (let x = 0; x < maskCanvas.width; x++) {
				// WebGL's texture origin is below the DOM canvas origin.
				const revealed = order[(maskCanvas.height - 1 - y) * maskCanvas.width + x] < count;
				maskPixels.data[(y * maskCanvas.width + x) * 4 + 3] = revealed === incoming ? 255 : 0;
			}
		maskContext.putImageData(maskPixels, 0, 0);
		mask = maskCanvas.toDataURL();
	});
</script>

<svg width="0" height="0" aria-hidden="true">
	<defs>
		<filter
			{id}
			x="0"
			y="0"
			{width}
			{height}
			filterUnits="userSpaceOnUse"
			color-interpolation-filters="sRGB"
		>
			<feImage href={grid} x="0" y="0" {width} {height} preserveAspectRatio="none" result="grid" />
			<feDisplacementMap
				in="SourceGraphic"
				in2="grid"
				scale={2 * scale}
				xChannelSelector="R"
				yChannelSelector="G"
			/>
		</filter>
	</defs>
</svg>
<div
	class="pixel-era-layer"
	data-pixel-era={era}
	data-pixel-scale={scale}
	style:mask-image={mask ? `url(${mask})` : 'none'}
>
	<div class="pixel-content" style:--era-pixel-filter={grid ? `url(#${id})` : 'none'}>
		{@render children()}
	</div>
</div>

<style>
	svg {
		position: absolute;
		pointer-events: none;
	}
	.pixel-era-layer,
	.pixel-content {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.pixel-era-layer {
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		image-rendering: pixelated;
	}
</style>
