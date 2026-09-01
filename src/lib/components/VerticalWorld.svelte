<script lang="ts">
	import type { WorkflowStage } from '$lib/project-state';

	let {
		altitude,
		stage,
		calm = false
	}: { altitude: number; stage: WorkflowStage; calm?: boolean } = $props();
</script>

<div
	class="vertical-world"
	class:calm
	data-stage={stage}
	style={`--camera-altitude: ${altitude}`}
	aria-hidden="true"
>
	<div class="world-strip">
		<section class="world-zone cosmic-zone">
			<div class="cosmic-rings"></div>
			<div class="server-shrine">
				<span>THE GREAT UPLINK</span>
				<b>⌁ ✦ ⌁</b>
				<small>PACKETS ASCEND. IDEAS RETURN.</small>
			</div>
			<div class="orbiting-floppy">▣</div>
		</section>

		<section class="world-zone popup-zone">
			<div class="pixel-cloud cloud-one"></div>
			<div class="pixel-cloud cloud-two"></div>
			<div class="floating-window window-one"><b>COOL SITE AWARD</b><span>★★★★★</span></div>
			<div class="floating-window window-two"><b>ANGELFIRE WEATHER</b><span>99% modem</span></div>
			<div class="floating-window window-three"><b>WIZARD ONLINE</b><span>1 guest</span></div>
		</section>

		<section class="world-zone homepage-zone">
			<div class="homepage-title">WELCOME TO MY IDEA PAGE</div>
			<div class="webring">← PREV &nbsp; ✧ SPELLRING ✧ &nbsp; NEXT →</div>
			<img class="tiny-wizard" src="/images/retro/wizard-idle.gif" alt="" />
			<img class="running-cat" src="/images/retro/kitka-cat.gif" alt="" />
			<div class="construction">🚧 ALWAYS UNDER CONJURATION 🚧</div>
		</section>

		<section class="world-zone basement-zone">
			<div class="pipe pipe-one"></div>
			<div class="pipe pipe-two"></div>
			<div class="server-rack rack-one"><i></i><i></i><i></i><i></i></div>
			<div class="server-rack rack-two"><i></i><i></i><i></i></div>
			<div class="basement-sign">
				IDEAS ENTER HERE<br /><small>NO FOOD NEAR THE MAINFRAME</small>
			</div>
			<div class="cable"></div>
		</section>
	</div>
	<div class="scanlines"></div>
</div>

