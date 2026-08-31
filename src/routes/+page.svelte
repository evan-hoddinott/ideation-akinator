<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		clearProject,
		createProject,
		loadProject,
		saveProject,
		type ProjectSession
	} from '$lib/project-state';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form } = $props();
	let project = $state<ProjectSession | null>(null);
	let stateReady = $state(false);
	let stateNotice = $state('');
	let submitting = $state(false);
	let resetDialog = $state<HTMLDialogElement>();

	const workflow = [
		{ label: 'Problem', glyph: '01' },
		{ label: 'Preferences', glyph: '02' },
		{ label: 'Research', glyph: '03' },
		{ label: 'Questions', glyph: '04' },
		{ label: 'Four ideas', glyph: '05' },
		{ label: 'Workshop', glyph: '06' },
		{ label: 'Final PRD', glyph: '07' }
	];

	$effect(() => {
		if (!data.authenticated || stateReady) return;

		const result = loadProject(window.localStorage);
		project = result.project;
		stateReady = true;

		if (result.status === 'recovered') {
			stateNotice = 'An unreadable old project was cleared. Nothing else in this browser changed.';
		} else if (result.status === 'ready') {
			stateNotice = 'Your unfinished project was restored from this browser.';
		}
	});

	const enhanceLogin: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};

	function beginProject() {
		const nextProject = project ?? createProject();
		project = saveProject(window.localStorage, { ...nextProject, stage: 'problem' });
		stateNotice = 'Project started. Your progress now stays in this browser.';
	}

	function startOver() {
		clearProject(window.localStorage);
		project = null;
		stateNotice = 'The active project was cleared. The oracle is ready for a new one.';
		resetDialog?.close();
	}
</script>

<svelte:head>
	<title>Ideation Akinator</title>
	<meta
		name="description"
		content="Turn a stubborn problem into four researched product ideas and a practical PRD."
	/>
</svelte:head>

<div class="star-field" aria-hidden="true"></div>

