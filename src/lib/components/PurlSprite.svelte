<script lang="ts">
	import { onMount } from 'svelte';
	let {
		action = 'sit',
		size = 96,
		calm = false,
		paused = false,
		label = 'Purl the cat'
	}: {
		action?: 'sit' | 'paw' | 'sleep' | 'groom' | 'alert' | 'yawn' | 'walk';
		size?: number;
		calm?: boolean;
		paused?: boolean;
		label?: string;
	} = $props();
	const poses = {
		sit: [[3, 3]],
		paw: [
			[2, 2],
			[2, 3]
		],
		sleep: [
			[2, 0],
			[2, 1]
		],
		groom: [
			[5, 0],
			[6, 0],
			[7, 0]
		],
		alert: [[7, 3]],
		yawn: [[3, 2]],
		walk: [
			[3, 0],
			[3, 1]
		]
	};
	let frame = $state(0);
	let hidden = $state(false);
	let reducedMotion = $state(false);
	const pose = $derived(poses[action][frame % poses[action].length]);
	onMount(() => {
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => {
			hidden = document.hidden;
			reducedMotion = media.matches;
		};
		update();
		document.addEventListener('visibilitychange', update);
		media.addEventListener('change', update);
		return () => {
			document.removeEventListener('visibilitychange', update);
			media.removeEventListener('change', update);
		};
	});
	$effect(() => {
		const count = poses[action].length;
		frame = 0;
		if (calm || paused || hidden || reducedMotion || count < 2) return;
		const timer = window.setInterval(
			() => {
				frame = (frame + 1) % count;
			},
			action === 'sleep' ? 700 : 180
		);
		return () => window.clearInterval(timer);
	});
</script>

<span
	class="purl-sprite"
	role="img"
	aria-label={label}
	data-purl-action={action}
	style={`width:${size}px;height:${size}px;background-size:${size * 8}px ${size * 4}px;background-position:${-pose[0] * size}px ${-pose[1] * size}px;`}
></span>

<style>
	.purl-sprite {
		display: inline-block;
		flex-shrink: 0;
		vertical-align: middle;
		background-image: url('/images/purl/oneko.gif');
		background-repeat: no-repeat;
		image-rendering: pixelated;
		filter: drop-shadow(2px 3px 0 #33263b55);
	}
</style>
