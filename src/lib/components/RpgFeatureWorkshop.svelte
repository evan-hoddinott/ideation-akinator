<script lang="ts">
	import PagedText from './PagedText.svelte';
	import type { ConceptPortfolio } from '$lib/concepts';
	import {
		addCustomFeature,
		editFeatureDescription,
		confirmWorkshopConcept,
		createFeatureWorkshop,
		featurePlacement,
		placeWorkshopFeature,
		removeCustomFeature,
		restoreSuggestedBuild,
		type FeatureWorkshopState,
		type WorkshopFeature,
		type FeaturePlacement
	} from '$lib/feature-workshop';
	let {
		portfolio,
		workshop,
		initialConceptId = '',
		onChange,
		onContinue,
		onBack = () => {},
		onConceptChange = () => {}
	}: {
		portfolio: ConceptPortfolio;
		workshop: FeatureWorkshopState;
		initialConceptId?: string;
		onChange: (state: FeatureWorkshopState, event: 'changed' | 'blocked' | 'confirmed') => void;
		onContinue: () => void;
		onBack?: () => void;
		onConceptChange?: (id: string) => void;
	} = $props();
	let activeId = $state('');
	let featurePage = $state(0);
	let summaryOpen = $state(false);
	let conceptsOpen = $state(false);
	let customOpen = $state(false);
	let message = $state(
		'Start with the suggested build, then decide what belongs in your first version.'
	);
	let pending = $state<{ feature: WorkshopFeature; dependencies: WorkshopFeature[] } | null>(null);
	let restorePending = $state(false);
	let customName = $state('');
	let customDescription = $state('');
	let customDependencies = $state<string[]>([]);
	let editingId = $state('');
	let editedDescription = $state('');
	const placements: { value: FeaturePlacement; label: string }[] = [
		{ value: 'now', label: 'Build now' },
		{ value: 'later', label: 'Later' },
		{ value: 'out', label: 'Leave out' }
	];
	const concept = $derived(
		portfolio.concepts.find((item) => item.id === activeId) ?? portfolio.concepts[0]
	);
	const configuration = $derived(
		workshop.configurations.find((item) => item.conceptId === concept.id)!
	);
	const currentFeaturePage = $derived(Math.min(featurePage, configuration.features.length - 1));
	const suggested = $derived(
		createFeatureWorkshop(portfolio).configurations.find((item) => item.conceptId === concept.id)!
	);
	const changed = $derived(
		JSON.stringify(
			configuration.features.map((f) => [f.id, featurePlacement(f), f.name, f.description])
		) !==
			JSON.stringify(
				suggested.features.map((f) => [f.id, featurePlacement(f), f.name, f.description])
			)
	);
	const nowFeatures = $derived(
		configuration.features.filter((item) => featurePlacement(item) === 'now')
	);
	const laterFeatures = $derived(
		configuration.features.filter((item) => featurePlacement(item) === 'later')
	);
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);
	$effect(() => {
		if (!activeId)
			activeId = initialConceptId || workshop.selectedConceptId || portfolio.concepts[0].id;
	});
	function choose(id: string) {
		featurePage = 0;
		customOpen = false;
		conceptsOpen = false;
		editingId = '';
		activeId = id;
		onConceptChange(id);
		pending = null;
		restorePending = false;
		message = 'Your configuration for each concept is saved as you edit.';
	}
	function place(feature: WorkshopFeature, placement: FeaturePlacement, confirmed = false) {
		const result = placeWorkshopFeature(workshop, concept.id, feature.id, placement, confirmed);
		if (result.blockedBy.length) {
			message = `Move ${result.blockedBy.map((item) => item.name).join(', ')} out of Build now first. Those features still need ${feature.name}.`;
			onChange(workshop, 'blocked');
			return;
		}
		if (result.requiresConfirmation.length) {
			pending = { feature, dependencies: result.requiresConfirmation };
			return;
		}
		pending = null;
		message = `${feature.name}: ${placements.find((item) => item.value === placement)!.label}. The final estimate will use your chosen build.`;
		onChange(result.state, 'changed');
	}
	function custom(event: SubmitEvent) {
		event.preventDefault();
		const next = addCustomFeature(workshop, concept.id, {
			id: `${concept.id}:custom:${crypto.randomUUID().slice(0, 8)}`,
			name: customName,
			description: customDescription,
			dependencies: customDependencies
		});
		if (next === workshop) {
			message = 'Use a unique feature name and describe what it should do.';
			return;
		}
		onChange(next, 'changed');
		message = `Added ${customName} to Build now. Its feasibility and cost will be checked during finalization.`;
		customName = '';
		customDescription = '';
		customDependencies = [];
	}
	function saveDescription(event: SubmitEvent) {
		event.preventDefault();
		if (!editedDescription.trim()) return;
		onChange(editFeatureDescription(workshop, concept.id, editingId, editedDescription), 'changed');
		editingId = '';
		message = 'Saved feature details. Finalization will check this revised description.';
	}
	function remove(feature: WorkshopFeature) {
		const result = removeCustomFeature(workshop, concept.id, feature.id);
		if (result.blockedBy.length) {
			message = `Remove the dependency from ${result.blockedBy.map((item) => item.name).join(', ')} first.`;
			return;
		}
		onChange(result.state, 'changed');
		message = `Removed ${feature.name}.`;
	}
	function restore() {
		onChange(restoreSuggestedBuild(workshop, concept), 'changed');
		restorePending = false;
		message = 'Restored the suggested first version for this concept.';
	}
	function finalize() {
		if (configuration.features.some((item) => item.tier === 'core' && !item.included)) {
			message =
				'Keep the core capabilities in Build now so the first version still solves the problem.';
			return;
		}
		const next = confirmWorkshopConcept(workshop, concept.id);
		if (next === workshop) {
			message = 'Include a usable feature set and its dependencies before finalizing.';
			return;
		}
		onChange(next, 'confirmed');
		onContinue();
	}
