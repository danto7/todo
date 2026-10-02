<script lang="ts">
	import { tick } from 'svelte';
	import type { Todo } from '#lib/todo.ts';
	import Icon from '#lib/loam/Icon.svelte';

	let {
		todo,
		selecting,
		selected,
		onSelect,
		swiped,
		onSwipe,
		onToggle,
		onRename,
		onDelete
	}: {
		todo: Todo;
		/** Multi-select mode: tapping anywhere on the row selects it; no swipe or editing. */
		selecting: boolean;
		selected: boolean;
		onSelect: () => void;
		/** Whether this row's swipe action is revealed. Only one row at a time. */
		swiped: boolean;
		onSwipe: (open: boolean) => void;
		onToggle: () => void;
		onRename: (summary: string) => void;
		onDelete: () => void;
	} = $props();

	const ACTION_WIDTH = 88;
	const done = $derived(todo.status === 'COMPLETED');

	let row = $state<HTMLDivElement>();
	let editInput = $state<HTMLInputElement>();
	let editing = $state(false);
	let draft = $state('');

	// Swipe-to-delete
	let dragX = $state<number | null>(null);
	let startX = 0;
	let startY = 0;
	let baseX = 0;
	let axis: 'x' | 'y' | null = null;
	let suppressClick = false;

	const offset = $derived(dragX ?? (swiped ? -ACTION_WIDTH : 0));
	const fullSwipe = $derived(dragX !== null && !!row && -dragX > row.offsetWidth * 0.6);

	function pointerDown(e: PointerEvent) {
		if (editing || selecting || e.button !== 0) return;
		startX = e.clientX;
		startY = e.clientY;
		baseX = swiped ? -ACTION_WIDTH : 0;
		axis = null;
	}

	function pointerMove(e: PointerEvent) {
		if (editing || selecting || !e.buttons) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (!axis) {
			if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
			axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (axis === 'x') row?.setPointerCapture(e.pointerId);
		}
		if (axis !== 'x') return;
		// Rubber-band past the left edge instead of moving right.
		const x = baseX + dx;
		dragX = x > 0 ? x / 6 : x;
	}

	function pointerUp() {
		if (axis === 'x' && dragX !== null) {
			suppressClick = true;
			if (fullSwipe) onDelete();
			else onSwipe(dragX < -ACTION_WIDTH / 2);
		}
		dragX = null;
		axis = null;
	}

	function clickCapture(e: MouseEvent) {
		if (suppressClick) {
			suppressClick = false;
			e.stopPropagation();
			e.preventDefault();
		} else if (swiped && !(e.target as Element).closest('.action')) {
			// Tapping a revealed row closes it, like iOS.
			e.stopPropagation();
			e.preventDefault();
			onSwipe(false);
		}
	}

	async function startEdit() {
		draft = todo.summary;
		editing = true;
		await tick();
		editInput?.focus();
	}

	function commit() {
		if (!editing) return;
		editing = false;
		onRename(draft);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') commit();
		if (e.key === 'Escape') editing = false;
	}
</script>

<!-- Swipe is a touch shortcut; select mode offers the same delete for keyboard and screen readers. -->
<div
	class="row"
	role="group"
	aria-label={todo.summary}
	class:done
	bind:this={row}
	onpointerdown={pointerDown}
	onpointermove={pointerMove}
	onpointerup={pointerUp}
	onpointercancel={pointerUp}
	onclickcapture={clickCapture}
