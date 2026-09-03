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
	let message = $state('Arrow keys move. Space toggles. The mouse is also legal.');

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
		message = `Opened ${portfolio.concepts.find((concept) => concept.id === id)?.name ?? 'project'}.`;
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
			? `${feature.name}.exe flew into PROJECT_FILES.`
			: `${feature.name} moved to Trash.`;
		onChange(result.state, 'changed');
	}

	function confirmDependencies() {
		if (!activeConcept || !pendingFeature) return;
		const result = toggleWorkshopFeature(workshop, activeConcept.id, pendingFeature.id, true, true);
		filedFeature = pendingFeature.id;
		message = `${pendingFeature.name} and its required files were installed.`;
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
		message = `${feature.name} was recycled with extreme prejudice.`;
		onChange(result.state, 'changed');
	}

	function addCustom(event: SubmitEvent) {
		event.preventDefault();
		if (!activeConcept || !customName.trim() || !customDescription.trim()) {
			message = 'Name and describe the forbidden addition first.';
			return;
		}
		const next = addCustomFeature(workshop, activeConcept.id, {
			id: `${activeConcept.id}:custom:${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`,
			name: customName,
			description: customDescription,
			dependencies: customDependencies
		});
		if (next === workshop) {
			message = 'That file already exists or has an escaped dependency.';
			return;
		}
		message = `${customName.trim()}.wiz was added.`;
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
			message = 'At least one project file must survive.';
			return;
		}
		message = `${activeConcept.name} is sealed. Estimates remain frozen until the final pass.`;
		onChange(next, 'confirmed');
	}
</script>

<section class="rpg-workshop" aria-labelledby="rpg-workshop-title">
	<header class="folder-bar">
		<div>
			<span>C:\PROPHECIES\PROJECT_FILES</span>
			<h2 id="rpg-workshop-title">BUILD YOUR GUESS</h2>
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
				<b>{activeConfiguration.features.filter((feature) => feature.included).length} FILES ON</b>
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
			<button type="button" onclick={() => (customOpen = !customOpen)}>+ CUSTOM FILE</button>
			<button class="seal" type="button" onclick={confirmSelection}>
				{workshop.status === 'confirmed' && workshop.selectedConceptId === activeConcept.id
					? '✓ PROPHECY SEALED'
					: 'SEAL THIS PROJECT'}
			</button>
			{#if workshop.status === 'confirmed'}<button
					class="reality"
					type="button"
					onclick={onContinue}>CHECK AGAINST REALITY →</button
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
		width: min(820px, calc(100vw - 360px));
		height: min(620px, calc(100vh - 130px));
		margin: 0;
		border: 5px ridge #bcc4d4;
		background: #070611;
		color: #fff;
		font-family: 'Silkscreen', 'Courier New', monospace;
		box-shadow: 14px 16px #020105;
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
		background: linear-gradient(90deg, #001d79, #174eab);
		border-bottom: 3px outset #ccd;
	}
	.folder-bar span {
		font-size: 9px;
		color: #b6d9ff;
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
		color: #fff;
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
			9px 'Silkscreen',
			monospace;
		text-align: left;
		cursor: pointer;
	}
	.project-tabs button.active {
		border-style: inset;
		background: #000080;
		color: #fff;
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
		font-size: 7px;
	}
	.feature-screen {
		display: grid;
		grid-template-columns: 255px 1fr;
		height: 310px;
	}
	.feature-screen aside {
		padding: 20px;
		border-right: 3px double #756c93;
		background: #130d28;
	}
	.feature-screen aside span {
		font-size: 8px;
		color: #7cefff;
	}
	.feature-screen aside h3 {
		margin: 10px 0;
		color: #ffe181;
		font-size: 21px;
	}
	.feature-screen aside p {
		font:
			12px/1.5 Georgia,
			serif;
		color: #d9cfe2;
	}
	.feature-screen aside b {
		display: block;
		margin-top: 22px;
		color: #7effba;
		font-size: 10px;
	}
	.rpg-list {
		padding: 10px;
		overflow: hidden;
		background: repeating-linear-gradient(0deg, #080811 0 2px, #0d0b18 2px 4px);
	}
	.feature-choice {
		height: 67px;
		margin-bottom: 7px;
		border: 2px solid #4c4263;
		background: #100c20;
		display: flex;
		transition: none;
	}
	.feature-choice.cursor {
		border-color: #ffe477;
		background: #241536;
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
		color: #fff;
		text-align: left;
		cursor: pointer;
	}
	.feature-choice i {
		color: #ff5da8;
		font-style: normal;
		font-size: 18px;
	}
	.feature-choice strong,
	.feature-choice small,
	.feature-choice em {
		display: block;
	}
	.feature-choice strong {
		color: #ffe8ae;
		font-size: 11px;
	}
	.feature-choice small {
		margin-top: 5px;
		color: #c8bdd3;
		font:
			10px/1.3 Georgia,
			serif;
	}
	.feature-choice em {
		margin-top: 4px;
		color: #70eaff;
		font-size: 7px;
	}
	.delete-file {
		align-self: center;
		margin-right: 8px;
		border: 2px outset #faa;
		background: #5d1527;
		color: #fff;
		font: 8px 'Silkscreen';
		cursor: pointer;
	}
	.page-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 18px;
		height: 34px;
		background: #090712;
	}
	.page-controls button,
	.rpg-workshop footer button {
		border: 2px outset #ddd;
		background: #c0c0c0;
		color: #111;
		font: 9px 'Silkscreen';
		cursor: pointer;
	}
	.page-controls button:disabled {
		opacity: 0.4;
	}
	.page-controls span {
		font-size: 9px;
		color: #8cecff;
	}
	.workshop-message {
		height: 30px;
		margin: 0;
		padding: 9px 16px;
		box-sizing: border-box;
		border-top: 1px solid #423955;
		color: #ffdc77;
		font-size: 8px;
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
		background: #191324;
		border-top: 3px ridge #655879;
	}
	.rpg-workshop footer button {
		padding: 9px;
	}
	.rpg-workshop footer .seal {
		background: #743360;
		color: #fff;
		border-color: #f6b4e2;
	}
	.rpg-workshop footer .reality {
		background: #145d45;
		color: #fff;
		border-color: #83edbb;
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
		background: #12091a;
		color: #fff;
		box-shadow: 0 0 0 100vmax #020106bb;
	}
	.custom-dialog header {
		display: flex;
		justify-content: space-between;
		color: #ff98dc;
	}
	.custom-dialog label {
		display: block;
		margin-top: 10px;
		font-size: 8px;
	}
	.custom-dialog input,
	.custom-dialog textarea {
		box-sizing: border-box;
		width: 100%;
		margin-top: 4px;
		border: 2px inset #aaa;
		padding: 7px;
		background: #050307;
		color: #fff;
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
		font: 8px 'Silkscreen';
		cursor: pointer;
	}
	.dependency-dialog span {
		color: #ffd360;
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
			height: 320px;
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
