<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { asset } from '$app/paths';
	import { catPlaylist, clipDuration } from '$lib/cat-media';
	import MediaFrame from './MediaFrame.svelte';
	let {
		era,
		runId,
		paused,
		calm
	}: { era: 8 | 10 | 11; runId: string; paused: boolean; calm: boolean } = $props();
	const playlist = $derived(catPlaylist(runId));
	let selected = $state(0);
	let video = $state<HTMLVideoElement>();
	let player = $state<HTMLElement>();
	let root = $state<HTMLElement>();
	let playing = $state(false);
	let mediaReady = $state(false);
	let reducedMotion = $state(false);
	let pending = $state(false);
	let time = $state(0);
	let playbackError = $state('');
	let liked = $state<string[]>([]);
	let commentsOpen = $state(false);
	let mounted = false;
	let playRequest = 0;
	const clip = $derived(playlist[selected]);
	const related = $derived(
		Array.from({ length: 4 }, (_, i) => (selected + i + 1) % playlist.length)
	);
	const storageKey = $derived(`ideation-akinator:media:${runId}:${era}`);
	const dark = $derived(era === 11);
	const title = $derived(
		era === 8 ? 'Cat YouTube' : era === 10 ? 'Purlgram photo feed' : 'For You video feed'
	);

	onMount(() => {
		try {
			const saved = Number(localStorage.getItem(storageKey));
			if (Number.isInteger(saved) && saved >= 0 && saved < playlist.length) selected = saved;
		} catch {
			/* Browsing still works when storage is unavailable. */
		}
		mounted = true;
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => {
			reducedMotion = motion.matches;
		};
		updateMotion();
		motion.addEventListener('change', updateMotion);
		const visibility = () => {
			if (document.hidden) stop();
		};
		const outside = (event: Event) => {
			if (event.target instanceof Node && !root?.contains(event.target)) stop();
		};
		document.addEventListener('visibilitychange', visibility);
		document.addEventListener('focusin', outside);
		document.addEventListener('pointerdown', outside);
		return () => {
			mounted = false;
			stop();
			motion.removeEventListener('change', updateMotion);
			document.removeEventListener('visibilitychange', visibility);
			document.removeEventListener('focusin', outside);
			document.removeEventListener('pointerdown', outside);
		};
	});
	$effect(() => {
		if (paused || calm || reducedMotion) stop();
	});
	function stop() {
		playRequest++;
		video?.pause();
		playing = false;
		pending = false;
	}
	async function play() {
		if (!video || paused) return;
		const request = ++playRequest;
		const target = video;
		pending = true;
		playbackError = '';
		try {
			await target.play();
			if (!mounted || request !== playRequest || paused || target !== video) {
				target.pause();
				return;
			}
			playing = true;
		} catch {
			if (mounted && request === playRequest)
				playbackError = 'This clip could not play. Try another video.';
		} finally {
			if (request === playRequest) pending = false;
		}
	}
	async function select(index: number) {
		stop();
		const changed = selected !== index;
		selected = index;
		if (changed) {
			mediaReady = false;
			time = 0;
		}
		playbackError = '';
		commentsOpen = false;
		try {
			localStorage.setItem(storageKey, String(index));
		} catch {
			/* Optional preference. */
		}
		await tick();
		// Clip selection is explicit playback intent; no background autoplay on entry.
		if (!calm && !reducedMotion) await play();
	}
	function toggleLike() {
		liked = liked.includes(clip.id) ? liked.filter((id) => id !== clip.id) : [...liked, clip.id];
	}
	function seek(event: Event) {
		if (video) {
			const next = Number((event.currentTarget as HTMLInputElement).value);
			video.currentTime = next;
			time = next;
		}
	}
</script>

<section
	bind:this={root}
	class="media-era"
	class:youtube={era === 8}
	class:photo-feed={era === 10}
	class:short-feed={era === 11}
	aria-label={title}
	data-media-era={era}
