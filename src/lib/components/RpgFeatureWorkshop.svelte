<script lang="ts">
	import { onMount } from 'svelte';
	import type { ConceptPortfolio } from '$lib/concepts';
	import {
		addCustomFeature,
		confirmWorkshopConcept,
		removeCustomFeature,
		toggleWorkshopFeature,
		type FeatureWorkshopState,
		type WorkshopFeature
	} from '$lib/feature-workshop';

	let {
		portfolio,
		workshop,
		onChange,
		onContinue
	}: {
		portfolio: ConceptPortfolio;
		workshop: FeatureWorkshopState;
		onChange: (state: FeatureWorkshopState, event: 'changed' | 'blocked' | 'confirmed') => void;
		onContinue: () => void;
	} = $props();

	const pageSize = 4;
	let activeConceptId = $state('');
	let page = $state(0);
	let cursor = $state(0);
	let pendingFeature = $state<WorkshopFeature | null>(null);
	let pendingDependencies = $state<WorkshopFeature[]>([]);
	let customOpen = $state(false);
	let customName = $state('');
	let customDescription = $state('');
	let customDependencies = $state<string[]>([]);
	let filedFeature = $state('');
	let message = $state(
		'Choose one concept, turn its features on or off, then seal that configuration.'
	);

	const activeConcept = $derived(
		portfolio.concepts.find((concept) => concept.id === activeConceptId) ?? portfolio.concepts[0]
	);
	const activeConfiguration = $derived(
		workshop.configurations.find((item) => item.conceptId === activeConcept?.id) ?? null
	);
	const pageCount = $derived(
		Math.max(1, Math.ceil((activeConfiguration?.features.length ?? 0) / pageSize))
	);
	const visibleFeatures = $derived(
		activeConfiguration?.features.slice(page * pageSize, page * pageSize + pageSize) ?? []
	);

	$effect(() => {
		if (!activeConceptId || !portfolio.concepts.some((concept) => concept.id === activeConceptId)) {
			activeConceptId = workshop.selectedConceptId ?? portfolio.concepts[0]?.id ?? '';
		}
	});

	onMount(() => {
		const onKeydown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target?.matches('input,textarea,select') || target?.closest('dialog,[data-custom-form]'))
				return;
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				setPage(page - 1);
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				setPage(page + 1);
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault();
				cursor = Math.max(
					0,
					Math.min(visibleFeatures.length - 1, cursor + (event.key === 'ArrowDown' ? 1 : -1))
				);
			} else if (event.key === ' ' && visibleFeatures[cursor]) {
				event.preventDefault();
				const feature = visibleFeatures[cursor];
				changeFeature(feature, !feature.included);
			} else if (/^[1-4]$/.test(event.key)) {
				const concept = portfolio.concepts[Number(event.key) - 1];
				if (concept) selectConcept(concept.id);
			}
		};
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	function selectConcept(id: string) {
		activeConceptId = id;
		page = 0;
		cursor = 0;
		pendingFeature = null;
		message = `Now configuring ${portfolio.concepts.find((concept) => concept.id === id)?.name ?? 'this concept'}. Choose the features you want to keep.`;
	}

	function setPage(next: number) {
		page = Math.max(0, Math.min(pageCount - 1, next));
		cursor = 0;
	}

	function changeFeature(feature: WorkshopFeature, included: boolean) {
		if (!activeConcept) return;
		const result = toggleWorkshopFeature(workshop, activeConcept.id, feature.id, included);
		if (result.blockedBy.length) {
			message = `Blocked: ${result.blockedBy.map((item) => item.name).join(' and ')} still needs ${feature.name}.`;
			onChange(workshop, 'blocked');
			return;
		}
		if (result.requiresConfirmation.length) {
			pendingFeature = feature;
			pendingDependencies = result.requiresConfirmation;
			return;
		}
		filedFeature = included ? feature.id : '';
		window.setTimeout(() => (filedFeature = ''), 700);
		message = included
			? `${feature.name} is included in this concept.`
			: `${feature.name} is excluded from this concept.`;
		onChange(result.state, 'changed');
	}

	function confirmDependencies() {
		if (!activeConcept || !pendingFeature) return;
		const result = toggleWorkshopFeature(workshop, activeConcept.id, pendingFeature.id, true, true);
		filedFeature = pendingFeature.id;
		message = `${pendingFeature.name} and its required features are now included.`;
		pendingFeature = null;
		pendingDependencies = [];
		onChange(result.state, 'changed');
	}

	function deleteCustom(feature: WorkshopFeature) {
		if (!activeConcept) return;
		const result = removeCustomFeature(workshop, activeConcept.id, feature.id);
		if (result.blockedBy.length) {
			message = `${result.blockedBy.map((item) => item.name).join(' and ')} prevents deletion.`;
			onChange(workshop, 'blocked');
			return;
		}
		message = `${feature.name} was removed from this concept.`;
		onChange(result.state, 'changed');
	}

	function addCustom(event: SubmitEvent) {
		event.preventDefault();
		if (!activeConcept || !customName.trim() || !customDescription.trim()) {
			message = 'Give the custom feature a name and a short description first.';
			return;
		}
		const next = addCustomFeature(workshop, activeConcept.id, {
			id: `${activeConcept.id}:custom:${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`,
			name: customName,
			description: customDescription,
			dependencies: customDependencies
		});
		if (next === workshop) {
			message = 'That feature already exists, or one of its dependencies is unavailable.';
			return;
		}
		message = `${customName.trim()} was added to this concept.`;
		customName = '';
		customDescription = '';
		customDependencies = [];
		customOpen = false;
		onChange(next, 'changed');
	}

	function confirmSelection() {
		if (!activeConcept) return;
		const next = confirmWorkshopConcept(workshop, activeConcept.id);
		if (next === workshop) {
			message = 'Keep at least one feature before choosing this concept.';
			return;
		}
		message = `${activeConcept.name} is selected. Continue to test this exact feature set against current evidence.`;
		onChange(next, 'confirmed');
	}
