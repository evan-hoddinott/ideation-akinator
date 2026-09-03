<script lang="ts">
	import { onDestroy } from 'svelte';
	import { internetEraForAltitude, internetEraIndex } from '$lib/internet-era';
	import type { WorkflowStage } from '$lib/project-state';

	let {
		altitude,
		stage,
		calm = false,
		resetSignal = 0,
		onInteract = () => {}
	}: {
		altitude: number;
		stage: WorkflowStage;
		calm?: boolean;
		resetSignal?: number;
		onInteract?: (object: string) => void;
	} = $props();

	const era = $derived(internetEraForAltitude(altitude));
	const eraIndex = $derived(internetEraIndex(altitude));
	let interactionMessage = $state('');
	let resetting = $state(false);
	let lastResetSignal = 0;
	let messageTimer = 0;
	let resetTimer = 0;

	$effect(() => {
		if (resetSignal <= lastResetSignal) return;
		lastResetSignal = resetSignal;
		resetting = true;
		window.clearTimeout(resetTimer);
		resetTimer = window.setTimeout(() => (resetting = false), 3_200);
	});

	function inspect(object: string, message: string) {
		interactionMessage = message;
		onInteract(object);
		window.clearTimeout(messageTimer);
		messageTimer = window.setTimeout(() => (interactionMessage = ''), 2_400);
	}

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.clearTimeout(messageTimer);
		window.clearTimeout(resetTimer);
	});
</script>

<div
	class="vertical-world"
	class:calm
	class:resetting
	data-stage={stage}
	data-era={era}
	style={`--camera-altitude: ${altitude}; --era-index: ${eraIndex}`}
