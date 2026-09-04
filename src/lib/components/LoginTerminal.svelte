<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		configurationReady,
		submitting,
		formMessage,
		onSubmit
	}: {
		configurationReady: boolean;
		submitting: boolean;
		formMessage: string;
		onSubmit: SubmitFunction;
	} = $props();

	let bootLineCount = $state(0);
	let terminalReady = $state(false);
	let localReaction = $state('');
	let seenMessage = '';
	const bootLines = [
		'SAGE BIOS v0.9 // 640K OF PROPHECY OK',
		'MOUNTING C:\\FORBIDDEN_IDEAS...',
		'CHECKING WIZARD PERIPHERALS... HAT FOUND',
		'OPENING PRIVATE DIVINATION PORT 4187...'
	];
	const wrongReactions = [
		'INCORRECT. The keyboard denies knowing you.',
		'ACCESS DENIED. Nice try, suspicious mortal.',
		'BAD PASSWORD. The Sage has written this down somewhere petty.',
		'NOPE. Caps Lock is innocent this time.',
		'AUTH FAILURE. Please stop guessing my birthday.'
	];

	onMount(() => {
		const timers = bootLines.map((_, index) =>
			window.setTimeout(() => (bootLineCount = index + 1), 180 + index * 310)
		);
		timers.push(window.setTimeout(() => (terminalReady = true), 1_520));
		return () => timers.forEach(window.clearTimeout);
	});

	$effect(() => {
		if (!formMessage || formMessage === seenMessage) return;
		seenMessage = formMessage;
		localReaction = wrongReactions[Math.floor(Math.random() * wrongReactions.length)];
	});
</script>