<style>
	.vertical-world {
		position: fixed;
		inset: 0;
		overflow: hidden;
		z-index: 0;
		background: #050413;
		pointer-events: none;
	}

	.world-strip {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column-reverse;
		height: 400vh;
		transform: translateY(calc(-75% * var(--camera-altitude)));
		transition: transform 1.45s cubic-bezier(0.2, 0.72, 0.18, 1) 180ms;
	}

	.world-zone {
		position: relative;
		flex: 0 0 100vh;
		height: 100vh;
		overflow: hidden;
	}

	.cosmic-zone {
		background:
			radial-gradient(circle at 50% 30%, #613d91 0 2px, transparent 3px),
			radial-gradient(circle at 20% 65%, #ffcf70 0 1px, transparent 2px),
			radial-gradient(circle at 80% 72%, #7be7ff 0 2px, transparent 3px),
			repeating-radial-gradient(circle at 50% 55%, transparent 0 70px, #472d7044 72px 74px),
			linear-gradient(#050216, #13052e);
		background-size:
			93px 79px,
			71px 89px,
			111px 97px,
			auto,
			auto;
	}

	.cosmic-rings {
		position: absolute;
		left: 50%;
		top: 50%;
		width: min(62vw, 920px);
		aspect-ratio: 1;
		border: 3px solid #ad7cff55;
		border-radius: 50%;
		box-shadow:
			0 0 0 80px #7be7ff0a,
			0 0 0 160px #ffcf7008;
		transform: translate(-50%, -50%) rotate(-18deg) scaleY(0.35);
	}

	.server-shrine {
		position: absolute;
		left: 50%;
		top: 9%;
		width: min(430px, 46vw);
		padding: 16px;
		border: 4px ridge #a8efff;
		background: #120b31dd;
		color: #ffda7a;
		font-family: 'Courier New', monospace;
		text-align: center;
		box-shadow: 0 0 45px #8be8ff55;
		transform: translateX(-50%);
	}

	.server-shrine b,
	.server-shrine span,
	.server-shrine small {
		display: block;
	}
	.server-shrine b {
		margin: 8px;
		font-size: 30px;
		color: #bff8ff;
	}

	.orbiting-floppy {
		position: absolute;
		right: 15%;
		bottom: 22%;
		font-size: 50px;
		color: #f4b8ff;
		transform: rotate(16deg);
		filter: drop-shadow(0 0 12px #ff63e7);
	}

	.popup-zone {
		background:
			radial-gradient(circle at 12% 25%, #fff 0 2px, transparent 3px),
			linear-gradient(#291351 0%, #563c91 48%, #c783ad 100%);
		background-size:
			83px 73px,
			auto;
	}

	.pixel-cloud {
		position: absolute;
		width: 230px;
		height: 65px;
		background: #dac8ee;
		box-shadow:
			30px -25px #dac8ee,
			80px -12px #dac8ee,
			145px -30px #dac8ee,
			180px 0 #dac8ee;
		opacity: 0.7;
		image-rendering: pixelated;
	}
	.cloud-one {
		top: 20%;
		left: 8%;
		transform: scale(0.7);
	}
	.cloud-two {
		top: 64%;
		right: 12%;
		transform: scale(0.5);
	}

	.floating-window {
		position: absolute;
		width: 190px;
		padding: 6px;
		border: 3px outset #d9d9d9;
		background: #c0c0c0;
		color: #101020;
		font:
			11px 'Courier New',
			monospace;
		box-shadow: 8px 8px 0 #09041388;
	}
	.floating-window b {
		display: block;
		padding: 4px;
		background: #110080;
		color: white;
	}
	.floating-window span {
		display: block;
		padding: 12px 4px;
		text-align: center;
	}
	.window-one {
		top: 16%;
		right: 8%;
		transform: rotate(5deg);
	}
	.window-two {
		top: 52%;
		left: 6%;
		transform: rotate(-4deg);
	}
	.window-three {
		bottom: 8%;
		right: 20%;
		transform: rotate(2deg);
	}

	.homepage-zone {
		background-color: #08031b;
		background-image:
			radial-gradient(circle, #fff 0 1px, transparent 2px),
			radial-gradient(circle, #7654ff 0 2px, transparent 3px);
		background-position:
			0 0,
			23px 31px;
		background-size:
			47px 47px,
			79px 79px;
	}

	.homepage-title,
	.webring,
	.construction,
	.basement-sign {
		position: absolute;
		font-family: 'Courier New', monospace;
		text-align: center;
	}
	.homepage-title {
		left: 50%;
		top: 11%;
		transform: translateX(-50%) rotate(-2deg);
		padding: 8px 18px;
		color: #fff;
		background: #690090;
		border: 4px ridge #ff79f4;
		font-size: clamp(16px, 2vw, 28px);
		text-shadow: 3px 3px #0018a2;
	}
	.webring {
		right: 6%;
		top: 43%;
		padding: 8px;
		border: 3px double #77ffff;
		color: #77ffff;
		background: #001455;
	}
	.construction {
		left: 7%;
		bottom: 12%;
		padding: 6px;
		color: #171000;
		background: #ffd12a;
		transform: rotate(2deg);
	}
	.tiny-wizard {
		position: absolute;
		left: 14%;
		top: 30%;
		width: 80px;
		image-rendering: pixelated;
	}
	.running-cat {
		position: absolute;
		right: 19%;
		bottom: 24%;
		width: 96px;
		image-rendering: pixelated;
	}

	.basement-zone {
		background:
			repeating-linear-gradient(90deg, transparent 0 78px, #241f3a55 79px 81px),
			linear-gradient(#171326, #070710 78%);
	}
	.basement-zone::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 25%;
		background: repeating-linear-gradient(90deg, #16151d 0 48px, #282631 49px 50px);
		transform: perspective(260px) rotateX(38deg);
		transform-origin: bottom;
	}
	.pipe {
		position: absolute;
		background: #514b62;
		border: 4px outset #746c83;
	}
	.pipe-one {
		left: 7%;
		top: 0;
		width: 36px;
		height: 62%;
	}
	.pipe-two {
		right: 8%;
		top: 18%;
		width: 34%;
		height: 28px;
	}
	.server-rack {
		position: absolute;
		bottom: 13%;
		width: 170px;
		padding: 10px;
		border: 5px outset #454151;
		background: #14121b;
		z-index: 1;
	}
	.rack-one {
		left: 13%;
	}
	.rack-two {
		right: 11%;
	}
	.server-rack i {
		display: block;
		height: 18px;
		margin: 8px 0;
		border: 2px inset #4f4a5c;
		background: linear-gradient(90deg, #20202b 80%, #55ff77 81% 84%, #181822 85%);
	}
	.basement-sign {
		left: 50%;
		top: 17%;
		transform: translateX(-50%) rotate(1deg);
		padding: 10px 20px;
		border: 3px solid #ffca55;
		background: #221700;
		color: #ffdc87;
	}
	.cable {
		position: absolute;
		left: 33%;
		top: 0;
		width: 3px;
		height: 55%;
		background: #7be7ff;
		box-shadow: 0 0 9px #7be7ff;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(transparent 0 3px, #000 4px);
		opacity: 0.09;
	}

	.calm .world-strip {
		transition: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.world-strip {
			transition: none;
		}
	}
</style>