>
	<header class="site-header">
		<div class="brand">
			{#if era === 8}You<span>Tube</span>{:else if era === 10}purlgram{:else}<b aria-hidden="true"
					>♪</b
				> purltok{/if}
		</div>
		<div class="site-tagline">
			{era === 8
				? 'Broadcast Your Cat'
				: era === 10
					? 'Little moments. Several whiskers.'
					: 'One more video. Then we build.'}
		</div>
		<a
			class="credits"
			href={asset('/media/cats/index.html')}
			target="_blank"
			rel="noopener noreferrer">Video credits ↗</a
		>
	</header>
	{#if era === 10}<div class="stories" aria-label="Photo stories">
			{#each playlist.slice(5, 10) as item (item.id)}<button
					type="button"
					onclick={() => select(playlist.indexOf(item))}
					aria-label={`View ${item.title}`}
					><img src={item.thumbnail} alt="" /><span>{item.id.replaceAll('-', ' ')}</span></button
				>{/each}
		</div>{/if}
	{#if era === 11}<aside class="feed-nav" aria-hidden="true">
			<strong>For You</strong><span>Following</span><span>Explore</span>
			<hr />
			<small>THE INTERNET<br />HAS YOUR ATTENTION</small>
		</aside>{/if}
	<div class="page-grid">
		<main class="watch">
			{#if era !== 11}<div class="video-heading">
					{#if era === 10}<img src={playlist[8].thumbnail} alt="" /><span
							><strong>purl.the.intern</strong><small>Somewhere on the internet</small></span
						>{:else}<h2>{clip.title}</h2>
						<small>Uploaded by {clip.author}</small>{/if}
				</div>{/if}
			<div bind:this={player} class="player" class:portrait={era === 11}>
				{#key clip.id}<video
						bind:this={video}
						src={clip.src}
						poster={clip.poster}
						muted
						playsinline
						preload="none"
						aria-label={clip.title}
						onloadedmetadata={() => (mediaReady = true)}
						ontimeupdate={() => {
							time = video?.currentTime ?? 0;
						}}
						onended={() => {
							playing = false;
						}}
						onerror={() => {
							mediaReady = false;
							playbackError = 'This clip is unavailable. Choose another video.';
							playing = false;
							pending = false;
						}}
					></video>{/key}
				{#if !playing}<button
						class="play-overlay"
						type="button"
						disabled={paused || pending}
						onclick={play}
						aria-label={`Play ${clip.title}`}
						><span aria-hidden="true">▶</span><small
							>{pending ? 'Opening clip…' : 'Play clip'}</small
						></button
					>{/if}
				{#if era === 11}<div class="caption">
						<strong>@purl.the.intern</strong>
						<p>{clip.title}</p>
						<small>♫ original silence · a cat production</small>
					</div>
					<div class="action-rail">
						<button
							class:chosen={liked.includes(clip.id)}
							aria-pressed={liked.includes(clip.id)}
							aria-label="Like this cat video"
							onclick={toggleLike}
							><span aria-hidden="true">♥</span><small
								>{liked.includes(clip.id) ? '302' : '301'}</small
							></button
						><button
							aria-expanded={commentsOpen}
							aria-label="Show cat video comments"
							onclick={() => (commentsOpen = !commentsOpen)}
							><span aria-hidden="true">▤</span><small>2</small></button
						><button
							aria-label="Next cat video"
							onclick={() => select((selected + 1) % playlist.length)}
							><span aria-hidden="true">↓</span><small>Next</small></button
						>
					</div>
				{/if}
			</div>
			<div class="player-controls">
				<button
					type="button"
					disabled={paused || pending}
					aria-label={playing ? 'Pause cat video' : 'Play cat video'}
					onclick={() => (playing ? stop() : play())}>{playing ? 'Ⅱ' : '▶'}</button
				><label
					><span class="sr-only">Cat video playback position</span><input
						type="range"
						min="0"
						max={clip.durationSeconds}
						step="0.1"
						value={time}
						disabled={!mediaReady}
						oninput={seek}
					/></label
				><output>{clipDuration(time)} / {clipDuration(clip.durationSeconds)}</output><button
					type="button"
					onclick={() => select((selected + 1) % playlist.length)}
					aria-label="Next cat video">▸▸</button
				>
			</div>
			{#if playbackError}<p class="playback-error" role="status">{playbackError}</p>{/if}
			{#if era !== 11}<div class="under-video">
					<button
						type="button"
						class:chosen={liked.includes(clip.id)}
						aria-pressed={liked.includes(clip.id)}
						onclick={toggleLike}
						>{era === 8 ? '★ ★ ★ ★ ★' : '♥'}
						<span>{liked.includes(clip.id) ? 'Liked' : 'Like'}</span></button
					><span>{liked.includes(clip.id) ? '302' : '301'} {era === 8 ? 'views' : 'likes'}</span
					><button
						type="button"
						aria-expanded={commentsOpen}
						onclick={() => (commentsOpen = !commentsOpen)}>Comments (2)</button
					>
				</div>{/if}
			{#if era === 10}<p class="photo-caption">
					<strong>purl.the.intern</strong>
					{clip.title} <span>#catsofthenet</span>
				</p>{/if}
			{#if commentsOpen}<div class="comments">
					<p><strong>modem_mom</strong> please let him cook</p>
					<p><strong>xX_Sage_Xx</strong> this is preliminary research</p>
				</div>{/if}
			{#if era === 8}<p class="video-note">
					Ten short cat clips. No algorithm. Purl picked the order.
				</p>{/if}
		</main>
		<aside class="related" aria-label={era === 8 ? 'Related cat videos' : 'More from the feed'}>
			<h3>{era === 8 ? 'Related videos' : era === 10 ? 'From your friends' : 'Up next'}</h3>
			{#each related as index (playlist[index].id)}{@const item = playlist[index]}<button
					type="button"
					onclick={() => select(index)}
					aria-label={`Watch ${item.title}`}
					><div class="thumbnail">
						<img src={item.thumbnail} alt="" loading="lazy" /><span
							>{clipDuration(item.durationSeconds)}</span
						>
					</div>
					<div class="video-info">
						<strong>{item.title}</strong><small
							>{era === 8 ? item.author : '@' + item.id.replaceAll('-', '.')}</small
						><small>{era === 8 ? '301 views' : 'A very good cat'}</small>
					</div></button
				>{/each}
		</aside>
	</div>
	{#if player}<MediaFrame target={player} {dark} />{/if}
</section>

<style>
	.media-era {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #f2eddf;
		color: #443d42;
		font:
			14px/1.5 Verdana,
			sans-serif;
		pointer-events: none;
		isolation: isolate;
	}
	.media-era button,
	.media-era a,
	.media-era input {
		pointer-events: auto;
	}
	.site-header {
		position: relative;
		inset: auto;
		width: 100%;
		margin: 0;
		box-shadow: none;
		border: 0;
		height: 92px;
		display: flex;
		align-items: center;
		gap: 28px;
		padding: 12px 32px;
		border-bottom: 2px solid #baac94;
		background: #f5efe0;
	}
	.brand {
		font:
			bold 38px/1 Georgia,
			serif;
		white-space: nowrap;
	}
	.brand > span {
		display: inline-block;
		padding: 6px;
		background: #a74743;
		color: #fff4dc;
		border-radius: 7px;
	}
	.site-tagline {
		color: #817261;
		font-size: 13px;
	}
	.credits {
		margin-left: auto;
		margin-right: 190px;
		color: #665076;
		font-size: 12px;
	}
	.page-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(260px, 28%);
		gap: 36px;
		padding: 18px 34px;
	}
	.watch {
		min-width: 0;
	}
	.video-heading {
		min-height: 60px;
		padding-bottom: 12px;
	}
	.video-heading h2 {
		font:
			bold 24px/1.3 Georgia,
			serif;
		margin: 0 0 4px;
		color: #493f46;
	}
	.video-heading small {
		font-size: 12px;
		color: #746c65;
	}
	.player {
		position: relative;
		width: 100%;
		height: clamp(190px, 34vh, 430px);
		background: #302e32;
		box-shadow: 7px 9px #554b4633;
	}
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.play-overlay {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		display: grid;
		gap: 4px;
		justify-items: center;
		padding: 12px 20px;
		background: #2e243bdf;
		color: #fff0da;
		border: 2px solid #d0b599;
		font:
			bold 24px Georgia,
			serif;
	}
	.play-overlay small {
		font:
			12px Verdana,
			sans-serif;
	}
	.player-controls {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 43px;
		padding: 5px 8px;
		background: linear-gradient(#ebdcc3, #c3b497);
		border: 2px outset #d9c9ac;
		margin-top: 8px;
	}
	.player-controls button {
		border: 1px outset #b4a484;
		background: #eadbc0;
		color: #453a49;
		min-width: 32px;
		min-height: 28px;
		font: 16px monospace;
	}
	.player-controls label {
		display: block;
		flex: 1;
		min-width: 35px;
	}
	.player-controls input {
		appearance: none;
		border: 1px solid #8f7b70;
		border-radius: 0;
		background: repeating-linear-gradient(90deg, #ac967c 0 8px, #ddcbb0 8px 11px);
		display: block;
		width: 100%;
		height: 12px;
		margin: 0;
		accent-color: #a85353;
	}
	.player-controls input::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 22px;
		border: 2px outset #dba0a3;
		border-radius: 0;
		background: #a55464;
		cursor: var(--cursor-select, pointer);
	}
	.player-controls input::-moz-range-thumb {
		width: 12px;
		height: 20px;
		border: 2px outset #dba0a3;
		border-radius: 0;
		background: #a55464;
		cursor: var(--cursor-select, pointer);
	}

	.player-controls output {
		white-space: nowrap;
		font: 12px monospace;
	}
	.under-video {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 14px 0;
		border-bottom: 1px solid #c7bba8;
	}
	.under-video button {
		border: 0;
		background: transparent;
		color: #9c773f;
		font:
			15px Verdana,
			sans-serif;
		padding: 5px;
	}
	.under-video button span {
		font-size: 12px;
		color: #635365;
	}
	.under-video > span {
		margin-right: auto;
		font-size: 12px;
		color: #817565;
	}
	.under-video button:last-child {
		font-size: 12px;
		color: #645777;
	}
	.related {
		max-height: calc(100dvh - 130px);
		overflow-y: auto;
		padding: 0 6px 8px 0;
		pointer-events: auto;
	}
	.related h3 {
		font:
			bold 17px Georgia,
			serif;
		margin: 3px 0 16px;
	}
	.related > button {
		display: grid;
		grid-template-columns: 42% minmax(0, 1fr);
		width: 100%;
		gap: 12px;
		border: 0;
		background: transparent;
		padding: 8px 0;
		margin: 0 0 8px;
		text-align: left;
		color: inherit;
	}
	.thumbnail {
		position: relative;
		aspect-ratio: 16/9;
		background: #443d42;
		border: 2px solid #c6baa4;
	}
	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.thumbnail > span {
		position: absolute;
		right: 2px;
		bottom: 2px;
		color: #fff;
		background: #211b29d9;
		padding: 1px 3px;
		font: 11px monospace;
	}
	.video-info {
		min-width: 0;
	}
	.video-info strong {
		display: block;
		font:
			bold 13px/1.45 Verdana,
			sans-serif;
		color: #5a6485;
	}
	.video-info small {
		display: block;
		color: #817667;
		font-size: 11px;
		margin-top: 4px;
	}
	.video-note {
		font-size: 12px;
		color: #837667;
	}
	button {
		cursor: var(--cursor-select, pointer);
	}
	button:hover {
		filter: brightness(1.1);
	}
	button:active {
		filter: brightness(0.92);
		box-shadow: inset 2px 2px #3e2b4855;
	}
	button:focus-visible,
	a:focus-visible,
	input:focus-visible {
		outline: 3px solid #ad7757;
		outline-offset: 3px;
	}
	button:disabled {
		opacity: 0.55;
		cursor: wait;
	}
	button.chosen {
		color: #a34362;
	}
	.comments,
	.playback-error {
		padding: 12px;
		background: #e5d6dc;
		border: 1px solid #b68e9b;
		color: #52344c;
		font:
			13px/1.5 Verdana,
			sans-serif;
	}
	.comments p {
		margin: 5px 0;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.photo-feed {
		background: #eee7df;
	}
	.photo-feed .site-header {
		background: #f9f5ed;
		border-color: #ccc0b7;
	}
	.photo-feed .brand {
		font:
			italic bold 38px Georgia,
			serif;
		color: #5d4263;
	}
	.stories {
		display: flex;
		gap: 25px;
		padding: 16px 6%;
		border-bottom: 1px solid #d1c0c5;
		background: #faf4e8;
		height: 118px;
	}
	.stories button {
		display: grid;
		justify-items: center;
		gap: 5px;
		background: none;
		border: 0;
		color: #6c566c;
		font:
			11px Verdana,
			sans-serif;
	}
	.stories img {
		width: 62px;
		height: 62px;
		object-fit: cover;
		border-radius: 50%;
		border: 4px solid #b67994;
		outline: 2px solid #dec7a9;
		outline-offset: 2px;
	}
	.photo-feed .page-grid {
		padding-top: 18px;
		grid-template-columns: minmax(0, 1fr) minmax(240px, 25%);
		max-width: 1300px;
		margin: auto;
	}
	.photo-feed .watch {
		padding: 16px;
		background: #fbf4e9;
		border: 1px solid #cbbbc2;
	}
	.photo-feed .video-heading {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 54px;
	}
	.photo-feed .video-heading img {
		width: 34px;
		height: 34px;
		object-fit: cover;
		border-radius: 50%;
	}
	.photo-feed .video-heading span {
		display: grid;
		font-size: 13px;
	}
	.photo-feed .player {
		height: 35vh;
	}
	.photo-feed .player-controls {
		background: #eadfdf;
		border-color: #c2aabd;
	}
	.photo-caption {
		font-size: 13px;
	}
	.photo-caption span {
		color: #775b7b;
	}
	.short-feed {
		background: #231e2a;
		color: #f2e2ed;
	}
	.short-feed .site-header {
		background: #292132;
		border-color: #67506d;
	}
	.short-feed .brand {
		font:
			bold 35px Verdana,
			sans-serif;
		color: #f7e9e7;
		text-shadow:
			2px 1px #966775,
			-2px -1px #78b2af;
	}
	.short-feed .brand b {
		font-size: 42px;
	}
	.short-feed .site-tagline,
	.short-feed .credits {
		color: #c4a8ca;
	}
	.feed-nav {
		position: absolute;
		left: 28px;
		top: 125px;
		display: grid;
		gap: 28px;
		width: 15%;
		font:
			19px Verdana,
			sans-serif;
		color: #b2a3b8;
	}
	.feed-nav strong {
		color: #edb3c7;
	}
	.feed-nav hr {
		width: 100%;
		border: 0;
		border-top: 1px solid #5d4c64;
	}
	.feed-nav small {
		font: 10px/1.8 monospace;
		color: #877890;
	}
	.short-feed .page-grid {
		grid-template-columns: minmax(240px, 420px) minmax(180px, 260px);
		padding: 24px 24px 20px 23%;
		gap: 65px;
	}
	.short-feed .player {
		height: calc(100dvh - 205px);
		min-height: 310px;
		max-height: 820px;
		border-radius: 5px;
	}
	.short-feed video {
		object-fit: cover;
	}
	.short-feed .caption {
		position: absolute;
		bottom: 18px;
		left: 14px;
		right: 54px;
		text-shadow: 0 2px 4px #000;
		background: linear-gradient(transparent, #231e2abb);
		padding: 18px 8px 4px;
	}
	.caption strong {
		font-size: 13px;
	}
	.caption p {
		font-size: 14px;
		margin: 8px 0;
	}
	.caption small {
		font-size: 10px;
	}
	.action-rail {
		position: absolute;
		right: 8px;
		bottom: 44px;
		display: grid;
		gap: 18px;
	}
	.action-rail button {
		display: grid;
		border: 0;
		color: #fff2e8;
		background: #30253688;
		padding: 4px;
		border-radius: 10px;
	}
	.action-rail span {
		font:
			30px Georgia,
			serif;
	}
	.action-rail small {
		font:
			10px Verdana,
			sans-serif;
	}
	.short-feed .player-controls {
		background: #41334a;
		color: #f9e4ed;
		border-color: #735a7f;
		gap: 6px;
	}
	.short-feed .player-controls button {
		background: #5e4769;
		color: #fff0e5;
		border-color: #987ea1;
	}
	.short-feed .related > button {
		grid-template-columns: 1fr;
		gap: 8px;
		padding: 0 0 16px;
		margin-bottom: 18px;
		border-bottom: 1px solid #56405f;
	}
	.short-feed .related > button:nth-of-type(n + 3) {
		display: none;
	}
	.short-feed .thumbnail {
		aspect-ratio: 9/12;
		border: 3px solid #705b79;
		transform: perspective(700px) rotateY(-7deg);
		box-shadow: 8px 8px #120f1977;
	}
	.short-feed .video-info strong {
		color: #e2c4e1;
	}
	.short-feed .video-info small {
		color: #b19abc;
	}
	@media (max-width: 1100px) {
		.site-header {
			padding: 12px 20px;
			gap: 16px;
		}
		.site-tagline {
			display: none;
		}
		.page-grid {
			padding: 18px 22px;
			gap: 26px;
			grid-template-columns: minmax(0, 1fr) 28%;
		}
		.related > button {
			grid-template-columns: 1fr;
			gap: 6px;
			margin-bottom: 10px;
			padding: 0;
		}
		.related .thumbnail {
			max-height: 95px;
		}
		.related .video-info small:last-child {
			display: none;
		}
		.video-heading h2 {
			font-size: 20px;
		}
		.short-feed .page-grid {
			padding-left: 20%;
			gap: 32px;
			grid-template-columns: minmax(240px, 1fr) 25%;
		}
		.short-feed .related .thumbnail {
			max-height: none;
		}
	}
	@media (max-width: 760px) {
		.media-era {
			overflow-y: auto;
			pointer-events: auto;
		}
		.related {
			max-height: none;
			overflow: visible;
		}
		.site-header {
			height: 74px;
			padding: 10px 14px;
			gap: 10px;
			align-items: flex-start;
		}
		.brand,
		.photo-feed .brand,
		.short-feed .brand {
			font-size: 25px;
		}
		.brand > span {
			padding: 4px;
		}
		.credits {
			margin: 36px 0 0 auto;
			font-size: 10px;
			white-space: nowrap;
		}
		.page-grid {
			padding: 14px 16px;
			grid-template-columns: 1fr;
			gap: 18px;
		}
		.video-heading h2 {
			font-size: 18px;
		}
		.video-heading {
			min-height: 54px;
		}
		.player {
			height: 26vh;
			min-height: 155px;
		}
		.related {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 14px;
		}
		.related h3 {
			grid-column: 1/-1;
			margin: 0;
		}
		.related > button {
			margin: 0;
		}
		.related .thumbnail {
			max-height: none;
		}
		.stories {
			height: 100px;
			padding: 12px 16px;
			gap: 15px;
			overflow: hidden;
		}
		.stories button {
			font-size: 9px;
			min-width: 54px;
		}
		.stories img {
			width: 44px;
			height: 44px;
		}
		.photo-feed .page-grid {
			display: block;
			padding: 14px;
		}
		.photo-feed .watch {
			padding: 10px;
		}
		.photo-feed .player {
			height: 28vh;
		}
		.photo-feed .related {
			margin-top: 20px;
		}
		.feed-nav {
			display: none;
		}
		.short-feed .page-grid {
			padding: 20px 24px;
			display: block;
		}
		.short-feed .player {
			height: calc(100dvh - 185px);
			min-height: 300px;
		}
		.short-feed .related {
			display: none;
		}
		.short-feed .player-controls {
			position: relative;
		}
		.under-video {
			gap: 8px;
			font-size: 11px;
		}
		.under-video button {
			font-size: 13px;
		}
		.player-controls {
			gap: 7px;
		}
		.player-controls output {
			font-size: 10px;
		}
	}
</style>
