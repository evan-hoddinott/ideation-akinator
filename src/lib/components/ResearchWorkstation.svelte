<script lang="ts">
	let {
		active,
		calm,
		projectId,
		message,
		sourceCount = 0,
		onCancel
	}: {
		active: boolean;
		calm: boolean;
		projectId: string;
		message: string;
		sourceCount?: number;
		onCancel: () => void;
	} = $props();

	const scenes = ['minecraft', 'cats', 'mines', 'search', 'desktop'] as const;
	const mineCells = Array.from({ length: 48 }, (_, index) => index);
	const keyboardKeys = Array.from({ length: 27 }, (_, index) => index);
	const desktopFiles = [
		'actual_research',
		'final',
		'final_FINAL',
		'final_FINAL_2',
		'DO_NOT_OPEN',
		'taxes_2004'
	];
	let sceneIndex = $state(0);

	$effect(() => {
		if (!active || calm) return;
		sceneIndex = seededIndex(projectId, scenes.length);
		const timer = window.setInterval(() => {
			sceneIndex = (sceneIndex + 1) % scenes.length;
		}, 4_200);
		return () => window.clearInterval(timer);
	});

	function seededIndex(value: string, length: number) {
		let hash = 0;
		for (let index = 0; index < value.length; index += 1) {
			hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
		}
		return hash % length;
	}
</script>