{#if !data.authenticated}
	<main class="gate-page">
		<section class="gate-window" aria-labelledby="gate-title">
			<div class="window-bar">
				<span class="window-title">IDEA_ORACLE.EXE</span>
				<span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span>
			</div>

			<div class="gate-grid">
				<div class="sage-stage">
					<span class="spark spark-one" aria-hidden="true">+</span>
					<span class="spark spark-two" aria-hidden="true">+</span>
					<img
						class="sage-image"
						src="/images/signal-sage.png"
						alt="The Signal Sage, a friendly wizard with an old computer monitor for a head"
					/>
					<p class="character-label">THE SIGNAL SAGE</p>
				</div>

				<div class="gate-copy">
					<p class="eyebrow">A private workshop for unruly ideas</p>
					<h1 id="gate-title">Ideation<br /><span>Akinator</span></h1>
					<p class="lede">
						Bring one messy problem. Leave with four researched directions and a plan you could
						actually build.
					</p>

					{#if data.configurationReady}
						<form class="password-form" method="POST" action="?/login" use:enhance={enhanceLogin}>
							<label for="password">Speak the workshop password</label>
							<div class="password-row">
								<input
									id="password"
									name="password"
									type="password"
									autocomplete="current-password"
									required
								/>
								<button class="pixel-button" type="submit" disabled={submitting}>
									{submitting ? 'Consulting...' : 'Enter workshop'}
								</button>
							</div>
							{#if form?.message}
								<p class="form-message" role="alert">{form.message}</p>
							{/if}
						</form>
					{:else}
						<div class="setup-message" role="status">
							The workshop owner still needs to configure its password secret.
						</div>
					{/if}

					<p class="local-note">
						<span aria-hidden="true">◆</span> One shared password. No accounts.
					</p>
				</div>
			</div>
		</section>
		<p class="gate-footer">
			Best viewed on a computer with at least one questionable desktop theme.
		</p>
	</main>
{:else}
	<div class="app-frame">
		<header class="site-header">
			<a class="wordmark" href={resolve('/')} aria-label="Ideation Akinator home">
				<span class="wordmark-star" aria-hidden="true">✦</span>
				<span><b>IDEATION</b> AKINATOR</span>
			</a>
			<div class="header-tools">
				<span class="demo-badge">PRIVATE TECH DEMO</span>
				<form method="POST" action="?/logout">
					<button class="text-button" type="submit">Lock workshop</button>
				</form>
			</div>
		</header>

		<div class="workspace">
			<aside class="progress-rail" aria-label="Project progress">
				<div class="rail-orb" aria-hidden="true"><span>?</span></div>
				<p class="rail-kicker">THE RITUAL</p>
				<ol>
					{#each workflow as step, index (step.glyph)}
						<li
							class:active={project?.stage === 'problem' && index === 0}
							class:pending={index > 0 || !project}
						>
							<span class="step-glyph">{step.glyph}</span>
							<span>{step.label}</span>
						</li>
					{/each}
				</ol>
				<div class="rail-note">
					<span class="status-light" aria-hidden="true"></span>
					Saved in this browser
				</div>
			</aside>

			<main class="workbench">
				{#if stateNotice}
					<div class="state-notice" role="status">
						<span aria-hidden="true">i</span>
						{stateNotice}
					</div>
				{/if}

				{#if !stateReady}
					<section class="loading-panel" aria-live="polite">
						<div class="loading-orb" aria-hidden="true"></div>
						<p>Dusting off your last session...</p>
					</section>
				{:else if project?.stage === 'problem'}
					<section class="room-panel room-placeholder" aria-labelledby="problem-room-title">
						<p class="room-number">ROOM 01 / PROBLEM</p>
						<h1 id="problem-room-title">The first room is open.</h1>
						<p>
							Your project session is saved and ready. The problem-card form arrives in the next
							implementation slice.
						</p>
						<div class="saved-card">
							<span class="saved-icon" aria-hidden="true">✓</span>
							<div>
								<strong>Browser state is working</strong>
								<small>Project {project.id.slice(0, 8)} · schema v{project.schemaVersion}</small>
							</div>
						</div>
						<button class="secondary-button" type="button" onclick={() => resetDialog?.showModal()}>
							Start over
						</button>
					</section>
				{:else}
					<section class="welcome-room" aria-labelledby="welcome-title">
						<div class="welcome-copy">
							<p class="room-number">THE IDEA WORKSHOP</p>
							<h1 id="welcome-title">Give that nagging problem somewhere to go.</h1>
							<p class="welcome-lede">
								The Signal Sage will research the territory, ask the annoying useful questions, and
								return four different projects worth considering.
							</p>
							<div class="promise-grid">
								<div>
									<span>01</span>
									<p>Describe related problems in your own words.</p>
								</div>
								<div>
									<span>02</span>
									<p>Compare three practical ideas and one stretch.</p>
								</div>
								<div>
									<span>03</span>
									<p>Export the chosen project as a cited PDF.</p>
								</div>
							</div>
							<button class="summon-button" type="button" onclick={beginProject}>
								<span>Begin conjuring</span>
								<i aria-hidden="true">→</i>
							</button>
							<p class="time-note">No account. Your active project stays on this device.</p>
						</div>

						<div class="sage-card" aria-label="A message from the Signal Sage">
							<div class="speech-bubble">
								<span class="online-dot" aria-hidden="true"></span>
								"Do not polish the problem first. The weird, specific bits are usually the useful ones."
							</div>
							<img src="/images/signal-sage.png" alt="" />
							<div class="sage-shadow" aria-hidden="true"></div>
						</div>
					</section>
				{/if}
			</main>
		</div>
	</div>

	<dialog class="reset-dialog" bind:this={resetDialog}>
		<form method="dialog">
			<p class="dialog-kicker">BREAK THE SPELL?</p>
			<h2>Start over completely?</h2>
			<p>This removes the active project from this browser. It cannot be restored.</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep it</button>
				<button class="danger-button" type="button" onclick={startOver}>Clear project</button>
			</div>
		</form>
	</dialog>
{/if}
