<script lang="ts">
	import TagPicker from './TagPicker.svelte';
	import BudgetMeter from './BudgetMeter.svelte';
	import type { ProjectPreferences, ProjectConstraints } from '$lib/project-state';
	let {
		preferences,
		page,
		calm,
		constraintFields,
		error,
		onAdd,
		onRemove,
		onConstraint,
		onInnovation,
		onBudget,
		onProduction,
		onBack,
		onNext,
		onFinish
	}: {
		preferences: ProjectPreferences;
		page: number;
		calm: boolean;
		constraintFields: {
			key: keyof ProjectConstraints;
			label: string;
			placeholder: string;
			wide?: boolean;
		}[];
		error: string;
		onAdd: (kind: 'technology' | 'industry', value: string) => void;
		onRemove: (kind: 'technology' | 'industry', value: string) => void;
		onConstraint: (key: keyof ProjectConstraints, value: string) => void;
		onInnovation: (value: number) => void;
		onBudget: (kind: 'prototype' | 'production', value: number | null) => void;
		onProduction: (value: boolean) => void;
		onBack: () => void;
		onNext: () => void;
		onFinish: () => void;
	} = $props();
	const exclusions = $derived(
		(preferences.constraints.excludedTechnologies ?? '')
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);
	const technology = [
		'TypeScript',
		'Python',
		'JavaScript',
		'Arduino',
		'Raspberry Pi',
		'Web app',
		'Mobile app',
		'3D printing',
		'Bluetooth',
		'OpenStreetMap',
		'Computer vision',
		'Robotics'
	];
	const titles = [
		'Tools',
		'Exclusions · optional',
		'Research topics',
		'Originality',
		'Prototype budget',
		'Production · optional'
	];
	const originality = ['Proven', 'A fresh twist', 'Inventive', 'Unusual', 'Strange but buildable'];
</script>

<div class="preference-pages">
	<strong class="page-label"
		>{titles[page] ?? `Practical limits · ${page - 5} of 5 · optional`}</strong
	>
	<div class="page-content">
		{#if page === 0}
			<TagPicker
				id="preferred-technologies"
				label="Preferred technology"
				selected={preferences.technologyTags}
				suggestions={preferences.suggestedTechnologyTags ?? []}
				dismissed={preferences.dismissedTechnologyTags ?? []}
				catalog={technology}
				onAdd={(tag) => onAdd('technology', tag)}
				onRemove={(tag) => onRemove('technology', tag)}
				onDismiss={(tag) => onRemove('technology', tag)}
			/>
		{:else if page === 1}
			<TagPicker
				id="excluded-technologies"
				label="Never require these technologies"
				maxTags={10}
				maxCharacters={480}
				selected={exclusions}
				catalog={technology}
				onAdd={(tag) => onConstraint('excludedTechnologies', [...exclusions, tag].join(','))}
				onRemove={(tag) =>
					onConstraint('excludedTechnologies', exclusions.filter((t) => t !== tag).join(','))}
			/>
		{:else if page === 2}
			<TagPicker
				id="research-topics"
				label="Industries and research topics"
				selected={preferences.selectedIndustryTags}
				suggestions={preferences.suggestedIndustryTags}
				dismissed={preferences.dismissedIndustryTags}
				catalog={[
					'Higher Education',
					'Transportation',
					'Healthcare',
					'Manufacturing',
					'Consumer Software',
					'Accessibility',
					'Sustainability',
					'Logistics',
					'Food',
					'Entertainment'
				]}
				onAdd={(tag) => onAdd('industry', tag)}
				onRemove={(tag) => onRemove('industry', tag)}
			/>
		{:else if page === 3}
			<div class="game-choice-list originality-choices">
				{#each originality as title, index (title)}<button
						aria-pressed={preferences.innovationLevel === index + 1}
						onclick={() => onInnovation(index + 1)}
						>{preferences.innovationLevel === index + 1 ? '✓ ' : ''}{title}</button
					>{/each}
			</div>
		{:else if page === 4}
			<BudgetMeter
				id="prototype-budget"
				label="Prototype budget"
				value={preferences.prototypeBudgetUsd}
				{calm}
				onChange={(value) => onBudget('prototype', value)}
			/>
		{:else if page === 5}
			<label class="production-check"
				><input
					type="checkbox"
					checked={preferences.includeProductionPlanning}
					onchange={(event) => onProduction(event.currentTarget.checked)}
				/><span>Also plan production costs</span></label
			>
			{#if preferences.includeProductionPlanning}<BudgetMeter
					id="production-budget"
					label="Production budget"
					value={preferences.productionBudgetUsd}
					{calm}
					onChange={(value) => onBudget('production', value)}
				/>{:else}<p>We will budget only the first working prototype.</p>{/if}
		{:else}
			<div class="practical-constraints">
				{#each constraintFields.slice((page - 6) * 2, (page - 5) * 2) as field (field.key)}<label
						><span>{field.label}</span><input
							type="text"
							maxlength="500"
							value={preferences.constraints[field.key] ?? ''}
							placeholder={field.placeholder}
							oninput={(event) => onConstraint(field.key, event.currentTarget.value)}
						/></label
					>{/each}
			</div>
		{/if}
	</div>
	{#if error}<p class="dialogue-warning" role="alert">{error}</p>{/if}
	<nav aria-label="Preference pages">
		<button class="answer-button secondary" onclick={onBack}>← Back</button>
		{#if page >= 6}<button class="answer-button primary" onclick={onFinish}
				>Research my problems →</button
			>{/if}
		{#if page < 10}<button class="answer-button primary" onclick={onNext}
				>{page === 0 && !preferences.technologyTags.length
					? 'Open to suggestions →'
					: page === 2 && !preferences.selectedIndustryTags.length
						? 'Research broadly →'
						: page >= 6
							? 'More limits →'
							: 'Save and continue →'}</button
			>{/if}
	</nav>
</div>

<style>
	.preference-pages {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 100%;
	}
	.page-content {
		min-width: 0;
		grid-template-columns: minmax(0, 1fr);
		display: grid;
		gap: 12px;
	}
	.page-label {
		font: 20px/1.2 var(--game-font);
		color: #63553d;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: auto;
		padding: 4px;
	}
	nav button {
		flex: 1;
	}
	.practical-constraints {
		grid-template-columns: 1fr;
	}
	@media (max-width: 760px) {
		nav {
			gap: 8px;
		}
		nav :global(button) {
			font-size: 20px !important;
			padding: 8px !important;
		}
	}
</style>
