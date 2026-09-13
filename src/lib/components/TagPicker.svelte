<script lang="ts">
	let {
		id,
		label,
		selected,
		suggestions = [],
		catalog = [],
		dismissed = [],
		maxTags = 20,
		maxCharacters = 800,
		onAdd,
		onRemove,
		onDismiss,
		placeholder = 'Type to find or add a tag...'
	}: {
		id: string;
		label: string;
		selected: string[];
		suggestions?: string[];
		catalog?: string[];
		dismissed?: string[];
		maxTags?: number;
		maxCharacters?: number;
		onAdd: (tag: string) => void;
		onRemove: (tag: string) => void;
		onDismiss?: (tag: string) => void;
		placeholder?: string;
	} = $props();
	let draft = $state('');
	let error = $state('');
	let expanded = $state(false);
	let cursor = $state(0);
	const key = (tag: string) => tag.trim().toLowerCase();
	const selectedKeys = $derived(new Set(selected.map(key)));
	const dismissedKeys = $derived(new Set(dismissed.map(key)));
	const recommendations = $derived(
		suggestions
			.filter((tag) => !selectedKeys.has(key(tag)) && !dismissedKeys.has(key(tag)))
			.slice(0, 5)
	);
	const matches = $derived(
		[...new Set([...suggestions, ...catalog])]
			.filter((tag) => !selectedKeys.has(key(tag)) && key(tag).includes(key(draft)))
			.slice(0, 6)
	);
	function add(tag: string) {
		const cleaned = tag.trim().replace(/\s+/g, ' ').slice(0, 48);
		if (cleaned && !selectedKeys.has(key(cleaned))) {
			if (
				selected.length >= maxTags ||
				selected.reduce((sum, tag) => sum + tag.length, 0) + cleaned.length > maxCharacters
			) {
				error = `Keep up to ${maxTags} tags and ${maxCharacters} characters total. Remove or shorten a tag first.`;
				return;
			}
			onAdd(cleaned);
		}
		error = '';
		draft = '';
		expanded = false;
		cursor = 0;
	}
	function handleKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			expanded = false;
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			cursor = expanded
				? Math.max(0, Math.min(matches.length - 1, cursor + (event.key === 'ArrowDown' ? 1 : -1)))
				: event.key === 'ArrowDown'
					? 0
					: Math.max(0, matches.length - 1);
			expanded = true;
		}
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			add(expanded && matches[cursor] ? matches[cursor] : draft);
		}
	}
</script>

<div class="tag-picker">
	<label for={id}>{label}</label>
	<div class="picked-tags" aria-label={`Selected ${label.toLowerCase()}`}>
		{#each selected as tag (tag)}<span class="picked-tag"
				><span>{tag}</span><button
					type="button"
					aria-label={`Remove ${tag}`}
					onclick={() => onRemove(tag)}>×</button
				></span
			>{/each}
		{#if !selected.length}<small>No tags selected</small>{/if}
	</div>
	<div class="tag-input-row">
		<input
			{id}
			role="combobox"
			aria-autocomplete="list"
			aria-invalid={!!error}
			aria-describedby={error ? `${id}-error` : undefined}
			aria-expanded={expanded && matches.length > 0}
			aria-controls={`${id}-results`}
			aria-activedescendant={expanded && matches[cursor] ? `${id}-result-${cursor}` : undefined}
			autocomplete="off"
			maxlength="48"
			{placeholder}
			bind:value={draft}
			oninput={() => {
				error = '';
				expanded = true;
				cursor = 0;
			}}
			onkeydown={handleKey}
		/>
		<button
			type="button"
			disabled={!draft.trim()}
			onclick={() => add(draft)}
			aria-label={`Add ${label.toLowerCase()} tag`}>Add</button
		>
	</div>
	<div
		id={`${id}-results`}
		role="listbox"
		aria-label={`${label} matches`}
		hidden={!expanded || !matches.length}
	>
		{#each matches as tag, index (tag)}<button
				id={`${id}-result-${index}`}
				type="button"
				role="option"
				aria-selected={cursor === index}
				onclick={() => add(tag)}>{tag}</button
			>{/each}
	</div>
	{#if error}<p id={`${id}-error`} role="alert">{error}</p>{/if}
	{#if recommendations.length}<div class="tag-recommendations">
			<small>The Sage suggests</small>
			{#each recommendations as tag (tag)}<span
					><button type="button" onclick={() => add(tag)}>+ {tag}</button>{#if onDismiss}<button
							type="button"
							aria-label={`Dismiss suggestion ${tag}`}
							onclick={() => onDismiss?.(tag)}>×</button
						>{/if}</span
				>{/each}
		</div>{/if}
</div>

<style>
	.tag-picker {
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	label {
		color: #4f4437;
		font: 24px/1.25 var(--game-font);
	}
	.picked-tags,
	.tag-recommendations {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 7px;
	}
	.picked-tags {
		min-height: 32px;
	}
	small {
		color: #77634b;
		font: 24px/1.25 var(--game-font);
	}
	.picked-tag {
		display: inline-flex;
		align-items: center;
		background: #d8e2bb;
		border: 2px solid #7b8e5d;
		box-shadow: 2px 2px #b3bd95;
		color: #37452d;
		font: 24px/1.25 var(--game-font);
	}
	.picked-tag > span {
		padding: 4px 8px;
	}
	button {
		min-height: 32px;
		border: 2px solid #998364;
		box-shadow:
			inset 2px 2px #fff4d9,
			2px 2px #c2ae8a;
		background: #eadabd;
		padding: 4px 10px;
		color: #4f422f;
		font: 24px/1.25 var(--game-font);
	}
	.picked-tag button {
		align-self: stretch;
		border: 0;
		border-left: 2px solid #9da882;
		box-shadow: none;
		color: #425438;
		background: transparent;
		font-size: 18px;
	}
	.tag-input-row {
		display: flex;
		gap: 8px;
	}
	input {
		flex: 1;
		min-width: 0;
	}
	[role='listbox'] {
		display: grid;
		border: 2px solid #8c785b;
	}
	[role='listbox'][hidden] {
		display: none;
	}
	[role='option'] {
		text-align: left;
		background: #fff6df;
		border: 0;
		padding: 8px 12px;
	}
	[role='option'][aria-selected='true'] {
		background: #dce5be;
	}
	.tag-recommendations > small {
		width: 100%;
	}
	.tag-recommendations > span {
		display: inline-flex;
	}
	.tag-recommendations button {
		border-style: dashed;
	}
</style>