<main class="login-crt" aria-labelledby="login-title">
	<div class="crt-shell">
		<div class="screen">
			<div class="scanlines" aria-hidden="true"></div>
			<section class="boot-log" aria-live="polite">
				{#each bootLines.slice(0, bootLineCount) as line (line)}<p>{line}</p>{/each}
				{#if terminalReady}<p class="boot-ok">BOOT COMPLETE. Probably.</p>{/if}
			</section>

			{#if terminalReady}
				<section class="login-terminal">
					<header>
						<img src="/images/sage/suspicious.webp" alt="" />
						<div>
							<span>PRIVATE WIZARD NETWORK</span>
							<h1 id="login-title">IDEATION AKINATOR</h1>
						</div>
					</header>
					{#if configurationReady}
						<form method="POST" action="?/login" use:enhance={onSubmit}>
							<label for="password">C:\SAGE_OS\GATE&gt; authenticate mortal</label>
							<div class="command-row">
								<span>&gt;</span><input
									id="password"
									name="password"
									type="password"
									autocomplete="current-password"
									required
								/><button type="submit" disabled={submitting}
									>{submitting ? 'VERIFYING...' : 'RUN'}</button
								>
							</div>
						</form>
						{#if formMessage}<p class="terminal-error" role="alert">*** {localReaction}</p>{/if}
					{:else}
						<p class="terminal-error" role="alert">
							CONFIG ERROR: the workshop owner forgot the password secret.
						</p>
					{/if}
					<footer>One shared password · no account · definitely not a honeypot</footer>
				</section>
			{/if}
		</div>
		<div class="monitor-controls" aria-hidden="true"><i></i><b>POWER</b><span></span></div>
	</div>
	<p class="desk-note">Best viewed on a computer containing at least one cursed download.</p>
</main>

<style>
	.login-crt {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		overflow: hidden;
		color: #d7ffc9;
		background: radial-gradient(circle at 50% 35%, #302348 0, #0b0714 48%, #030207 100%);
		font-family: 'Silkscreen', monospace;
	}
	.crt-shell {
		position: relative;
		width: min(980px, 94vw);
		padding: 24px 28px 46px;
		border: 9px ridge #a69f8e;
		border-radius: 30px 30px 55px 55px;
		background: #716b60;
		box-shadow:
			22px 28px 0 #0008,
			inset 0 -8px #4c473f;
	}
	.screen {
		position: relative;
		height: min(590px, 72vh);
		overflow: hidden;
		border: 12px inset #625e55;
		border-radius: 35px/24px;
		background: #010603;
		box-shadow: inset 0 0 50px #12ff4f1f;
	}
	.scanlines {
		position: absolute;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		background: repeating-linear-gradient(0deg, transparent 0 3px, #0005 4px);
	}
	.boot-log {
		position: absolute;
		inset: 22px;
		color: #59ff78;
		font:
			14px/1.6 'Courier New',
			monospace;
	}
	.boot-log p {
		margin: 0;
		animation: type-line 0.18s steps(4) both;
	}
	.boot-ok {
		color: #ffe16b !important;
	}
	.login-terminal {
		position: absolute;
		z-index: 4;
		inset: auto 7% 9%;
		padding: 18px;
		border: 2px solid #53ff76;
		background: #020603ee;
		box-shadow: 0 0 20px #36ff6455;
		animation: terminal-in 0.35s steps(5) both;
	}
	.login-terminal header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
		padding-bottom: 10px;
		border-bottom: 1px dashed #318e45;
	}
	.login-terminal img {
		width: 72px;
		height: 72px;
		border: 2px solid #68ff83;
		object-fit: cover;
		object-position: 50% 24%;
		image-rendering: pixelated;
	}
	.login-terminal span,
	.login-terminal label {
		color: #63ff7d;
		font-size: 11px;
	}
	.login-terminal h1 {
		margin: 4px 0 0;
		color: #ffe36c;
		font-size: clamp(25px, 3vw, 36px);
	}
	.login-terminal form {
		display: grid;
		gap: 7px;
	}
	.command-row {
		display: grid;
		grid-template-columns: 22px 1fr 110px;
		align-items: center;
		gap: 5px;
	}
	.command-row > span {
		color: #ffe36c;
		font-size: 17px;
	}
	.command-row input {
		min-width: 0;
		padding: 9px;
		border: 0;
		border-bottom: 2px solid #50ee6d;
		outline: none;
		color: #ddffe4;
		background: #07120a;
		font:
			18px 'Courier New',
			monospace;
		caret-color: #ffe36c;
	}
	.command-row button {
		height: 44px;
		border: 3px outset #aaa;
		color: #111;
		background: #d5d2c7;
		cursor: pointer;
		font:
			11px 'Silkscreen',
			monospace;
	}
	.command-row button:disabled {
		cursor: wait;
	}
	.terminal-error {
		margin: 10px 0 0;
		color: #ff6f91;
		font:
			12px/1.4 'Courier New',
			monospace;
	}
	.login-terminal footer {
		margin-top: 12px;
		color: #668b6d;
		font-size: 10px;
	}
	.monitor-controls {
		position: absolute;
		right: 45px;
		bottom: 14px;
		display: flex;
		align-items: center;
		gap: 7px;
		color: #302d29;
		font-size: 9px;
	}
	.monitor-controls i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4aff67;
		box-shadow: 0 0 7px #4aff67;
	}
	.monitor-controls span {
		width: 24px;
		height: 12px;
		border: 3px outset #aaa;
		background: #cbc6b8;
	}
	.desk-note {
		position: absolute;
		bottom: 12px;
		color: #71677c;
		font-size: 9px;
	}
	@keyframes type-line {
		from {
			clip-path: inset(0 100% 0 0);
		}
		to {
			clip-path: inset(0);
		}
	}
	@keyframes terminal-in {
		from {
			transform: scaleY(0.08);
			filter: brightness(4);
		}
		60% {
			transform: scaleY(1);
			filter: brightness(2);
		}
		to {
			filter: none;
		}
	}
	@media (max-width: 650px) {
		.crt-shell {
			width: 96vw;
			padding: 12px 12px 38px;
			border-width: 6px;
		}
		.screen {
			height: 76vh;
		}
		.login-terminal {
			inset: auto 4% 7%;
		}
		.login-terminal header img {
			display: none;
		}
		.command-row {
			grid-template-columns: 14px 1fr;
		}
		.command-row button {
			grid-column: 2;
		}
		.boot-log {
			font-size: 11px;
		}
	}
</style>