</script>

<section class="rpg-workshop" aria-labelledby="rpg-workshop-title">
	<header class="folder-bar">
		<div>
			<span>C:\PROPHECIES\PROJECT_FILES</span>
			<h2 id="rpg-workshop-title">CHOOSE A CONCEPT AND FEATURES</h2>
		</div>
		<div class="folder-icon" class:filing={!!filedFeature} aria-hidden="true">📁<i>FILE</i></div>
	</header>

	<nav class="project-tabs" aria-label="Projects to configure">
		{#each portfolio.concepts as concept, index (concept.id)}
			<button
				type="button"
				class:active={concept.id === activeConcept?.id}
				class:selected={concept.id === workshop.selectedConceptId}
				onclick={() => selectConcept(concept.id)}
			>
				<kbd>{index + 1}</kbd><span>{concept.name}</span
				>{#if concept.id === workshop.selectedConceptId}<b>SEALED</b>{/if}
			</button>
		{/each}
	</nav>

	{#if activeConcept && activeConfiguration}
		<div class="feature-screen">
			<aside>
				<span>{activeConcept.isStretch ? 'QUARANTINED BUILD' : 'ACTIVE PROJECT'}</span>
				<h3>{activeConcept.name}</h3>
				<p>{activeConcept.pitch}</p>
				<b
					>{activeConfiguration.features.filter((feature) => feature.included).length} FEATURES INCLUDED</b
				>
			</aside>
			<div class="rpg-list" role="listbox" aria-label="Feature files">
				{#each visibleFeatures as feature, index (feature.id)}
					<div
						class="feature-choice"
						class:included={feature.included}
						class:cursor={cursor === index}
						class:filing={filedFeature === feature.id}
						role="option"
						aria-selected={feature.included}
					>
						<button type="button" onclick={() => changeFeature(feature, !feature.included)}>
							<i aria-hidden="true">{cursor === index ? '♥' : ' '}</i>
							<span
								><strong>{feature.included ? '[X]' : '[ ]'} {feature.name}</strong><small
									>{feature.description}</small
								>{#if feature.dependencies.length}<em
										>NEEDS {feature.dependencies.length} OTHER FILE(S)</em
									>{/if}</span
							>
						</button>
						{#if feature.isCustom}<button
								class="delete-file"
								type="button"
								onclick={() => deleteCustom(feature)}>DEL</button
							>{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="page-controls">
			<button type="button" disabled={page === 0} onclick={() => setPage(page - 1)}>◀ PREV</button>
			<span>PAGE {page + 1} / {pageCount}</span>
			<button type="button" disabled={page >= pageCount - 1} onclick={() => setPage(page + 1)}
				>NEXT ▶</button
			>
		</div>

		<p class="workshop-message" role="status">{message}</p>
		<footer>
			<button type="button" onclick={() => (customOpen = !customOpen)}>+ ADD CUSTOM FEATURE</button>
			<button class="seal" type="button" onclick={confirmSelection}>
				{workshop.status === 'confirmed' && workshop.selectedConceptId === activeConcept.id
					? '✓ CONCEPT SELECTED'
					: 'SELECT THIS CONCEPT'}
			</button>
			{#if workshop.status === 'confirmed'}<button
					class="reality"
					type="button"
					onclick={onContinue}>CONTINUE TO FOCUSED RESEARCH →</button
				>{/if}
		</footer>

		{#if customOpen}
			<form class="custom-dialog" data-custom-form onsubmit={addCustom}>
				<header>
					NEW_FEATURE.WIZ <button type="button" onclick={() => (customOpen = false)}>×</button>
				</header>
				<label>FILE NAME <input bind:value={customName} maxlength="100" /></label>
				<label
					>WHAT IT DOES <textarea bind:value={customDescription} maxlength="280" rows="2"
					></textarea></label
				>
				<div class="dependency-list">
					<span>OPTIONAL DEPENDENCIES</span>
					{#each activeConfiguration.features as feature (feature.id)}<label
							><input
								type="checkbox"
								checked={customDependencies.includes(feature.id)}
								onchange={(event) =>
									(customDependencies = event.currentTarget.checked
										? [...customDependencies, feature.id]
										: customDependencies.filter((id) => id !== feature.id))}
							/>{feature.name}</label
						>{/each}
				</div>
				<button type="submit">INSTALL SUSPICIOUSLY</button>
			</form>
		{/if}

		{#if pendingFeature}
			<div
				class="dependency-dialog"
				role="alertdialog"
				aria-label="Feature dependencies"
				tabindex="-1"
			>
				<span>DEPENDENCY GOBLIN</span>
				<p>
					<b>{pendingFeature.name}</b> also needs {pendingDependencies
						.map((item) => item.name)
						.join(' + ')}.
				</p>
				<div>
					<button type="button" onclick={() => (pendingFeature = null)}>FLEE</button><button
						type="button"
						onclick={confirmDependencies}>ADD REQUIRED FILES</button
					>
				</div>
			</div>
		{/if}
	{/if}
</section>

<style>
	.rpg-workshop {
		position: absolute;
		top: 50%;
		right: 26px;
		width: min(920px, calc(100vw - 330px));
		height: min(660px, calc(100vh - 110px));
		margin: 0;
		border: 5px ridge #bcc4d4;
		background: #d4d2e4;
		color: #4c4c4c;
		font-family: 'Silkscreen', 'Courier New', monospace;
		box-shadow: 5px 6px #85776166;
		overflow: hidden;
		transform: translateY(-50%);
	}
	.folder-bar {
		height: 64px;
		box-sizing: border-box;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 18px;
		background: #bdcaa8;
		border-bottom: 3px outset #ccd;
	}
	.folder-bar span {
		font-size: 11px;
		color: #394c60;
	}
	.folder-bar h2 {
		margin: 4px 0 0;
		font-size: 22px;
	}
	.folder-icon {
		position: relative;
		font-size: 38px;
	}
	.folder-icon i {
		position: absolute;
		right: 34px;
		top: 10px;
		font-size: 8px;
		color: #4c4c4c;
		opacity: 0;
	}
	.folder-icon.filing i {
		animation: file-flight 0.65s steps(7);
	}
	@keyframes file-flight {
		0% {
			opacity: 1;
			transform: translate(-520px, 180px) rotate(-20deg);
		}
		100% {
			opacity: 1;
			transform: translate(0, 0);
		}
	}
	.project-tabs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		height: 58px;
		background: #c0c0c0;
		padding: 6px;
		gap: 5px;
		box-sizing: border-box;
	}
	.project-tabs button {
		min-width: 0;
		border: 3px outset #eee;
		background: #c0c0c0;
		color: #111;
		font:
			11px 'Silkscreen',
			monospace;
		text-align: left;
		cursor: pointer;
	}
	.project-tabs button.active {
		border-style: inset;
		background: #d2d2e4;
		color: #4c4c4c;
	}
	.project-tabs span {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.project-tabs kbd {
		float: left;
		margin-right: 5px;
	}
	.project-tabs b {
		color: #22e486;
		font-size: 9px;
	}
	.feature-screen {
		display: grid;
		grid-template-columns: 255px 1fr;
		height: calc(100% - 244px);
	}
	.feature-screen aside {
		padding: 20px;
		border-right: 3px double #756c93;
		background: #d6d2e4;
	}
	.feature-screen aside span {
		font-size: 11px;
		color: #395c60;
	}
	.feature-screen aside h3 {
		margin: 10px 0;
		color: #605739;
		font-size: 21px;
	}
	.feature-screen aside p {
		font:
			14px/1.5 Georgia,
			serif;
		color: #4d3a5f;
	}
	.feature-screen aside b {
		display: block;
		margin-top: 22px;
		color: #39604b;
		font-size: 12px;
	}
	.rpg-list {
		padding: 10px;
		overflow: hidden;
		background: #f4e8ce;
	}
	.feature-choice {
		height: 76px;
		margin-bottom: 7px;
		border: 2px solid #4c4263;
		background: #d6d2e4;
		display: flex;
		transition: none;
	}
	.feature-choice.cursor {
		border-color: #605839;
		background: #dad2e4;
	}
	.feature-choice.included {
		box-shadow: inset 5px 0 #4be59c;
	}
	.feature-choice.filing {
		animation: choice-file 0.55s steps(6);
	}
	@keyframes choice-file {
		50% {
			transform: translateX(24px);
			opacity: 0.35;
		}
	}
	.feature-choice > button:first-child {
		display: grid;
		grid-template-columns: 24px 1fr;
		align-items: center;
		flex: 1;
		border: 0;
		background: transparent;
		color: #4c4c4c;
		text-align: left;
		cursor: pointer;
	}
	.feature-choice i {
		color: #60394b;
		font-style: normal;
		font-size: 18px;
	}
	.feature-choice strong,
	.feature-choice small,
	.feature-choice em {
		display: block;
	}
	.feature-choice strong {
		color: #605539;
		font-size: 13px;
	}
	.feature-choice small {
		margin-top: 5px;
		color: #4c3d5c;
		font:
			12px/1.35 Georgia,
			serif;
	}
	.feature-choice em {
		margin-top: 4px;
		color: #395b60;
		font-size: 9px;
	}
	.delete-file {
		align-self: center;
		margin-right: 8px;
		border: 2px outset #faa;
		background: #e4d2d7;
		color: #4c4c4c;
		min-height: 34px;
		font: 10px 'Silkscreen';
		cursor: pointer;
	}
	.page-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 18px;
		height: 34px;
		background: #d6d2e4;
	}
	.page-controls button,
	.rpg-workshop footer button {
		border: 2px outset #ddd;
		background: #c0c0c0;
		color: #111;
		min-height: 34px;
		font: 11px 'Silkscreen';
		cursor: pointer;
	}
	.page-controls button:disabled {
		opacity: 0.4;
	}
	.page-controls span {
		font-size: 11px;
		color: #395a60;
	}
	.workshop-message {
		height: 30px;
		margin: 0;
		padding: 9px 16px;
		box-sizing: border-box;
		border-top: 1px solid #423955;
		color: #605639;
		font-size: 10px;
		overflow: hidden;
	}
	.rpg-workshop > footer {
		height: 58px;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 10px;
		padding: 10px 15px;
		box-sizing: border-box;
		background: #d9d2e4;
		border-top: 3px ridge #655879;
	}
	.rpg-workshop footer button {
		padding: 9px;
	}
	.rpg-workshop footer .seal {
		background: #e4d2df;
		color: #4c4c4c;
		border-color: #603954;
	}
	.rpg-workshop footer .reality {
		background: #d2e4de;
		color: #4c4c4c;
		border-color: #39604e;
	}
	.custom-dialog,
	.dependency-dialog {
		position: absolute;
		z-index: 4;
		left: 50%;
		top: 52%;
		transform: translate(-50%, -50%);
		width: min(540px, 90%);
		box-sizing: border-box;
		padding: 14px;
		border: 5px ridge #d390e5;
		background: #dcd2e4;
		color: #4c4c4c;
		box-shadow: 0 0 0 100vmax #020106bb;
	}
	.custom-dialog header {
		display: flex;
		justify-content: space-between;
		color: #603953;
	}
	.custom-dialog label {
		display: block;
		margin-top: 10px;
		font-size: 11px;
	}
	.custom-dialog input,
	.custom-dialog textarea {
		box-sizing: border-box;
		width: 100%;
		margin-top: 4px;
		border: 2px inset #aaa;
		padding: 7px;
		background: #dbd2e4;
		color: #4c4c4c;
		font-size: 14px;
	}
	.dependency-list {
		max-height: 120px;
		overflow: auto;
		margin: 10px 0;
		padding: 8px;
		border: 1px solid #56445d;
	}
	.dependency-list label {
		margin: 4px 0;
	}
	.custom-dialog button,
	.dependency-dialog button {
		border: 2px outset #ddd;
		padding: 7px;
		background: #c0c0c0;
		min-height: 38px;
		font: 11px 'Silkscreen';
		cursor: pointer;
	}
	.dependency-dialog span {
		color: #605539;
		font-size: 10px;
	}
	.dependency-dialog p {
		font:
			14px/1.45 Georgia,
			serif;
	}
	.dependency-dialog div {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	@media (max-height: 760px) {
		.rpg-workshop {
			height: 620px;
		}
		.feature-screen {
			height: calc(100% - 244px);
		}
		.feature-choice {
			height: 68px;
		}
		.feature-choice small {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.rpg-workshop {
			position: static;
			width: 100%;
			height: auto;
			min-height: 100vh;
			border-width: 2px;
			overflow: auto;
			transform: none;
		}
		.project-tabs {
			grid-template-columns: 1fr 1fr;
			height: auto;
		}
		.feature-screen {
			grid-template-columns: 1fr;
			height: auto;
		}
		.feature-screen aside {
			display: none;
		}
		.rpg-list {
			min-height: 360px;
		}
		.rpg-workshop > footer {
			height: auto;
			flex-wrap: wrap;
		}
		.folder-bar h2 {
			font-size: 16px;
		}
	}
</style>
