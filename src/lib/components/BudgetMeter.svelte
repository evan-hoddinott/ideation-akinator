<script lang="ts">
	let {
		id,
		label,
		value,
		onChange,
		calm = false
	}: {
		id: string;
		label: string;
		value: number | null;
		onChange: (value: number | null) => void;
		calm?: boolean;
	} = $props();
	let invalid = $state(false);
	const position = $derived(
		Math.min(100, (Math.log10(Math.max(0, value ?? 0) + 1) / Math.log10(100001)) * 100)
	);
	const heat = $derived(
		(value ?? 0) >= 10000 ? 'blazing' : (value ?? 0) >= 1000 ? 'sparking' : 'quiet'
	);
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(amount);
	function choose(amount: number) {
		invalid = false;
		onChange(amount);
	}
	function setNumber(input: HTMLInputElement) {
		invalid =
			!input.validity.valid || (input.value !== '' && !Number.isFinite(input.valueAsNumber));
		onChange(invalid || input.value === '' ? null : input.valueAsNumber);
	}
</script>

<div class="budget-meter" class:calm data-heat={heat}>
	<header>
		<label for={id}>{label}</label><span>{value === null ? 'Choose a limit' : money(value)}</span>
	</header>
	<div class="budget-scale" style={`--budget-position:${position}%`}>
		<div class="budget-segments" aria-hidden="true">
			{#each [...Array(20).keys()] as index (index)}<i
					class:filled={index < Math.ceil(position / 5)}
				></i>{/each}
		</div>
		{#if heat !== 'quiet'}<span class="budget-flame" aria-hidden="true"></span>{/if}
		<input
			class="budget-slider"
			type="range"
			min="0"
			max="100"
			step="1"
			value={position}
			aria-label={`${label} slider`}
			aria-valuetext={value === null ? 'Not set' : money(value)}
			oninput={(event) =>
				choose(Math.round(100001 ** (event.currentTarget.valueAsNumber / 100) - 1))}
		/>
	</div>
	<div class="budget-entry">
		<span aria-hidden="true">$</span><input
			{id}
			type="number"
			min="0"
			max="1000000000"
			step="0.01"
			value={value ?? ''}
			placeholder="Exact amount in USD"
			aria-invalid={invalid}
			aria-describedby={invalid ? `${id}-error` : undefined}
			oninput={(event) => setNumber(event.currentTarget)}
		/><small>USD</small>
	</div>
	{#if invalid}<p id={`${id}-error`} role="alert">
			Enter $0 to $1 billion, using no more than two decimal places.
		</p>{/if}
	<div class="budget-presets" aria-label={`${label} presets`}>
		{#each [0, 200, 500, 2000, 10000] as amount (amount)}<button
				type="button"
				aria-pressed={value === amount}
				onclick={() => choose(amount)}>{money(amount)}</button
			>{/each}
	</div>
	<small class="budget-help"
		>The bar covers $0–$100,000. Type any exact limit up to $1 billion.</small
	>
</div>

<style>
	.budget-meter {
		min-width: 0;
		display: grid;
		gap: 10px;
		padding: 16px;
		background: #e7d5b6;
		border: 2px solid #b49a74;
		color: #4b3f2f;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font: 24px/1.25 var(--game-font);
	}
	header span {
		font-variant-numeric: tabular-nums;
	}
	.budget-scale {
		position: relative;
		height: 62px;
		padding-top: 28px;
	}
	.budget-segments {
		height: 20px;
		display: flex;
		gap: 3px;
		padding: 4px;
		background: #605539;
		box-shadow: 0 3px #b4a17c;
	}
	.budget-segments i {
		flex: 1;
		background: #c2b794;
		box-shadow: inset 0 2px #eee2bd;
	}
	.budget-segments i.filled {
		background: #9bb56d;
		box-shadow: inset 0 3px #d0e89d;
	}
	[data-heat='blazing'] .budget-segments i.filled {
		background: #d89442;
		box-shadow: inset 0 3px #ffe78b;
	}
	.budget-slider {
		position: absolute;
		left: 0;
		top: 26px;
		width: 100%;
		height: 24px;
		margin: 0;
		appearance: none;
		background: transparent;
	}
	.budget-slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 28px;
		border: 3px solid #4d422f;
		background: #ffedaa;
		box-shadow:
			inset 0 0 0 2px #fff8db,
			2px 2px #6b533e;
	}
	.budget-slider::-moz-range-thumb {
		width: 12px;
		height: 24px;
		border: 3px solid #4d422f;
		border-radius: 0;
		background: #ffedaa;
	}
	.budget-flame {
		position: absolute;
		bottom: 22px;
		left: clamp(0px, calc(var(--budget-position) - 32px), calc(100% - 64px));
		width: 64px;
		height: 64px;
		background: url('/images/workflow/flame-strip.png') 0 0;
		image-rendering: pixelated;
		animation: budget-fire 900ms steps(8) infinite;
		pointer-events: none;
	}
	[data-heat='blazing'] .budget-flame {
		filter: hue-rotate(300deg);
		animation-duration: 650ms;
	}
	.budget-entry {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.budget-entry input {
		width: 100%;
		min-width: 0;
	}
	.budget-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.budget-presets button {
		padding: 5px 8px;
		border: 1px solid #a58e6d;
		color: #534430;
		background: #f3e6c7;
		font: 24px/1.25 var(--game-font);
	}
	.budget-presets button[aria-pressed='true'] {
		background: #c5d5a7;
		border-color: #6c8052;
	}
	small {
		color: #6e5b42;
		font: 24px/1.25 var(--game-font);
	}
	@keyframes budget-fire {
		to {
			background-position: -512px 0;
		}
	}
	.calm .budget-flame {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.budget-flame {
			animation: none;
		}
	}
</style>