>
	<div class="parallax far-stars"></div>
	<div class="world-strip" aria-hidden="true">
		<section class="world-zone dos-zone">
			<div class="terminal"><b>C:\IDEAS&gt;</b><span>dial oracle.bbs /baud:2400</span><i>█</i></div>
			<div class="bbs">
				<header>THE MYSTIC BBS</header>
				<p>[1] NEW PROPHECIES</p>
				<p>[2] SYSOP GOSSIP</p>
				<p>[3] DOOR GAMES</p>
			</div>
			<div class="modem"><i></i><i></i><i></i><span>AA · CD · OH</span></div>
			<div class="pipe"></div>
		</section>

		<section class="world-zone personal-zone">
			<div class="homepage">
				<h2>~ THE WIZARD'S HOME PAGE ~</h2>
				<img src="/images/retro/wizard-idle.gif" alt="" />
				<p>Welcome, web traveler #000042</p>
				<div class="marquee"><span>Sign my guestbook!!! Best viewed at 640×480</span></div>
			</div>
			<div class="construction">UNDER ETERNAL CONSTRUCTION</div>
			<div class="pipe left"></div>
		</section>

		<section class="world-zone geocities-zone">
			<div class="geo-title">EVAN'S TOTALLY RAD IDEA REALM</div>
			<div class="webring">← PREV · MYSTIC WEBRING · RANDOM · NEXT →</div>
			<img class="era-cat" src="/images/retro/kitka-cat.gif" alt="" />
			<div class="guestbook">GUESTBOOK<br /><b>12 nice · 901 rude</b></div>
			<div class="sparkles">✦ ✧ ★ ✦ ✧</div>
		</section>

		<section class="world-zone aol-zone">
			<div class="old-window aol">
				<header>America OnHold</header>
				<div class="buddy">
					<b>BUDDY LIST</b><span>● Purl_Kitty</span><span>● OilPrince420</span><span>○ Mom</span>
				</div>
				<div class="mailbox">YOU HAVE<br /><b>4 MAILS</b></div>
			</div>
			<div class="taskbar"><button>START</button><span>Oracle Online · 7:42 PM</span></div>
			<div class="dialup"></div>
		</section>

		<section class="world-zone dotcom-zone">
			<div class="ticker">WIZR +420% · IDEA +69% · SOCKPUPPET IPO TODAY</div>
			<div class="banner ad-one">FREE E-MONEY<br /><small>click until profitable</small></div>
			<div class="banner ad-two">PET FOOD · BUT ONLINE</div>
			<div class="cubicle"><i></i><i></i><i></i><span>SYNERGY FLOOR</span></div>
			<div class="blimp">DOT.COM!</div>
		</section>

		<section class="world-zone xp-zone">
			<div class="hill"></div>
			<div class="cloud one"></div>
			<div class="cloud two"></div>
			<div class="old-window notepad">
				<header>My Brilliant Product - Notepad</header>
				<p>1. add social<br />2. add toolbar<br />3. retire</p>
			</div>
			<div class="recycle">♲<span>Rejected Ideas</span></div>
			<div class="taskbar xp"><b>start</b><span>☁ Connected · 12:00 PM</span></div>
		</section>

		<section class="world-zone flash-zone">
			<div class="flash-game">
				<header>SUPER WIZARD CLICKER 2</header>
				<img src="/images/retro/magic-hit.gif" alt="" /><b>CLICK THE ORB</b><span
					>LOADING... 101%</span
				>
			</div>
			<div class="flash-score">HI 999999<br />YOU 000013</div>
			<div class="energy"></div>
		</section>

		<section class="world-zone myspace-zone">
			<div class="profile">
				<header>SAGE'S SPACE</header>
				<img src="/images/retro/wizard-idle.gif" alt="" /><b>Mood: prophetic</b>
				<p>About me: none of your business</p>
			</div>
			<div class="top-eight">
				TOP 8
				<div>PURL</div>
				<div>TOM</div>
				<div>MODEM</div>
				<div>ME</div>
			</div>
			<div class="glitter">thx 4 the add!!! ✧✧✧</div>
		</section>

		<section class="world-zone video-zone">
			<div class="tube">
				<header>WizardTube <input value="funny cat falls off router" readonly /></header>
				<div class="player"><span>▶</span><img src="/images/retro/kitka-cat.gif" alt="" /></div>
				<p><b>how to build product (NOT CLICKBAIT)</b><br />301 views · ★★★★★</p>
			</div>
			<div class="comments">
				<b>COMMENTS</b>
				<p>first</p>
				<p>fake and wizardpilled</p>
				<p>song name?</p>
			</div>
		</section>

		<section class="world-zone social-zone">
			<div class="phone first">
				<header>feed</header>
				<p>Someone is typing...</p>
				<b>♥ 12K</b>
			</div>
			<div class="phone second">
				<header>stories</header>
				<div>PRODUCTIVITY<br />HACK</div>
				<b>swipe ↑</b>
			</div>
			<div class="notifications">♥<i>99+</i> ↻<i>1</i> ★<i>???</i></div>
			<div class="cell-tower"></div>
		</section>

		<section class="world-zone cloud-zone">
			<div class="console">
				<header>CLOUD CONTROL PLANE</header>
				<div><span>idea-prod-final-v7</span><b>HEALTHY*</b></div>
				<div><span>monthly bill</span><b>$8,004.12</b></div>
			</div>
			<div class="server-cloud">
				<i></i><i></i><i></i><i></i><span>THE CLOUD<br />(someone else's beige computer)</span>
			</div>
			<div class="pipeline">COMMIT → BUILD → PANIC → ROLLBACK</div>
		</section>

		<section class="world-zone algorithm-zone">
			<div class="feed">
				<article><b>YOU MAY ALSO LIKE</b><span>the exact thing you feared</span></article>
				<article><b>TRENDING NOW</b><span>a manufactured argument</span></article>
				<article><b>FOR YOU</b><span>but mostly for advertisers</span></article>
			</div>
			<div class="algo-eye">◉<span>ENGAGEMENT ORACLE</span></div>
			<div class="cookie-wall">WE VALUE YOUR PRIVACY<br /><button>ACCEPT ALL 847</button></div>
		</section>

		<section class="world-zone slop-zone">
			<div class="slop-card">
				<i>✦</i>
				<h2>Revolutionize Your Journey</h2>
				<p>Unlock seamless innovation with an AI-powered ecosystem.</p>
				<button>Get Started Free</button>
			</div>
			<div class="slop-card second">
				<i>✦</i>
				<h2>Future, Simplified.</h2>
				<p>Transform. Elevate. Synergize. Please clap.</p>
				<button>Book a Vibe</button>
			</div>
			<div class="six-finger">six-finger<br />stock founder</div>
			<div class="modern-roast">THE SAGE HAS DETECTED<br /><b>UNLICENSED GRADIENTS</b></div>
		</section>

		<section class="world-zone cosmic-zone">
			<div class="rings"></div>
			<div class="shrine">
				<span>THE GREAT UPLINK</span><b>⌁ ✦ ⌁</b><small>PACKETS ASCEND. IDEAS RETURN.</small>
			</div>
			<div class="floppy">▣</div>
			<div class="satellite">╾━◈━╼</div>
			<div class="constellation">· · ✦ · ·<br />· · · ✧ ·<br />✦ · ·</div>
		</section>
	</div>

	<div class="parallax near-grid"></div>
	<div class="vignette"></div>
	<div class="scanlines"></div>
	<div class="scenery-controls" aria-label="Optional scenery">
		{#if era === 'dos-bbs'}<button
				type="button"
				aria-label="Inspect floppy"
				onclick={() => inspect('floppy', 'The floppy says “BACKUP.” It is lying.')}>▣</button
			>{/if}
		{#if era === 'aol-98'}<button
				type="button"
				aria-label="Inspect mailbox"
				onclick={() => inspect('mailbox', 'The mailbox growls. It is not time yet.')}>✉</button
			>{/if}
		{#if era === 'windows-xp'}<button
				type="button"
				aria-label="Inspect recycle bin"
				onclick={() =>
					inspect('recycle-bin', 'Restore “good_idea_final_FINAL”? Permission denied.')}>♲</button
			>{/if}
		{#if era === 'flash-games'}<button
				type="button"
				aria-label="Click the Flash orb"
				onclick={() => inspect('flash-orb', 'ORB CLICKED. Absolutely nothing useful happened.')}
				>◉</button
			>{/if}
		{#if era === 'algorithmic'}<button
				type="button"
				onclick={() => inspect('cookie', '847 partners now know you clicked that.')}>COOKIE?</button
			>{/if}
	</div>
	{#if interactionMessage}<div class="scenery-reaction" role="status">
			{interactionMessage}
		</div>{/if}
	{#if resetting}<div class="reset-fall" aria-hidden="true">
			<i>POOF!</i><b>▣</b><span>♜</span>
		</div>{/if}
</div>

<style>
	.vertical-world {
		position: fixed;
		inset: 0;
		overflow: hidden;
		z-index: 0;
		background: #02030a;
		pointer-events: none;
		--accent: #58ff8a;
	}
	.world-strip {
		position: absolute;
		inset: 0 auto auto 0;
		width: 100%;
		height: 1400vh;
		transform: translateY(calc(var(--camera-altitude) * -1300vh));
		transition: transform 1.6s cubic-bezier(0.16, 0.78, 0.16, 1) 260ms;
		will-change: transform;
	}
	.world-zone {
		position: relative;
		height: 100vh;
		overflow: hidden;
		isolation: isolate;
	}
	.world-zone:not(:last-child)::after {
		content: '';
		position: absolute;
		z-index: 20;
		left: 0;
		right: 0;
		bottom: 0;
		height: 48px;
		background: repeating-conic-gradient(from 45deg, transparent 0 25%, #080414 0 50%) 0 0/8px 8px;
		opacity: 0.62;
		mask-image: linear-gradient(transparent, #000);
	}
	.parallax {
		position: absolute;
		inset: -10%;
		transition: transform 1.9s cubic-bezier(0.16, 0.78, 0.16, 1) 360ms;
	}
	.far-stars {
		background-image: radial-gradient(circle, #fff 0 1px, transparent 1.5px);
		background-size: 67px 71px;
		opacity: 0.28;
		transform: translateY(calc(var(--camera-altitude) * -9vh));
	}
	.near-grid {
		inset: auto -10% -15%;
		height: 34%;
		opacity: 0.16;
		background:
			linear-gradient(90deg, transparent 49%, var(--accent) 50% 51%, transparent 52%),
			linear-gradient(0deg, transparent 49%, var(--accent) 50% 51%, transparent 52%);
		background-size: 80px 44px;
		transform: perspective(260px) rotateX(55deg) translateY(calc(var(--camera-altitude) * -18vh));
		transform-origin: bottom;
	}
	.scanlines,
	.vignette {
		position: absolute;
		inset: 0;
	}
	.scanlines {
		background: repeating-linear-gradient(transparent 0 3px, #000 4px);
		opacity: 0.09;
	}
	.vignette {
		box-shadow: inset 0 0 130px #0009;
	}
	[data-era='geocities'],
	[data-era='aol-98'] {
		--accent: #6ff;
	}
	[data-era='windows-xp'],
	[data-era='flash-games'] {
		--accent: #7cff4d;
	}
	[data-era='ai-slop'] {
		--accent: #835dff;
	}
	.dos-zone {
		color: #52ff7c;
		background: repeating-linear-gradient(0deg, #00160a 0 2px, #001109 2px 4px);
		font:
			16px/1.5 'Courier New',
			monospace;
	}
	.terminal {
		position: absolute;
		left: 8%;
		top: 12%;
		width: 48%;
		padding: 24px;
		border: 8px double #1f9b52;
		background: #000b05;
		box-shadow: 16px 17px #0008;
	}
	.terminal span,
	.terminal i {
		display: block;
	}
	.terminal i {
		animation: blink 650ms steps(2, end) infinite;
	}
	.bbs {
		position: absolute;
		right: 8%;
		bottom: 16%;
		width: 28%;
		padding: 15px;
		border: 3px solid;
		background: #07140d;
	}
	.bbs header {
		color: #ffcf55;
		border-bottom: 1px dashed;
	}
	.modem {
		position: absolute;
		left: 13%;
		bottom: 13%;
		width: 220px;
		padding: 12px;
		border: 5px outset #aaa38d;
		background: #8d856f;
		color: #252116;
	}
	.modem i {
		display: inline-block;
		width: 9px;
		height: 9px;
		margin: 4px;
		background: #45ff71;
		box-shadow: 0 0 8px #45ff71;
		animation: blink 900ms steps(2, end) infinite;
	}
	.pipe {
		position: absolute;
		right: 3%;
		top: 0;
		width: 30px;
		height: 70%;
		border: 5px outset #514c5b;
		background: #312c39;
	}
	.pipe.left {
		right: auto;
		left: 4%;
		height: 78%;
	}
	.personal-zone {
		background: #03001b url('/images/retro/magic-hit.gif') 88% 18%/70px no-repeat;
		color: #fff;
	}
	.homepage {
		position: absolute;
		left: 18%;
		top: 12%;
		width: 55%;
		padding: 18px;
		border: 8px ridge #ff54d8;
		background: #190250;
		text-align: center;
		font-family: 'Courier New', monospace;
	}
	.homepage h2 {
		color: #fff034;
		text-shadow: 3px 3px #f0c;
	}
	.homepage img {
		width: 90px;
		image-rendering: pixelated;
	}
	.homepage .marquee {
		display: block;
		margin-top: 14px;
		overflow: hidden;
		color: #6ff;
		background: #000;
	}
	.homepage .marquee span {
		display: inline-block;
		white-space: nowrap;
		animation: marquee-run 7s linear infinite;
	}
	.construction {
		position: absolute;
		right: 8%;
		bottom: 18%;
		padding: 10px;
		background: #ffd32a;
		color: #171000;
		font: 700 13px 'Courier New';
		transform: rotate(4deg);
	}
	.geocities-zone {
		background: #07001d radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0/43px 43px;
		color: #fff;
		font-family: 'Courier New', monospace;
	}
	.geo-title {
		position: absolute;
		left: 50%;
		top: 10%;
		padding: 10px 18px;
		border: 5px ridge #ff73ed;
		background: #610086;
		font-size: 24px;
		transform: translateX(-50%) rotate(-2deg);
		text-shadow: 3px 3px #001bb7;
	}
	.webring {
		position: absolute;
		right: 7%;
		top: 39%;
		padding: 10px;
		border: 4px double #6ff;
		background: #00185b;
		color: #6ff;
	}
	.era-cat {
		position: absolute;
		right: 17%;
		bottom: 18%;
		width: 110px;
		image-rendering: pixelated;
	}
	.guestbook {
		position: absolute;
		left: 9%;
		bottom: 16%;
		padding: 12px;
		border: 4px outset #ddd;
		background: #c0c0c0;
		color: #111;
		transform: rotate(-4deg);
	}
	.sparkles {
		position: absolute;
		left: 13%;
		top: 34%;
		color: #ffef67;
		font-size: 36px;
	}
	.aol-zone {
		background: linear-gradient(#526db5, #adc3e5);
		color: #111;
		font: 12px Arial;
	}
	.old-window {
		border: 6px outset #ddd;
		background: #c0c0c0;
		box-shadow: 14px 14px #16205477;
	}
	.old-window > header {
		padding: 7px;
		color: #fff;
		background: #000080;
		font-weight: 700;
	}
	.aol {
		position: absolute;
		left: 16%;
		top: 12%;
		width: 55%;
		height: 57%;
	}
	.buddy {
		position: absolute;
		left: 5%;
		top: 18%;
		bottom: 8%;
		width: 38%;
		padding: 12px;
		border: 3px inset #eee;
		background: #fff;
	}
	.buddy span {
		display: block;
		margin: 13px 0;
	}
	.mailbox {
		position: absolute;
		right: 8%;
		top: 28%;
		padding: 24px;
		border: 4px outset #eee;
		background: #e7e7d8;
		text-align: center;
	}
	.mailbox b {
		font-size: 28px;
		color: #b11;
	}
	.taskbar {
		position: absolute;
		z-index: 3;
		left: 0;
		right: 0;
		bottom: 0;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		border-top: 5px outset #ddd;
		background: #c0c0c0;
	}
	.dialup {
		position: absolute;
		inset: 0;
		background: repeating-radial-gradient(circle at 88% 20%, transparent 0 56px, #fff3 58px 60px);
	}
	.dotcom-zone {
		background: linear-gradient(#161a47, #632861);
		color: #fff;
		font-family: Arial;
	}
	.ticker {
		position: absolute;
		left: 0;
		right: 0;
		top: 8%;
		padding: 12px;
		background: #080808;
		color: #68ff75;
		white-space: nowrap;
	}
	.banner {
		position: absolute;
		padding: 14px 28px;
		border: 5px outset #ddd;
		text-align: center;
		font-weight: 900;
	}
	.ad-one {
		left: 8%;
		top: 28%;
		background: linear-gradient(90deg, #ffec36, #ff38c9);
		color: #430039;
		transform: rotate(-3deg);
	}
	.ad-two {
		right: 9%;
		top: 45%;
		background: #32e5ff;
		color: #00344c;
		transform: rotate(2deg);
	}
	.cubicle {
		position: absolute;
		left: 26%;
		right: 25%;
		bottom: 7%;
		height: 28%;
		border: 12px solid #9a98a6;
		border-bottom: 0;
		background: #d0cbd5;
		color: #222;
	}
	.cubicle i {
		display: inline-block;
		width: 28%;
		height: 65%;
		margin: 4% 2%;
		background: #423f47;
	}
	.cubicle span {
		display: block;
		text-align: center;
	}
	.blimp {
		position: absolute;
		right: 14%;
		top: 18%;
		padding: 12px 28px;
		border-radius: 50%;
		background: #f4d53b;
		color: #58134f;
		transform: rotate(8deg);
	}
	.xp-zone {
		background: linear-gradient(#2793e8 0 60%, #62b63d 61%);
		color: #111;
		font: 12px Tahoma;
	}
	.hill {
		position: absolute;
		left: -5%;
		right: -5%;
		bottom: 0;
		height: 45%;
		border-radius: 55% 65% 0 0;
		background: #54a531;
	}
	.cloud {
		position: absolute;
		width: 160px;
		height: 45px;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			45px -20px #fff,
			95px 2px #fff;
	}
	.cloud.one {
		left: 8%;
		top: 17%;
	}
	.cloud.two {
		right: 12%;
		top: 27%;
		transform: scale(0.7);
	}
	.notepad {
		position: absolute;
		left: 34%;
		top: 13%;
		width: 33%;
		background: #f4f2e8;
	}
	.notepad header {
		background: linear-gradient(#327ff0, #0646bd);
	}
	.notepad p {
		padding: 15px;
	}
	.recycle {
		position: absolute;
		right: 8%;
		bottom: 16%;
		display: grid;
		color: #fff;
		font-size: 52px;
		text-shadow: 2px 2px #000;
	}
	.recycle span {
		font-size: 11px;
	}
	.taskbar.xp {
		background: #236bd1;
		color: #fff;
		border-color: #438df1;
	}
	.taskbar.xp b {
		padding: 9px 25px;
		border-radius: 0 20px 20px 0;
		background: #3b9b3b;
	}
	.flash-zone {
		background: radial-gradient(circle at 50% 48%, #8d28d5, #17052e 60%, #020108);
		color: #fff;
		font-family: 'Courier New';
	}
	.flash-game {
		position: absolute;
		left: 21%;
		top: 10%;
		width: 49%;
		height: 61%;
		border: 9px solid #121212;
		background: radial-gradient(circle, #ffc742, #ff3d9d 35%, #2f0c65 70%);
		text-align: center;
		box-shadow: 0 0 60px #ec4cff77;
	}
	.flash-game header {
		padding: 9px;
		background: #111;
		color: #5ff;
	}
	.flash-game img {
		display: block;
		width: 150px;
		height: 150px;
		margin: 20px auto 4px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.flash-game b,
	.flash-game span {
		display: block;
	}
	.flash-score {
		position: absolute;
		right: 8%;
		top: 20%;
		padding: 15px;
		border: 4px solid #ffea54;
		background: #000;
		color: #ffea54;
	}
	.energy {
		position: absolute;
		left: 50%;
		top: 48%;
		width: 500px;
		aspect-ratio: 1;
		border: 5px dashed #fff6;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: spin 9s linear infinite;
	}
	.myspace-zone {
		background: #16131f repeating-linear-gradient(45deg, #271b30 0 10px, #19121f 11px 20px);
		color: #eee;
		font: 13px Arial;
	}
	.profile {
		position: absolute;
		left: 12%;
		top: 10%;
		width: 37%;
		padding: 16px;
		border: 8px solid #dc6cb4;
		background: #3b1735;
		box-shadow: 14px 14px #0007;
	}
	.profile header {
		margin: -10px -10px 12px;
		padding: 9px;
		background: #ff64c6;
		color: #42062f;
		font-size: 22px;
	}
	.profile img {
		float: left;
		width: 110px;
		margin-right: 14px;
		image-rendering: pixelated;
	}
	.top-eight {
		position: absolute;
		right: 10%;
		top: 21%;
		display: grid;
		grid-template-columns: repeat(2, 90px);
		gap: 8px;
		padding: 15px;
		border: 5px dotted #66ecff;
		background: #08162e;
		color: #66ecff;
	}
	.top-eight > div {
		padding: 22px 4px;
		background: #e26db1;
		color: #26101f;
		text-align: center;
	}
	.glitter {
		position: absolute;
		right: 15%;
		bottom: 14%;
		padding: 16px;
		border: 4px ridge #fff;
		background: linear-gradient(90deg, #f5e, #6ff, #ff5);
		color: #4b0041;
		transform: rotate(3deg);
	}
	.video-zone {
		background: #ecebe6;
		color: #222;
		font: 12px Arial;
	}
	.tube {
		position: absolute;
		left: 9%;
		top: 8%;
		width: 58%;
		padding: 12px;
		border: 1px solid #bbb;
		background: #fff;
		box-shadow: 0 12px 30px #0004;
	}
	.tube header {
		padding: 8px;
		background: #e8e8e8;
		color: #c00;
		font-size: 22px;
	}
	.tube input {
		float: right;
		width: 55%;
	}
	.player {
		position: relative;
		height: 260px;
		display: grid;
		place-items: center;
		background: #111;
		overflow: hidden;
	}
	.player img {
		width: 70%;
		height: 70%;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.player span {
		position: absolute;
		z-index: 2;
		font-size: 60px;
		color: #fff9;
	}
	.comments {
		position: absolute;
		right: 8%;
		top: 23%;
		width: 22%;
		padding: 13px;
		border-left: 4px solid #ccc;
		background: #fff;
	}
	.comments p {
		padding: 8px;
		border-bottom: 1px solid #ddd;
	}
	.social-zone {
		background: linear-gradient(145deg, #0a1730, #5a275a);
		color: #fff;
		font: 13px Arial;
	}
	.phone {
		position: absolute;
		width: 210px;
		height: 390px;
		padding: 18px 12px;
		border: 12px solid #111;
		border-radius: 28px;
		background: #f9f9f9;
		color: #222;
		box-shadow: 15px 18px #0007;
	}
	.phone header {
		padding: 10px;
		border-bottom: 1px solid #ddd;
		font-weight: 700;
	}
	.phone.first {
		left: 16%;
		top: 9%;
		transform: rotate(-6deg);
	}
	.phone.second {
		right: 18%;
		top: 13%;
		transform: rotate(7deg);
	}
	.phone.second div {
		display: grid;
		place-items: center;
		height: 250px;
		color: #fff;
		background: linear-gradient(#ff673e, #7d2bca);
		font-size: 24px;
		text-align: center;
	}
	.notifications {
		position: absolute;
		left: 48%;
		top: 27%;
		display: grid;
		gap: 14px;
		font-size: 38px;
		color: #ff5f8d;
	}
	.notifications i {
		padding: 4px;
		border-radius: 20px;
		background: #f22;
		color: #fff;
		font: 11px Arial;
	}
	.cell-tower {
		position: absolute;
		left: 47%;
		bottom: 4%;
		width: 8px;
		height: 28%;
		background: #bbb;
		box-shadow: 0 0 30px #78dcff;
	}
	.cloud-zone {
		background: linear-gradient(#d9e9f6, #f7fbff);
		color: #293544;
		font: 13px Arial;
	}
	.console {
		position: absolute;
		left: 12%;
		top: 13%;
		width: 43%;
		border: 1px solid #a9b7c5;
		border-radius: 7px;
		background: #fff;
		box-shadow: 0 20px 40px #42688a33;
	}
	.console header {
		padding: 14px;
		background: #202b3a;
		color: #fff;
	}
	.console div {
		display: flex;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid #dde4ea;
	}
	.console b {
		color: #17834c;
	}
	.server-cloud {
		position: absolute;
		right: 8%;
		top: 17%;
		width: 30%;
		padding: 35px;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			30px 15px #fff,
			-35px 18px #fff,
			0 25px 45px #53759055;
		text-align: center;
	}
	.server-cloud i {
		display: block;
		height: 20px;
		margin: 6px;
		border: 3px inset #ccd1d6;
		background: linear-gradient(90deg, #283442 82%, #5f8 83%);
	}
	.pipeline {
		position: absolute;
		left: 24%;
		bottom: 13%;
		padding: 13px 24px;
		border: 2px solid #71869c;
		border-radius: 30px;
		background: #edf3f7;
	}
	.algorithm-zone {
		background: #12131a;
		color: #eee;
		font: 14px Arial;
	}
	.feed {
		position: absolute;
		left: 10%;
		right: 28%;
		top: 9%;
		display: flex;
		gap: 18px;
		transform: rotate(-2deg);
	}
	.feed article {
		flex: 1;
		min-height: 250px;
		padding: 20px;
		border-radius: 15px;
		background: linear-gradient(#fff, #ddd);
		color: #181818;
		box-shadow: 0 14px 30px #0008;
	}
	.feed b,
	.feed span {
		display: block;
		margin-bottom: 22px;
	}
	.algo-eye {
		position: absolute;
		right: 8%;
		top: 23%;
		display: grid;
		place-items: center;
		font-size: 90px;
		color: #75f5e1;
	}
	.algo-eye span {
		font-size: 10px;
		letter-spacing: 0.15em;
	}
	.cookie-wall {
		position: absolute;
		left: 23%;
		bottom: 9%;
		padding: 18px 28px;
		border: 1px solid #777;
		background: #f5f5f5;
		color: #111;
		box-shadow: 8px 9px #0007;
	}
	.cookie-wall button {
		margin-top: 8px;
	}
	.slop-zone {
		background: radial-gradient(circle at 20% 20%, #6654ff33, transparent 40%), #f7f8fb;
		color: #1c2140;
		font: 15px Arial;
	}
	.slop-card {
		position: absolute;
		left: 8%;
		top: 14%;
		width: 34%;
		padding: 35px;
		border: 1px solid #fff;
		border-radius: 22px;
		background: #ffffffcc;
		box-shadow: 0 25px 80px #6f69ba33;
	}
	.slop-card i {
		font-size: 34px;
		color: #745cff;
	}
	.slop-card h2 {
		font-size: 34px;
		letter-spacing: -0.04em;
	}
	.slop-card button {
		padding: 12px 22px;
		border: 0;
		border-radius: 9px;
		background: linear-gradient(90deg, #765cff, #bc59c7);
		color: #fff;
	}
	.slop-card.second {
		left: auto;
		right: 8%;
		top: 24%;
	}
	.six-finger {
		position: absolute;
		left: 46%;
		top: 11%;
		padding: 10px;
		border-radius: 50%;
		background: #ffd9c7;
		color: #873f39;
		transform: rotate(11deg);
	}
	.modern-roast {
		position: absolute;
		left: 38%;
		bottom: 10%;
		padding: 12px 18px;
		border: 2px dashed #f44;
		background: #111;
		color: #fff;
		font: 12px 'Courier New';
		text-align: center;
	}
	.cosmic-zone {
		background: radial-gradient(circle at 50% 42%, #45237e, #09031e 47%, #02010b);
		color: #fff;
	}
	.cosmic-zone::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle, #fff 0 1px, transparent 2px) 0 0/57px 63px;
	}
	.rings {
		position: absolute;
		left: 50%;
		top: 52%;
		width: min(64vw, 900px);
		aspect-ratio: 1;
		border: 4px solid #ad7cff66;
		border-radius: 50%;
		box-shadow:
			0 0 0 90px #7be7ff0b,
			0 0 0 180px #ffcf7009;
		transform: translate(-50%, -50%) rotate(-18deg) scaleY(0.35);
	}
	.shrine {
		position: absolute;
		left: 50%;
		top: 8%;
		width: min(430px, 46vw);
		padding: 18px;
		border: 4px ridge #a8efff;
		background: #120b31e8;
		color: #ffda7a;
		font: 14px 'Courier New';
		text-align: center;
		box-shadow: 0 0 55px #8be8ff66;
		transform: translateX(-50%);
	}
	.shrine span,
	.shrine b,
	.shrine small {
		display: block;
	}
	.shrine b {
		margin: 9px;
		font-size: 31px;
		color: #bff8ff;
	}
	.floppy {
		position: absolute;
		right: 14%;
		bottom: 21%;
		font-size: 54px;
		color: #f4b8ff;
		filter: drop-shadow(0 0 14px #ff63e7);
		transform: rotate(16deg);
	}
	.satellite {
		position: absolute;
		left: 12%;
		top: 35%;
		font-size: 40px;
		color: #7be7ff;
		transform: rotate(-8deg);
	}
	.constellation {
		position: absolute;
		right: 25%;
		top: 35%;
		color: #ffdc73;
		font-size: 33px;
		line-height: 2;
	}
	.scenery-controls {
		position: absolute;
		z-index: 5;
		right: 3%;
		bottom: 12%;
		pointer-events: auto;
	}
	.scenery-controls button {
		min-width: 50px;
		min-height: 46px;
		border: 3px outset #ddd;
		background: #c0c0c0;
		color: #111;
		font: 700 10px 'Courier New';
		cursor: pointer;
	}
	.scenery-reaction {
		position: absolute;
		z-index: 6;
		right: 4%;
		bottom: 20%;
		max-width: 300px;
		padding: 9px 12px;
		border: 3px outset #ddd;
		background: #09051ee8;
		color: #ffe36b;
		font: 9px 'Courier New';
		box-shadow: 7px 8px #0008;
	}
	.reset-fall {
		position: absolute;
		z-index: 30;
		inset: 0;
	}
	.reset-fall i {
		position: absolute;
		left: 35%;
		top: 36%;
		color: #fff36c;
		font: 900 36px 'Courier New';
		text-shadow: 4px 4px #d02cb0;
		animation: poof 650ms steps(6, end) forwards;
	}
	.reset-fall b {
		position: absolute;
		left: 39%;
		top: 28%;
		color: #c272ff;
		font-size: 80px;
		animation: fall 2.45s cubic-bezier(0.55, 0.05, 0.9, 0.32) 420ms both;
	}
	.reset-fall span {
		position: absolute;
		left: 36%;
		bottom: 10%;
		color: #7f42c7;
		font-size: 120px;
		animation: catch 0.7s steps(7, end) 2.4s both;
	}
	.calm .world-strip,
	.calm .parallax {
		transition: none;
	}
	.resetting .world-strip {
		transform: translateY(0);
		transition: transform 2.35s steps(14, end) !important;
	}
	.calm * {
		animation-play-state: paused !important;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@keyframes marquee-run {
		from {
			transform: translateX(110%);
		}
		to {
			transform: translateX(-110%);
		}
	}
	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
	@keyframes poof {
		0% {
			transform: scale(0.2);
			opacity: 0;
		}
		45% {
			transform: scale(1.5);
			opacity: 1;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}
	@keyframes fall {
		to {
			transform: translateY(85vh) rotate(720deg);
			opacity: 0;
		}
	}
	@keyframes catch {
		from {
			transform: translateY(130%);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}
	@media (max-width: 760px) {
		.terminal,
		.homepage,
		.profile,
		.tube,
		.console,
		.slop-card {
			left: 4%;
			width: 66%;
		}
		.bbs,
		.top-eight,
		.comments,
		.slop-card.second {
			right: 3%;
			transform: scale(0.7);
			transform-origin: right center;
		}
		.phone {
			transform: scale(0.65);
		}
		.scenery-controls {
			bottom: 18%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.world-strip,
		.parallax {
			transition: none;
		}
		.world-zone * {
			animation: none !important;
		}
		.reset-fall {
			display: none;
		}
	}
</style>