>
	<button
		type="button"
		class="action"
		style:width="{Math.max(ACTION_WIDTH, -offset)}px"
		style:visibility={offset < 0 ? 'visible' : 'hidden'}
		tabindex={swiped ? 0 : -1}
		aria-hidden={!swiped}
		aria-label={`Delete “${todo.summary}”`}
		title="Delete"
		onclick={onDelete}
	>
		<span class="action-icon"><Icon name="trash" size={22} /></span>
	</button>

	<div class="content" class:dragging={dragX !== null} style:transform="translateX({offset}px)">
		{#if selecting}
			<button
				type="button"
				class="select-row"
				class:selected
				role="checkbox"
				aria-checked={selected}
				onclick={onSelect}
			>
				<span class="check" aria-hidden="true">
					<span class="select-dot">
						{#if selected}<Icon name="check" size={14} stroke={2.5} />{/if}
					</span>
				</span>
				<span class="text">{todo.summary}</span>
			</button>
		{:else}
			<label class="check">
				<input
					type="checkbox"
					checked={done}
					onchange={onToggle}
					aria-label={done ? `Mark “${todo.summary}” as open` : `Mark “${todo.summary}” as done`}
				/>
			</label>

			{#if editing}
				<input
					class="edit"
					bind:this={editInput}
					bind:value={draft}
					onblur={commit}
					onkeydown={onKey}
					enterkeyhint="done"
					aria-label="Edit to-do"
				/>
			{:else}
				<button type="button" class="text" onclick={startEdit}>{todo.summary}</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.row {
		position: relative;
		overflow: hidden;
		touch-action: pan-y;
		background: var(--surface-raised);
	}

	/* Swipe action, revealed behind the row */
	.action {
		position: absolute;
		inset: 0 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 0 0 0 20px;
		border: 0;
		background: var(--danger);
		color: var(--on-accent);
		font: 400 17px/22px var(--font-ui);
		cursor: pointer;
		transition: width 0.3s var(--ease);
	}

	.action-icon {
		display: grid;
		place-items: center;
		width: 48px;
	}

	.content {
		position: relative;
		display: flex;
		align-items: center;
		min-height: 44px;
		padding-right: var(--space-2);
		background: var(--surface-raised);
		transition: transform 0.35s var(--ease);
	}

	.content.dragging {
		transition: none;
	}

	/* Inset separator, starting at the text like iOS */
	.content::after {
		content: '';
		position: absolute;
		left: 52px;
		right: 0;
		bottom: 0;
		height: 1px;
		background: var(--line);
		transform: scaleY(0.5);
		transform-origin: bottom;
	}

	:global(li:last-child) > .row .content::after {
		display: none;
	}

	.content:has(.text:active) {
		background: color-mix(in srgb, var(--surface-raised) 50%, var(--surface-sunken));
	}

	/* Round checkbox, Reminders-style */
	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: 52px;
		height: 44px;
		padding-left: var(--space-1);
		cursor: pointer;
	}

	.check input {
		appearance: none;
		margin: 0;
		width: 24px;
		height: 24px;
		display: grid;
		place-content: center;
		border: 1.5px solid var(--line-strong);
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		transition:
			background 0.2s var(--ease),
			border-color 0.2s var(--ease),
			transform 0.2s var(--ease);
	}

	.check input:active {
		transform: scale(0.88);
	}

	.check input:checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check input:checked::after {
		content: '';
		width: 10px;
		height: 5px;
		border: 2px solid var(--on-accent);
		border-top: 0;
		border-right: 0;
		transform: translateY(-1px) rotate(-45deg);
	}

	.text {
		flex: 1;
		min-width: 0;
		padding: 11px var(--space-1) 11px 0;
		border: 0;
		background: none;
		text-align: left;
		font: 400 17px/22px var(--font-ui);
		color: var(--ink);
		overflow-wrap: anywhere;
		cursor: text;
		transition: color 0.2s var(--ease);
	}

	.done .text {
		color: var(--ink-muted);
	}

	.edit {
		flex: 1;
		min-width: 0;
		height: 44px;
		padding: 0 var(--space-1) 0 0;
		border: 0;
		background: none;
		font: 400 17px/22px var(--font-ui);
		color: var(--ink);
		outline: none;
		caret-color: var(--accent);
	}

	/* Select mode: the whole row is one button */
	.select-row {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
		margin-right: calc(var(--space-2) * -1);
		padding: 0 var(--space-2) 0 0;
		border: 0;
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.select-row.selected {
		background: var(--accent-soft);
	}

	.select-row.selected .text {
		color: var(--accent-ink);
	}

	.select-dot {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border: 1.5px solid var(--line-strong);
		border-radius: 50%;
		color: var(--on-accent);
	}

	.selected .select-dot {
		background: var(--accent);
		border-color: var(--accent);
	}

	.select-row .check,
	.select-row .text {
		cursor: inherit;
	}
</style>
