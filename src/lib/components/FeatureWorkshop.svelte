<script lang="ts">
	import type { ConceptPortfolio } from '$lib/concepts';
	import {
		FEATURE_TIERS,
		addCustomFeature,
		confirmWorkshopConcept,
		removeCustomFeature,
		toggleWorkshopFeature,
		type FeatureTier,
		type FeatureWorkshopState,
		type WorkshopFeature
	} from '$lib/feature-workshop';

	let {
		portfolio,
		workshop,
		onChange
	}: {
		portfolio: ConceptPortfolio;
		workshop: FeatureWorkshopState;
		onChange: (state: FeatureWorkshopState, event: 'changed' | 'blocked' | 'confirmed') => void;
	} = $props();

	let activeConceptId = $state('');
	let pendingFeature = $state<WorkshopFeature | null>(null);
	let pendingDependencies = $state<WorkshopFeature[]>([]);
	let customName = $state('');
	let customDescription = $state('');
	let customDependencies = $state<string[]>([]);
	let message = $state('');

	const activeConcept = $derived(
		portfolio.concepts.find((concept) => concept.id === activeConceptId) ?? portfolio.concepts[0]
	);
	const activeConfiguration = $derived(
		workshop.configurations.find(
			(configuration) => configuration.conceptId === activeConcept?.id
		) ?? null
	);
	const includedCount = $derived(
		activeConfiguration?.features.filter((feature) => feature.included).length ?? 0
	);
	const tierLabels: Record<FeatureTier, string> = {
		core: 'Core spell',
		recommended: 'Sage recommended',
		optional: 'Optional nonsense',
		custom: 'Your forbidden additions'
	};

	$effect(() => {
		if (!activeConceptId || !portfolio.concepts.some((concept) => concept.id === activeConceptId)) {
			activeConceptId = workshop.selectedConceptId ?? portfolio.concepts[0]?.id ?? '';
		}
	});

	function changeFeature(feature: WorkshopFeature, included: boolean, checkbox: HTMLInputElement) {
		if (!activeConcept) return;
		const result = toggleWorkshopFeature(workshop, activeConcept.id, feature.id, included);
		if (result.blockedBy.length) {
			checkbox.checked = feature.included;
			message = `Remove ${joinNames(result.blockedBy)} first. ${feature.name} is holding it up.`;
			onChange(workshop, 'blocked');
			return;
		}
		if (result.requiresConfirmation.length) {
			checkbox.checked = feature.included;
			pendingFeature = feature;
			pendingDependencies = result.requiresConfirmation;
			message = '';
			return;
		}
		message = included ? `${feature.name} added.` : `${feature.name} removed.`;
		onChange(result.state, 'changed');
	}

	function confirmDependencies() {
		if (!activeConcept || !pendingFeature) return;
		const result = toggleWorkshopFeature(workshop, activeConcept.id, pendingFeature.id, true, true);
		message = `${pendingFeature.name} and ${joinNames(pendingDependencies)} were added.`;
		pendingFeature = null;
		pendingDependencies = [];
		onChange(result.state, 'changed');
	}

	function cancelDependencies() {
		pendingFeature = null;
		pendingDependencies = [];
		message = 'Dependency ritual cancelled. Nothing changed.';
	}

	function toggleCustomDependency(id: string, checked: boolean) {
		customDependencies = checked
			? Array.from(new Set([...customDependencies, id]))
			: customDependencies.filter((dependency) => dependency !== id);
	}

	function submitCustomFeature(event: SubmitEvent) {
		event.preventDefault();
		if (!activeConcept || !customName.trim() || !customDescription.trim()) {
			message = 'The custom feature needs a name and a short description.';
			return;
		}
		const next = addCustomFeature(workshop, activeConcept.id, {
			id: `${activeConcept.id}:custom:${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`,
			name: customName,
			description: customDescription,
			dependencies: customDependencies
		});
		if (next === workshop) {
			message = 'That feature already exists, or one of its dependencies escaped.';
			return;
		}
		message = `${customName.trim()} has been stapled to the prophecy.`;
		customName = '';
		customDescription = '';
		customDependencies = [];
		onChange(next, 'changed');
	}

	function deleteCustomFeature(feature: WorkshopFeature) {
		if (!activeConcept) return;
		const result = removeCustomFeature(workshop, activeConcept.id, feature.id);
		if (result.blockedBy.length) {
			message = `Remove ${joinNames(result.blockedBy)} before deleting ${feature.name}.`;
			onChange(workshop, 'blocked');
			return;
		}
		message = `${feature.name} was fed to the recycle bin.`;
		onChange(result.state, 'changed');
	}

	function confirmSelection() {
		if (!activeConcept) return;
		const next = confirmWorkshopConcept(workshop, activeConcept.id);
		if (next === workshop) {
			message = 'Keep at least one feature before sealing this project.';
			return;
		}
		message = `${activeConcept.name} is now the chosen prophecy.`;
		onChange(next, 'confirmed');
	}

	function dependencyNames(feature: WorkshopFeature): string[] {
		return feature.dependencies
			.map((id) => activeConfiguration?.features.find((candidate) => candidate.id === id)?.name)
			.filter((name): name is string => !!name);
	}

	function joinNames(features: WorkshopFeature[]): string {
		return features.map((feature) => feature.name).join(' and ');
	}