</script>

<section class="rpg-workshop" aria-labelledby="workshop-title">
	<header>
		<div>
			<small>PURL OS / PROJECT WORKSPACE</small>
			<h2 id="workshop-title">What belongs in the first version?</h2>
		</div>
		<button type="button" onclick={onBack}>Back to comparison</button>
	</header>
	<button class="concept-toggle" onclick={() => (conceptsOpen = !conceptsOpen)}
		>{conceptsOpen ? 'Close concept choices' : `Change concept · ${concept.name}`}</button
	>
	<nav aria-label="Concept drafts" class:expanded={conceptsOpen}>
		{#each portfolio.concepts as item (item.id)}<button
				type="button"
				aria-pressed={item.id === concept.id}
				onclick={() => choose(item.id)}>{item.name}</button
			>{/each}
	</nav>
	<div class="workshop-body" class:summary-open={summaryOpen}>
		<aside>
			<small>{concept.isStretch ? 'OVER-BUDGET EXPERIMENT' : 'SELECTED DIRECTION'}</small>
			<h3>{concept.name}</h3>
			<p>{concept.pitch}</p>
			<dl>
				<div>
					<dt>Suggested build estimate</dt>
					<dd>
						{money(concept.prototypeBudget.minimumUsd)}–{money(concept.prototypeBudget.maximumUsd)}
					</dd>
				</div>
				<div>
					<dt>Initial timeline</dt>
					<dd>{concept.prototypeTimeline}</dd>
				</div>
			</dl>
			<p class="estimate-status">
				{changed
					? 'Scope changed. Cost and timeline await recalculation.'
					: 'Provisional estimate for the suggested build.'}
			</p>
			<p><b>{nowFeatures.length}</b> Build now · <b>{laterFeatures.length}</b> Later</p>
			<p>
				Later becomes the roadmap and is excluded from the prototype estimate. Leave out removes a
				feature from the final plan.
			</p>
			<button type="button" disabled={!changed} onclick={() => (restorePending = true)}
				>Restore suggested build</button
			>
			{#if restorePending}<div class="decision" role="alert">
					<p>This restores this concept's defaults and removes its custom features.</p>
					<button type="button" onclick={restore}>Restore this draft</button><button
						type="button"
						onclick={() => (restorePending = false)}>Keep my changes</button
					>
				</div>{/if}
		</aside>
		<div class="feature-editor">
			<nav class="feature-pages" aria-label="Feature pages">
				<button
					disabled={currentFeaturePage === 0 || !!editingId || !!pending}
					onclick={() => (featurePage = currentFeaturePage - 1)}>←</button
				><span>Feature {currentFeaturePage + 1}/{configuration.features.length}</span><button
					disabled={currentFeaturePage === configuration.features.length - 1 ||
						!!editingId ||
						!!pending}
					onclick={() => (featurePage = currentFeaturePage + 1)}>→</button
				><button class="summary-toggle" onclick={() => (summaryOpen = !summaryOpen)}
					>{summaryOpen ? 'Back to features' : 'Build summary'}</button
				>
			</nav>
			{#if pending}<div class="decision" role="alert">
					<h3>These features belong together</h3>
					<p>
						{pending.feature.name} also needs {pending.dependencies
							.map((item) => item.name)
							.join(', ')} in Build now.
					</p>
					<button type="button" onclick={() => place(pending!.feature, 'now', true)}
						>Include required features</button
					><button type="button" onclick={() => (pending = null)}>Cancel</button>
				</div>{/if}
			{#each configuration.features.slice(currentFeaturePage, currentFeaturePage + 1) as feature (feature.id)}
				<article class="feature-card" data-placement={featurePlacement(feature)}>
					<div class="feature-heading">
						<h3>{feature.name}</h3>
						<small
							>{feature.dependencyOnly ? 'SUPPORTING COMPONENT' : feature.tier.toUpperCase()}</small
						>
					</div>
					<PagedText text={feature.description} length={100} />
					{#if editingId === feature.id}
						<form onsubmit={saveDescription}>
							{#if feature.scopeImpact}<p class="scope-impact">{feature.scopeImpact}</p>{/if}
							{#if feature.dependencies.length}<p class="dependencies">
									Needs: {feature.dependencies
										.map(
											(id) =>
												configuration.features.find((item) => item.id === id)?.name ??
												'Unavailable dependency'
										)
										.join(', ')}
								</p>{/if}
							<label
								>What should {feature.name} do?<textarea
									required
									maxlength="500"
									rows="4"
									bind:value={editedDescription}></textarea></label
							>
							<div>
								<button type="submit">Save details</button>
								<button type="button" onclick={() => (editingId = '')}>Cancel edit</button>
							</div>
						</form>
					{:else}
						<button
							type="button"
							aria-label={`Edit details for ${feature.name}`}
							onclick={() => {
								editingId = feature.id;
								editedDescription = feature.description;
							}}>Details & dependencies</button
						>
					{/if}

					<div class="placements" role="group" aria-label={`Schedule ${feature.name}`}>
						{#each placements as placement (placement.value)}<button
								type="button"
								aria-pressed={featurePlacement(feature) === placement.value}
								onclick={() => place(feature, placement.value)}>{placement.label}</button
							>{/each}
						{#if feature.isCustom}<button
								class="delete-feature"
								type="button"
								aria-label={`Delete ${feature.name}`}
								onclick={() => remove(feature)}>Delete</button
							>{/if}
					</div>
				</article>
			{/each}
			<details class="custom-feature" bind:open={customOpen}>
				<summary>Add a feature of your own</summary>
				<form onsubmit={custom}>
					<label>Feature name<input required maxlength="100" bind:value={customName} /></label
					><label
						>What should it do, and for whom?<textarea
							required
							maxlength="500"
							rows="3"
							bind:value={customDescription}></textarea></label
					>
					<fieldset>
						<legend>Does it need an existing capability?</legend>
						<p>
							Choose any it relies on. Unsure is fine; finalization will check the dependencies.
						</p>
						{#each configuration.features as feature (feature.id)}<label class="dependency-check"
								><input
									type="checkbox"
									value={feature.id}
									bind:group={customDependencies}
								/>{feature.name}</label
							>{/each}
					</fieldset>
					<button type="submit">Add to Build now</button>
				</form>
			</details>
		</div>
	</div>
	<footer>
		<div>
			<p role="status">{message}</p>
			<small
				>Finalization checks the evidence, recalculates this scope, and prepares your final plan.</small
			>
		</div>
		<button
			class="finalize"
			type="button"
			disabled={!nowFeatures.length || !!pending || !!editingId}
			onclick={finalize}>Finalize this project</button
		>
	</footer>
</section>

<style>
	.concept-toggle {
		display: none;
	}
	.feature-card form {
		position: fixed;
		inset: 100px 5vw 25px;
		z-index: 46;
		overflow: auto;
		padding: 20px;
		background: #f3e7cc;
		box-shadow: 0 0 0 100vmax #29221e88;
	}

	.feature-pages {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 0 0 10px;
	}
	.summary-toggle {
		display: none;
	}
	.custom-feature[open] {
		position: fixed;
		inset: 100px 5vw 25px;
		z-index: 45;
		overflow: auto;
		background: #f3e7cc;
		padding: 20px;
		box-shadow: 0 0 0 100vmax #29221e88;
	}
	@media (max-width: 600px) {
		.summary-toggle {
			display: block;
		}
		.workshop-body:not(.summary-open) > aside {
			display: none;
		}
		.workshop-body.summary-open .feature-card,
		.workshop-body.summary-open .custom-feature {
			display: none;
		}
	}

	.rpg-workshop {
		position: absolute;
		inset: 85px 28px 28px;
		display: flex;
		flex-direction: column;
		min-height: 0;
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		background: #ede6d5;
		color: #403e35;
		box-shadow: 8px 8px var(--game-shadow);
		font: 24px/1.25 var(--game-font);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 14px 18px;
		background: #bbcba9;
		border-bottom: 2px solid #889878;
	}
	h2 {
		font: 24px/1.25 var(--game-font);
		margin: 4px 0;
	}
	small {
		font-size: 11px;
	}
	h3 {
		font: 24px/1.25 var(--game-font);
		margin: 0;
	}
	p {
		margin: 8px 0 12px;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		padding: 8px;
		gap: 8px;
		background: #d5d0bd;
		border-bottom: 2px solid #a29b88;
	}
	button {
		min-height: 38px;
		padding: 7px 12px;
		border: 2px solid #8c8068;
		box-shadow:
			inset 2px 2px #fff4d9,
			2px 2px #b3a387;
		background: #f2edda;
		color: #403e35;
		font: 24px/1.25 var(--game-font);
	}
	button:hover:not(:disabled) {
		background: #e7edce;
	}
	button:active:not(:disabled) {
		border-style: inset;
		transform: translateY(2px);
		box-shadow: inset 2px 2px #a99b80;
	}
	button[aria-pressed='true'] {
		background: #bdcf9f;
		border-style: inset;
		font-weight: 600;
	}
	button:disabled {
		opacity: 0.5;
	}
	:is(button, input, textarea, summary):focus-visible {
		outline: 3px solid #74608e;
		outline-offset: 3px;
	}
	.workshop-body {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr);
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	aside {
		padding: 20px;
		background: #e0ddcb;
		border-right: 2px solid #b2ab97;
		overflow: auto;
	}
	aside h3 {
		margin: 6px 0 12px;
	}
	dl div {
		margin: 14px 0;
	}
	dt {
		font-size: 12px;
		color: #68604f;
	}
	dd {
		margin: 4px 0;
		font-weight: 600;
	}
	.estimate-status {
		border-left: 4px solid #ad8952;
		padding-left: 10px;
		font-size: 12px;
	}
	.feature-editor {
		padding: 16px;
		overflow: visible;
		min-width: 0;
	}
	.feature-card {
		padding: 16px;
		margin-bottom: 12px;
		background: #fff9e9;
		border: 2px solid #a99b80;
		box-shadow: 4px 4px #c8bba1;
		border-left: 6px solid #839965;
	}
	.feature-card[data-placement='later'] {
		border-left-color: #ba944c;
	}
	.feature-card[data-placement='out'] {
		border-left-color: #8b8690;
		background: #e7e3dc;
	}
	.feature-heading {
		display: flex;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
	}
	.scope-impact,
	.dependencies {
		font-size: 12px;
		color: #70634e;
	}
	.placements {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.delete-feature {
		margin-left: auto;
	}
	.decision {
		padding: 14px;
		background: #f3e3bb;
		border: 2px solid #a58d5e;
		margin-bottom: 16px;
	}
	.decision button {
		margin: 4px;
	}
	.custom-feature {
		border: 2px dashed #a29981;
		padding: 14px;
	}
	summary {
		font-weight: 600;
	}
	form {
		display: grid;
		gap: 12px;
		margin-top: 16px;
	}
	form label {
		display: grid;
		gap: 6px;
	}
	input,
	textarea {
		width: 100%;
		min-width: 0;
		padding: 10px;
		background: #fff9e9;
		border: 2px inset #b9ae95;
		color: #403e35;
		font: 24px/1.25 var(--game-font);
		box-sizing: border-box;
	}
	fieldset {
		border: 1px solid #b0a38c;
	}
	.dependency-check {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dependency-check input {
		width: 20px;
		height: 20px;
		accent-color: #6f894e;
	}
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding: 12px 18px;
		background: #dce2cb;
		border-top: 2px solid #9aaa80;
	}
	footer p {
		margin: 0 0 4px;
		font-size: 12px;
	}
	.finalize {
		background: #bbcf97;
		font-weight: 600;
		flex-shrink: 0;
	}
	@media (max-width: 900px) {
		.workshop-body {
			grid-template-columns: 220px minmax(0, 1fr);
		}
		aside {
			padding: 14px;
		}
	}
	@media (max-width: 600px) {
		.rpg-workshop {
			inset: 85px 10px 12px;
		}
		header {
			padding: 10px;
			gap: 8px;
		}
		h2 {
			font-size: 16px;
		}
		.workshop-body {
			display: block;
			overflow: auto;
		}
		aside {
			border-right: 0;
			border-bottom: 2px solid #b2ab97;
		}
		.feature-editor {
			overflow: visible;
			padding: 10px;
		}
		footer {
			flex-direction: column;
			align-items: stretch;
			padding: 10px;
		}
		nav button {
			flex: 1;
			font-size: 11px;
		}
		.feature-heading {
			align-items: start;
		}
	}

	@media (max-width: 600px) {
		.rpg-workshop {
			inset: 70px 8px 8px;
		}
		.rpg-workshop > header {
			padding: 8px;
			min-height: 0;
		}
		.rpg-workshop > header small {
			display: none;
		}
		.rpg-workshop > header h2 {
			font: 16px/1.2 var(--game-font);
			margin: 0;
		}
		.rpg-workshop > header button {
			font: 14px/1.2 var(--game-font);
			padding: 6px;
			max-width: 110px;
		}
		.concept-toggle {
			display: block;
			font: 16px/1.2 var(--game-font);
			padding: 6px;
			text-align: left;
		}
		.rpg-workshop > nav:not(.expanded) {
			display: none;
		}
		.workshop-body {
			overflow: visible;
			min-height: 0;
			flex: 1;
		}
		.workshop-body.summary-open {
			overflow: auto;
		}
		.feature-editor {
			padding: 8px;
		}
		.feature-pages {
			display: grid;
			grid-template-columns: 36px 1fr 36px;
			gap: 4px;
			padding: 0 0 6px;
		}
		.feature-pages > span {
			font: 18px/1.2 var(--game-font);
			text-align: center;
		}
		.feature-pages button {
			font: 16px/1.2 var(--game-font);
			min-width: 0;
			padding: 4px;
		}
		.feature-pages .summary-toggle {
			grid-column: 1/-1;
			min-height: 26px;
		}
		.feature-card {
			padding: 8px;
			margin-bottom: 6px;
		}
		.feature-heading h3 {
			font: 20px/1.2 var(--game-font);
			margin: 0;
		}
		.feature-heading small {
			font-size: 10px;
		}
		.feature-card > button {
			font: 16px/1.2 var(--game-font);
			padding: 5px;
		}
		.placements {
			gap: 4px;
			margin-top: 8px;
		}
		.placements button {
			font: 16px/1.2 var(--game-font);
			padding: 5px;
		}
		.custom-feature {
			padding: 6px;
			font: 16px/1.2 var(--game-font);
		}
		footer {
			padding: 8px;
			gap: 6px;
		}
		footer small {
			display: none;
		}
		footer p {
			font: 14px/1.2 var(--game-font);
			margin: 0;
		}
		footer button {
			font: 20px/1.2 var(--game-font);
			padding: 7px;
		}
	}
</style>
