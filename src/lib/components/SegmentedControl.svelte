<script lang="ts" generics="T extends string">
	let {
		options,
		value = $bindable(),
		label
	}: { options: { value: T; label: string }[]; value: T; label: string } = $props();

	const index = $derived(Math.max(0, options.findIndex((o) => o.value === value)));
</script>

<!-- iOS segmented control: a sliding raised thumb on a sunken track -->
<div
	class="segmented"
	role="tablist"
	aria-label={label}
	style:--count={options.length}
	style:--index={index}
>
	<span class="thumb" aria-hidden="true"></span>
	{#each options as o (o.value)}
		<button
			type="button"
			role="tab"
			aria-selected={o.value === value}
			onclick={() => (value = o.value)}
		>
			{o.label}
		</button>
	{/each}
</div>

<style>
	.segmented {
		position: relative;
		display: grid;
		grid-template-columns: repeat(var(--count), 1fr);
		padding: 2px;
		border-radius: 9px;
		background: var(--fill);
	}

	.thumb {
		position: absolute;
		top: 2px;
		bottom: 2px;
		left: 2px;
		width: calc((100% - 4px) / var(--count));
		border-radius: 7px;
		background: var(--surface-raised);
		box-shadow:
			0 3px 8px rgb(0 0 0 / 0.12),
			0 3px 1px rgb(0 0 0 / 0.04),
			0 0 0 var(--hairline) var(--line);
		transform: translateX(calc(var(--index) * 100%));
		transition: transform 0.3s var(--ease);
	}

	button {
		position: relative;
		height: 32px;
		border: 0;
		background: none;
		font: 500 13px/18px var(--font-ui);
		color: var(--ink);
		cursor: pointer;
	}

	button[aria-selected='true'] {
		font-weight: 600;
	}
</style>