</script>

<section class="feature-workshop" aria-labelledby="workshop-title">
	<header class="workshop-titlebar">
		<div>
			<p>ROOM 06 / FEATURE WORKSHOP</p>
			<h2 id="workshop-title">Tamper with the prophecy.</h2>
			<span>Changes save locally. Estimates stay frozen until the final generation pass.</span>
		</div>
		<div class="workshop-status" class:sealed={workshop.status === 'confirmed'}>
			<b>{workshop.status === 'confirmed' ? 'SEALED' : 'UNSEALED'}</b>
			<span>{workshop.status === 'confirmed' ? 'one future chosen' : 'pick your damage'}</span>
		</div>
	</header>

	<nav class="project-cartridges" aria-label="Projects to configure">
		{#each portfolio.concepts as concept, index (concept.id)}
			{@const configuration = workshop.configurations.find((item) => item.conceptId === concept.id)}
			<button
				type="button"
				class:active={concept.id === activeConcept?.id}
				class:selected={concept.id === workshop.selectedConceptId}
				onclick={() => {
					activeConceptId = concept.id;
					pendingFeature = null;
					pendingDependencies = [];
					message = '';
				}}
			>
				<small>PROPHECY 0{index + 1}</small>
				<strong>{concept.name}</strong>
				<span>{configuration?.features.filter((feature) => feature.included).length ?? 0} on</span>
				{#if concept.id === workshop.selectedConceptId}<i>CHOSEN</i>{/if}
			</button>
		{/each}
	</nav>

	{#if activeConcept && activeConfiguration}
		<div class="workshop-bench">
			<aside class="project-label">
				<p>{activeConcept.isStretch ? 'FORBIDDEN BUILD' : 'CURRENT SPECIMEN'}</p>
				<h3>{activeConcept.name}</h3>
				<span>{activeConcept.pitch}</span>
				<div><b>{includedCount}</b> of {activeConfiguration.features.length} features active</div>
				<p class="no-merge">
					One project only. The fusion lever has been removed for legal reasons.
				</p>
			</aside>

			<div class="feature-rack">
				{#each FEATURE_TIERS as tier (tier)}
					{@const features = activeConfiguration.features.filter(
						(feature) => feature.tier === tier
					)}
					{#if features.length}
						<section class={`feature-tier tier-${tier}`}>
							<header><span>{tierLabels[tier]}</span><i>{features.length}</i></header>
							{#each features as feature (feature.id)}
								<div class="feature-card" class:included={feature.included}>
									<label>
										<input
											type="checkbox"
											checked={feature.included}
											onchange={(event) =>
												changeFeature(feature, event.currentTarget.checked, event.currentTarget)}
										/>
										<span class="fake-toggle" aria-hidden="true"></span>
										<span class="feature-copy">
											<strong>{feature.name}</strong>
											<small>{feature.description}</small>
											{#if dependencyNames(feature).length}
												<em>Needs {dependencyNames(feature).join(' + ')}</em>
											{/if}
										</span>
									</label>
									{#if feature.isCustom}
										<button type="button" onclick={() => deleteCustomFeature(feature)}
											>delete</button
										>
									{/if}
								</div>
							{/each}
						</section>
					{/if}
				{/each}

				{#if pendingFeature}
					<div class="dependency-warning" role="alert">
						<p>DEPENDENCY GOBLIN OBJECTS</p>
						<strong>{pendingFeature.name} also needs {joinNames(pendingDependencies)}.</strong>
						<span>Nothing has changed yet. Add the required feature too?</span>
						<div>
							<button type="button" onclick={cancelDependencies}>No, flee</button>
							<button class="confirm-dependency" type="button" onclick={confirmDependencies}
								>Add both</button
							>
						</div>
					</div>
				{/if}

				<form class="custom-feature-form" onsubmit={submitCustomFeature}>
					<header>
						<span>NEW_FEATURE.WIZ</span>
						<strong>Invent your own feature</strong>
					</header>
					<div class="custom-fields">
						<label>
							<span>Feature name</span>
							<input
								bind:value={customName}
								maxlength="100"
								placeholder="Extremely necessary button"
							/>
						</label>
						<label>
							<span>What does it do?</span>
							<textarea
								bind:value={customDescription}
								maxlength="280"
								rows="2"
								placeholder="One short, useful description"></textarea>
						</label>
					</div>
					<details>
						<summary>Does it depend on anything?</summary>
						<p class="dependency-note">
							Checked dependencies will turn on when you add the feature. No surprise checkboxes.
						</p>
						<div class="dependency-picker">
							{#each activeConfiguration.features as feature (feature.id)}
								<label>
									<input
										type="checkbox"
										checked={customDependencies.includes(feature.id)}
										onchange={(event) =>
											toggleCustomDependency(feature.id, event.currentTarget.checked)}
									/>
									{feature.name}
								</label>
							{/each}
						</div>
					</details>
					<button class="add-custom" type="submit">Staple feature to project</button>
				</form>
			</div>
		</div>

		{#if message}<p class="workshop-message" role="status">{message}</p>{/if}

		<footer class="selection-desk">
			<div>
				<span>ESTIMATE FREEZE</span>
				<p>Costs, timing, requirements, and competition have not changed yet.</p>
			</div>
			<button
				type="button"
				class:confirmed={workshop.status === 'confirmed' &&
					workshop.selectedConceptId === activeConcept.id}
				onclick={confirmSelection}
			>
				{workshop.status === 'confirmed' && workshop.selectedConceptId === activeConcept.id
					? '✓ This prophecy is sealed'
					: `Choose ${activeConcept.name}`}
			</button>
		</footer>
	{/if}
</section>

<style>
	.feature-workshop {
		margin-top: 30px;
		border: 5px ridge #e2bb72;
		background: repeating-linear-gradient(0deg, #151024 0 2px, #110c1d 2px 4px), #110c1d;
		box-shadow:
			14px 14px #040207,
			inset 0 0 45px #c68e3520;
		color: #f7ecdb;
	}
	.workshop-titlebar {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		padding: 22px;
		border-bottom: 3px double #765c42;
		background: linear-gradient(90deg, #3c1539, #15142f 65%, #122838);
	}
	.workshop-titlebar p,
	.project-label > p,
	.custom-feature-form header span,
	.selection-desk span {
		margin: 0;
		color: #8fefff;
		font:
			700 10px/1.2 'Courier New',
			monospace;
		letter-spacing: 0.12em;
	}
	.workshop-titlebar h2 {
		margin: 4px 0;
		color: #ffe095;
		font:
			700 clamp(26px, 4vw, 42px)/1 Georgia,
			serif;
	}
	.workshop-titlebar > div > span {
		color: #cfc1d8;
		font-size: 13px;
	}
	.workshop-status {
		align-self: center;
		min-width: 115px;
		padding: 9px;
		border: 3px outset #786985;
		background: #090711;
		text-align: center;
		transform: rotate(1deg);
	}
	.workshop-status b,
	.workshop-status span {
		display: block;
	}
	.workshop-status b {
		color: #ff8dca;
		font:
			800 15px 'Courier New',
			monospace;
	}
	.workshop-status span {
		font-size: 10px;
	}
	.workshop-status.sealed {
		border-color: #83f3b4;
	}
	.workshop-status.sealed b {
		color: #83f3b4;
	}
	.project-cartridges {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 6px;
		padding: 10px;
		background: #05040b;
	}
	.project-cartridges button {
		position: relative;
		min-width: 0;
		padding: 11px;
		border: 3px outset #51465f;
		background: #191328;
		color: #c9bdd4;
		text-align: left;
		cursor: pointer;
	}
	.project-cartridges button.active {
		border-color: #ffe08c;
		background: #4c2948;
		color: white;
	}
	.project-cartridges button.selected {
		box-shadow: inset 0 0 0 2px #6ff0b1;
	}
	.project-cartridges small,
	.project-cartridges strong,
	.project-cartridges span {
		display: block;
	}
	.project-cartridges small,
	.project-cartridges span {
		font:
			9px 'Courier New',
			monospace;
	}
	.project-cartridges strong {
		overflow: hidden;
		margin: 4px 0;
		color: #ffe9ae;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.project-cartridges i {
		position: absolute;
		top: -6px;
		right: -4px;
		padding: 2px 4px;
		background: #20744b;
		color: white;
		font:
			700 8px 'Courier New',
			monospace;
	}
	.workshop-bench {
		display: grid;
		grid-template-columns: minmax(190px, 0.3fr) minmax(0, 1fr);
		gap: 18px;
		padding: 20px;
	}
	.project-label {
		align-self: start;
		padding: 18px;
		border: 4px double #876d4e;
		background: #241524;
		box-shadow: 7px 7px #050309;
		transform: rotate(-0.4deg);
	}
	.project-label h3 {
		margin: 6px 0;
		color: #ffe19a;
		font:
			700 25px/1 Georgia,
			serif;
	}
	.project-label > span {
		color: #d8cad7;
		font-size: 13px;
	}
	.project-label > div {
		margin-top: 18px;
		padding: 9px;
		border: 1px dashed #a57c5f;
		background: #0c0910;
		font:
			12px 'Courier New',
			monospace;
	}
	.project-label > div b {
		color: #81efff;
		font-size: 24px;
	}
	.project-label .no-merge {
		margin-top: 16px;
		color: #9e90a4;
		font:
			10px/1.45 'Courier New',
			monospace;
		letter-spacing: 0;
	}
	.feature-rack {
		display: grid;
		gap: 12px;
		min-width: 0;
	}
	.feature-tier {
		border: 2px solid #4e4058;
		background: #08060dd9;
	}
	.feature-tier > header {
		display: flex;
		justify-content: space-between;
		padding: 7px 10px;
		border-bottom: 1px solid #4e4058;
		background: #24172f;
		color: #93ebff;
		font:
			700 10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.tier-core > header {
		background: #233747;
	}
	.tier-recommended > header {
		background: #46381f;
		color: #ffe08b;
	}
	.tier-custom > header {
		background: #492044;
		color: #ffa6e6;
	}
	.feature-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-top: 1px dotted #3e3448;
		opacity: 0.62;
	}
	.feature-card:first-of-type {
		border-top: 0;
	}
	.feature-card.included {
		background: #172223;
		opacity: 1;
	}
	.feature-card > label {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px;
		align-items: center;
		width: 100%;
		cursor: pointer;
	}
	.feature-card input {
		position: absolute;
		opacity: 0;
	}
	.fake-toggle {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border: 3px inset #74677b;
		background: #09070c;
	}
	.feature-card input:checked + .fake-toggle {
		border-style: outset;
		background: #258055;
	}
	.feature-card input:checked + .fake-toggle::after {
		content: '✓';
		color: white;
		font-weight: 900;
	}
	.feature-card input:focus-visible + .fake-toggle {
		outline: 2px solid white;
		outline-offset: 2px;
	}
	.feature-copy strong,
	.feature-copy small,
	.feature-copy em {
		display: block;
	}
	.feature-copy strong {
		color: #fff0c7;
	}
	.feature-copy small {
		margin-top: 3px;
		color: #b9adbd;
	}
	.feature-copy em {
		margin-top: 4px;
		color: #86e9ff;
		font:
			9px 'Courier New',
			monospace;
	}
	.feature-card > button {
		border: 1px solid #8f4769;
		background: #280d1b;
		color: #ff9fc8;
		font:
			9px 'Courier New',
			monospace;
		cursor: pointer;
	}
	.dependency-warning {
		padding: 14px;
		border: 4px ridge #ffbd55;
		background: #39240d;
		box-shadow: 6px 6px #050307;
	}
	.dependency-warning p {
		margin: 0;
		color: #ffdd84;
		font:
			800 11px 'Courier New',
			monospace;
	}
	.dependency-warning strong,
	.dependency-warning span {
		display: block;
		margin-top: 5px;
	}
	.dependency-warning > div {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.dependency-warning button,
	.add-custom {
		padding: 8px 10px;
		border: 2px outset #8d7c70;
		background: #171018;
		color: white;
		cursor: pointer;
	}
	.dependency-warning .confirm-dependency {
		border-color: #ffe08d;
		background: #79501c;
	}
	.custom-feature-form {
		padding: 14px;
		border: 3px dashed #8f5a92;
		background: #190d1c;
	}
	.custom-feature-form header strong,
	.custom-feature-form header span {
		display: block;
	}
	.custom-feature-form header strong {
		margin-top: 3px;
		color: #ffafe7;
		font:
			700 19px Georgia,
			serif;
	}
	.custom-fields {
		display: grid;
		grid-template-columns: 0.8fr 1.2fr;
		gap: 10px;
		margin-top: 12px;
	}
	.custom-fields label > span {
		display: block;
		margin-bottom: 4px;
		color: #cbb8ce;
		font-size: 11px;
	}
	.custom-fields input,
	.custom-fields textarea {
		box-sizing: border-box;
		width: 100%;
		border: 2px inset #88758d;
		padding: 8px;
		background: #050307;
		color: white;
		font:
			12px 'Courier New',
			monospace;
	}
	.custom-feature-form details {
		margin: 10px 0;
		border: 0;
	}
	.custom-feature-form summary {
		padding: 0;
		font-size: 11px;
	}
	.dependency-picker {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 5px;
		margin-top: 8px;
		font-size: 10px;
	}
	.dependency-note {
		margin: 7px 0 0;
		color: #9fe8f3;
		font:
			9px/1.4 'Courier New',
			monospace;
	}
	.dependency-picker label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.add-custom {
		border-color: #f398d8;
		background: #6c2258;
	}
	.workshop-message {
		margin: 0 20px 16px;
		padding: 8px 10px;
		border-left: 4px solid #87e9ff;
		background: #0a1015;
		color: #dffaff;
		font:
			11px 'Courier New',
			monospace;
	}
	.selection-desk {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 18px;
		padding: 17px 20px;
		border-top: 4px double #725e45;
		background: #09070e;
	}
	.selection-desk p {
		margin: 4px 0 0;
		color: #b9aebe;
		font-size: 12px;
	}
	.selection-desk button {
		max-width: 340px;
		border: 4px outset #ffd171;
		padding: 11px 15px;
		background: #8f2b67;
		color: white;
		font-weight: 900;
		cursor: pointer;
		box-shadow: 5px 5px #030205;
	}
	.selection-desk button.confirmed {
		border-color: #79ecad;
		background: #236a4a;
	}
	@media (max-width: 760px) {
		.workshop-titlebar,
		.selection-desk {
			align-items: stretch;
			flex-direction: column;
		}
		.project-cartridges {
			grid-template-columns: 1fr 1fr;
		}
		.workshop-bench,
		.custom-fields {
			grid-template-columns: 1fr;
		}
		.project-label {
			transform: none;
		}
		.selection-desk button {
			max-width: none;
		}
	}
</style>