{#if active}
	{#if calm}
		<section class="research-calm" aria-live="polite">
			<span>LIVE RESEARCH</span>
			<strong>{message || 'Consulting the web...'}</strong>
			<small>{sourceCount} sources bound so far</small>
			<button type="button" onclick={onCancel}>Cancel</button>
		</section>
	{:else}
		<section
			class="research-performance"
			aria-label="The Signal Sage researches at a large computer"
		>
			<div class="workstation-rig">
				<div class="crt-monitor">
					<div class="crt-bezel">
						<div class="crt-screen" data-scene={scenes[sceneIndex]}>
							{#if scenes[sceneIndex] === 'minecraft'}
								<video
									autoplay
									muted
									loop
									playsinline
									aria-label="Minecraft Beta gameplay distraction"
								>
									<source src="/video/retro/minecraft-beta-gameplay.webm" type="video/webm" />
								</video>
								<span class="screen-caption">IMPORTANT BLOCK RESEARCH</span>
							{:else if scenes[sceneIndex] === 'cats'}
								<div class="cat-site">
									<h3>CAT TUBE 2003</h3>
									<img src="/images/retro/kitka-cat.gif" alt="A running pixel cat" />
									<p>BUFFERING 47 OF 8 CATS...</p>
								</div>
							{:else if scenes[sceneIndex] === 'mines'}
								<div class="mine-window">
									<header>MINESWEEPER_RESEARCH.EXE</header>
									<div class="mine-grid" aria-hidden="true">
										{#each mineCells as index (index)}<i class:bomb={index === 13 || index === 34}
												>{index % 7 === 0 ? '1' : index === 13 || index === 34 ? '✹' : ''}</i
											>{/each}
									</div>
								</div>
							{:else if scenes[sceneIndex] === 'search'}
								<div class="fake-search">
									<div>WIZARDSEARCH!!!</div>
									<label
										>Search <input value="can a computer have browser history" readonly /></label
									>
									<p>1 result found in 0.0000004 fortnights</p>
									<a href="#research-status">DELETE EVERYTHING IMMEDIATELY</a>
								</div>
							{:else}
								<div class="bad-desktop">
									{#each desktopFiles as file (file)}
										<span><b>▤</b>{file}</span>
									{/each}
									<div class="ram-ad">DOWNLOAD<br /><b>MORE RAM</b><small>FREE*</small></div>
								</div>
							{/if}
							<div class="screen-scanlines" aria-hidden="true"></div>
						</div>
						<div class="monitor-controls"><i></i><i></i><b>POWER</b></div>
					</div>
					<div class="monitor-neck"></div>
					<div class="monitor-foot"></div>
				</div>

				<div class="computer-tower">
					<div class="drive-slot"></div>
					<div class="drive-slot small"></div>
					<div class="tower-light"></div>
					<span>PENTIUM<br />MYSTERIUM</span>
				</div>

				<div class="keyboard">
					{#each keyboardKeys as key (key)}<i></i>{/each}
				</div>
				<div class="cart-shelf"></div>
				<div class="cart-leg left"></div>
				<div class="cart-leg right"></div>
				<div class="cart-wheel left"></div>
				<div class="cart-wheel right"></div>
				<div class="tangled-cable" aria-hidden="true"></div>
			</div>

			<div class="typing-hands" aria-hidden="true"><i></i><i></i></div>

			<div class="real-research-strip" id="research-status" aria-live="polite">
				<div><span class="strip-light"></span><b>ACTUAL RESEARCH STATUS</b></div>
				<strong>{message || 'Consulting the dusty web...'}</strong>
				<small>{sourceCount} sources bound so far · DECORATIVE CRT NONSENSE IS NOT A SOURCE</small>
				<button type="button" onclick={onCancel}>Cancel research</button>
			</div>
		</section>
	{/if}
{/if}

<style>
	.research-performance {
		position: fixed;
		z-index: 11;
		left: clamp(390px, 40vw, 760px);
		right: 3vw;
		bottom: 5vh;
		height: min(61vh, 650px);
		pointer-events: none;
	}

	.workstation-rig {
		position: absolute;
		left: 8%;
		right: 3%;
		top: 0;
		bottom: 86px;
		filter: drop-shadow(13px 18px 0 #02010b99);
		animation: workstation-arrival 1.6s steps(12, end) both;
	}

	.crt-monitor {
		position: absolute;
		left: 9%;
		top: 1%;
		width: min(64%, 520px);
		aspect-ratio: 1.28;
	}

	.crt-bezel {
		position: absolute;
		inset: 0 0 17%;
		padding: 8% 9% 11%;
		border: 5px outset #e7dfc3;
		border-radius: 10% 10% 14% 14% / 8% 8% 18% 18%;
		background: #bdb493;
		box-shadow: inset -15px -13px 0 #8f876e;
	}

	.crt-screen {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border: 8px inset #817a66;
		border-radius: 9% / 12%;
		background: #061321;
		color: #3cff67;
		font:
			8px/1.3 'Courier New',
			monospace;
	}

	.crt-screen video,
	.crt-screen img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		image-rendering: pixelated;
	}

	.screen-caption {
		position: absolute;
		left: 5px;
		bottom: 5px;
		padding: 3px 5px;
		color: #fff;
		background: #000a;
		font-weight: 700;
	}

	.screen-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(0deg, transparent 0 2px, #0004 2px 3px);
	}

	.monitor-controls {
		position: absolute;
		left: 9%;
		right: 9%;
		bottom: 3%;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 5px;
		color: #4e493d;
		font:
			6px 'Courier New',
			monospace;
	}

	.monitor-controls i {
		width: 7px;
		height: 7px;
		border: 2px inset #d9d1b7;
		background: #332d24;
	}

	.monitor-controls i:first-child {
		background: #41ed63;
		box-shadow: 0 0 5px #41ed63;
	}

	.monitor-neck {
		position: absolute;
		left: 37%;
		bottom: 7%;
		width: 26%;
		height: 18%;
		background: #9f967d;
		clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
	}

	.monitor-foot {
		position: absolute;
		left: 22%;
		right: 22%;
		bottom: 0;
		height: 9%;
		border: 4px outset #d8cfb1;
		background: #aca287;
	}

	.computer-tower {
		position: absolute;
		right: 3%;
		top: 15%;
		width: 24%;
		height: 58%;
		padding: 9% 4% 4%;
		border: 5px outset #ddd5b7;
		background: #aaa184;
		box-shadow: inset -12px -8px #817965;
		color: #453f34;
		font:
			700 7px/1.3 'Courier New',
			monospace;
		text-align: center;
	}

	.drive-slot {
		height: 11%;
		margin-bottom: 9%;
		border: 4px inset #d8d1b9;
		background: #524c40;
	}

	.drive-slot.small {
		width: 76%;
		height: 8%;
	}

	.tower-light {
		width: 11px;
		height: 11px;
		margin: 25% auto 7%;
		border-radius: 50%;
		background: #ffca3b;
		box-shadow: 0 0 9px #ffca3b;
		animation: tower-blink 440ms steps(2, end) infinite;
	}

	.keyboard {
		position: absolute;
		left: 8%;
		bottom: 2%;
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 3px;
		width: 58%;
		height: 18%;
		padding: 7px;
		border: 5px outset #ded6ba;
		background: #a69d82;
		transform: perspective(220px) rotateX(38deg);
		transform-origin: bottom;
	}

	.keyboard i {
		border: 2px outset #dcd4b9;
		background: #bcb395;
	}

	.cart-shelf {
		position: absolute;
		left: 2%;
		right: 0;
		bottom: -2%;
		height: 7%;
		border: 5px outset #92929c;
		background: #5e5b68;
	}

	.cart-leg {
		position: absolute;
		bottom: -19%;
		width: 5%;
		height: 18%;
		background: #55525d;
	}

	.cart-leg.left,
	.cart-wheel.left {
		left: 10%;
	}

	.cart-leg.right,
	.cart-wheel.right {
		right: 8%;
	}

	.cart-wheel {
		position: absolute;
		bottom: -25%;
		width: 9%;
		aspect-ratio: 1;
		border: 5px solid #36323c;
		border-radius: 50%;
		background: radial-gradient(circle, #7e7886 0 18%, #28242d 20% 58%, #5b5562 60%);
		animation: wheel-spin 420ms steps(4, end) 4;
	}

	.cart-wheel.right {
		transform: rotate(17deg);
	}

	.tangled-cable {
		position: absolute;
		right: -8%;
		bottom: -18%;
		width: 25%;
		height: 20%;
		border: 6px solid #18131d;
		border-left: 0;
		border-bottom-color: transparent;
		border-radius: 50%;
	}

	.typing-hands {
		position: absolute;
		left: -4%;
		bottom: 26%;
		width: 34%;
		height: 20%;
		animation: hands-arrive 1.8s steps(12, end) both;
	}

	.typing-hands i {
		position: absolute;
		bottom: 0;
		width: 36px;
		height: 36px;
		border: 5px solid #c1b7a4;
		border-radius: 50%;
		background: #eee8d7;
		box-shadow: 0 7px #6b456a;
		animation: hand-type 240ms steps(2, end) infinite alternate;
	}

	.typing-hands i:first-child {
		left: 30%;
	}

	.typing-hands i:last-child {
		right: 4%;
		animation-delay: 120ms;
	}

	.real-research-strip,
	.research-calm {
		pointer-events: auto;
	}

	.real-research-strip {
		position: absolute;
		left: 3%;
		right: 3%;
		bottom: 0;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 5px 16px;
		padding: 10px 12px;
		border: 4px outset #dedde5;
		color: #f1f4ff;
		background: #090820f2;
		box-shadow: 7px 8px 0 #02010a99;
		font:
			8px/1.3 'Courier New',
			monospace;
	}

	.real-research-strip > div {
		display: flex;
		align-items: center;
		gap: 7px;
		color: #77f9e7;
		letter-spacing: 0.1em;
	}

	.real-research-strip > strong {
		grid-column: 1;
		font-size: 11px;
	}

	.real-research-strip small {
		grid-column: 1;
		color: #9890ac;
	}

	.real-research-strip button {
		grid-column: 2;
		grid-row: 1 / span 3;
		align-self: center;
		padding: 8px 10px;
		border: 3px outset #d6d2de;
		background: #c0c0c0;
		font:
			700 8px 'Courier New',
			monospace;
		cursor: pointer;
	}

	.strip-light {
		width: 8px;
		height: 8px;
		background: #41ff6b;
		box-shadow: 0 0 7px #41ff6b;
		animation: tower-blink 700ms steps(2, end) infinite;
	}

	.cat-site {
		display: grid;
		place-items: center;
		height: 100%;
		background: #ffb9eb;
		color: #500056;
		text-align: center;
	}

	.cat-site h3,
	.cat-site p {
		margin: 3px;
		background: #fff;
	}

	.cat-site img {
		width: 76%;
		height: auto;
	}

	.mine-window {
		height: 100%;
		padding: 5px;
		background: #c0c0c0;
		color: #111;
	}

	.mine-window header {
		padding: 4px;
		color: white;
		background: #000080;
	}

	.mine-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		height: calc(100% - 24px);
		padding: 6px;
	}

	.mine-grid i {
		display: grid;
		place-items: center;
		border: 2px outset #eee;
		font-style: normal;
		font-weight: 700;
		color: #0000b4;
	}

	.mine-grid i.bomb {
		color: #c00000;
		background: #ff6b6b;
	}

	.fake-search {
		display: grid;
		align-content: center;
		gap: 8px;
		height: 100%;
		padding: 10px;
		color: #220036;
		background: #ddff77;
	}

	.fake-search > div {
		font-size: 16px;
		font-weight: 700;
		color: #890074;
		text-align: center;
	}

	.fake-search input {
		width: 100%;
		margin-top: 3px;
		font:
			7px 'Courier New',
			monospace;
	}

	.fake-search a {
		color: #0000cc;
		text-decoration: underline;
	}

	.bad-desktop {
		position: relative;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-content: start;
		gap: 10px 5px;
		height: 100%;
		padding: 9px;
		background: #008080;
		color: white;
	}

	.bad-desktop > span {
		display: grid;
		justify-items: center;
		font-size: 6px;
		text-shadow: 1px 1px #000;
	}

	.bad-desktop > span b {
		font-size: 18px;
	}

	.ram-ad {
		position: absolute;
		right: 5px;
		bottom: 5px;
		padding: 6px;
		border: 3px ridge #ffff55;
		color: #580045;
		background: linear-gradient(135deg, #ff61dd, #72fff4, #ffff68);
		text-align: center;
		transform: rotate(-3deg);
	}

	.ram-ad b,
	.ram-ad small {
		display: block;
	}

	.research-calm {
		position: fixed;
		z-index: 14;
		right: 24px;
		bottom: 24px;
		display: grid;
		gap: 6px;
		width: min(460px, calc(100vw - 48px));
		padding: 14px;
		border: 3px outset #777082;
		color: #eeeaff;
		background: #0b0824;
		font:
			9px/1.35 'Courier New',
			monospace;
	}

	.research-calm > span {
		color: #6ff8ec;
		font-weight: 700;
	}

	.research-calm button {
		justify-self: start;
	}

	@keyframes workstation-arrival {
		from {
			transform: translateX(115%) rotate(2deg);
		}
		72% {
			transform: translateX(-3%) rotate(-1deg);
		}
		to {
			transform: translateX(0) rotate(0);
		}
	}

	@keyframes wheel-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes hands-arrive {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		70% {
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes hand-type {
		to {
			transform: translateY(9px) rotate(7deg);
		}
	}

	@keyframes tower-blink {
		50% {
			opacity: 0.25;
		}
	}

	@media (max-width: 980px) {
		.research-performance {
			left: 35vw;
			right: 1vw;
		}
	}

	@media (max-width: 760px) {
		.research-performance {
			left: 2vw;
			right: 2vw;
			bottom: 2vh;
			height: 50vh;
		}

		.real-research-strip {
			grid-template-columns: 1fr;
		}

		.real-research-strip button {
			grid-column: 1;
			grid-row: auto;
			justify-self: start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.workstation-rig,
		.typing-hands,
		.typing-hands i,
		.cart-wheel,
		.tower-light,
		.strip-light {
			animation: none;
		}
	}
</style>
