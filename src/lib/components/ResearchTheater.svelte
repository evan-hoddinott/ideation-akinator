<script lang="ts">
	let { calm = false }: { calm?: boolean } = $props();
</script>

{#if calm}
	<div class="research-theater-calm">
		<span>CALM RESEARCH DISPLAY</span>
		<p>Decorative browser nonsense suppressed. The real job continues above.</p>
	</div>
{:else}
	<section class="research-theater" aria-label="Decorative research theater">
		<p class="theater-warning">DECORATIVE SAGE DISTRACTIONS — NOT RESEARCH SOURCES</p>
		<div class="fake-window cat-window">
			<header><span>cat_facts_2001.html</span><i>_ □ ×</i></header>
			<div>
				<img src="/images/retro/kitka-cat.gif" alt="A tiny running pixel cat" />
				<p>IMPORTANT RESEARCH: cat going extremely fast</p>
			</div>
		</div>
		<div class="fake-window wizard-window">
			<header><span>definitely_not_me.gif</span><i>_ □ ×</i></header>
			<div>
				<img src="/images/retro/wizard-idle.gif" alt="A looping pixel wizard" />
				<p>consulting senior management...</p>
			</div>
		</div>
		<div class="fake-window terminal-window">
			<header><span>ORACLE TERMINAL</span><i>_ □ ×</i></header>
			<div class="terminal-lines" aria-hidden="true">
				<p>&gt; searching competitor graveyard...</p>
				<p>&gt; checking sources for cursed energy...</p>
				<p>&gt; deleting browser_history.txt...</p>
				<p>&gt; <span>the crystal modem is thinking_</span></p>
			</div>
		</div>
		<img class="magic-hit" src="/images/retro/magic-hit.gif" alt="" />
	</section>
{/if}
