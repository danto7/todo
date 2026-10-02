<script lang="ts">
	import { flushSync } from 'svelte';
	import { flip } from 'svelte/animate';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { TodoList } from '#lib/todos.svelte.ts';
	import type { Todo } from '#lib/todo.ts';
	import Icon from '#lib/loam/Icon.svelte';
	import TodoRow from '#lib/components/TodoRow.svelte';
	import NewTodoRow from '#lib/components/NewTodoRow.svelte';

	const list = new TodoList();

	// A checked to-do stays in place for a moment (so the tap registers and can be
	// undone), then moves into the collapsed Completed section.
	const MOVE_DELAY = 2000;
	const pending = new SvelteMap<string, ReturnType<typeof setTimeout>>();
	const mainList = $derived(list.items.filter((t) => t.status !== 'COMPLETED' || pending.has(t.uid)));
	const completedList = $derived(list.completed.filter((t) => !pending.has(t.uid)));
	let completedOpen = $state(false);

	// The empty row a new to-do is typed into, opened by the floating + button.
	let adding = $state(false);
	let draft = $state('');
	let draftInput = $state<HTMLInputElement>();
	// Select mode: tap rows to select them, then act on all of them at once.
	let selecting = $state(false);
	const selected = new SvelteSet<string>();
	// Only act on what's on screen, so a collapsed section can't hide what gets deleted.
	const selectedVisible = $derived(
		[...mainList, ...(completedOpen ? completedList : [])]
			.filter((t) => selected.has(t.uid))
			.map((t) => t.uid)
	);
	let swipedUid = $state<string | null>(null);

	// Large title collapses into the nav bar once it scrolls under it.
	let scrollY = $state(0);
	let titleEl = $state<HTMLElement>();
	const collapsed = $derived(!!titleEl && scrollY > titleEl.offsetTop + titleEl.offsetHeight - 52);

	const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280;

	function startAdding() {
		if (adding) {
			// Already typing: save what's there and stay in the new row.
			if (draft.trim()) commitDraft();
			draftInput?.focus();
			return;
		}
		stopSelecting();
		swipedUid = null;
		// Render the row synchronously so focus() runs inside the tap,
		// which is what lets iOS open the keyboard.
		flushSync(() => (adding = true));
		draftInput?.focus();
	}

	function commitDraft() {
		list.add(draft);
		draft = '';
	}

	function closeDraft() {
		if (draft.trim()) commitDraft();
		draft = '';
		adding = false;
	}

	function toggle(todo: Todo) {
		const timer = pending.get(todo.uid);
		if (timer) {
			// Unchecked before it moved: cancel the move.
			clearTimeout(timer);
			pending.delete(todo.uid);
		} else if (todo.status !== 'COMPLETED') {
			// Mark pending before completing, so it never leaves the main list early.
			pending.set(
				todo.uid,
				setTimeout(() => pending.delete(todo.uid), MOVE_DELAY)
			);
		}
		list.toggle(todo.uid);
	}

	function remove(uid: string) {
		if (swipedUid === uid) swipedUid = null;
		clearTimeout(pending.get(uid));
		pending.delete(uid);
		list.remove(uid);
	}

	function startSelecting() {
		selecting = true;
		swipedUid = null;
	}

	function stopSelecting() {
		selecting = false;
		selected.clear();
	}

	function toggleSelected(uid: string) {
		if (selected.has(uid)) selected.delete(uid);
		else selected.add(uid);
	}

	function completeSelected() {
		list.completeMany(selectedVisible);
		stopSelecting();
	}

	function deleteSelected() {
		list.removeMany(selectedVisible);
		stopSelecting();
	}

	const count = $derived(selectedVisible.length);

	const empty = $derived(
		list.doneCount > 0
			? { title: 'All done', text: 'Every to-do is checked off.' }
			: { title: 'No to-dos', text: 'Tap + to add one.' }
	);
</script>

<svelte:window
	onscroll={() => (scrollY = window.scrollY)}
	onkeydown={(e) => selecting && e.key === 'Escape' && stopSelecting()}
/>

<div class="app">
	<nav class="navbar" class:collapsed={collapsed || selecting}>
		{#if selecting}
			<button type="button" class="ios-icon-btn nav-left" aria-label="Cancel" title="Cancel" onclick={stopSelecting}>
				<Icon name="x" size={22} stroke={2} />
			</button>
			<span class="nav-title" aria-live="polite">{count === 0 ? 'Select to-dos' : `${count} selected`}</span>
		{:else}
			<span class="nav-title" aria-hidden={!collapsed}>To-do</span>
			{#if list.items.length > 0}
				<button
					type="button"
					class="ios-icon-btn nav-right"
					aria-label="Select to-dos"
					title="Select"
					onclick={startSelecting}
				>
					<Icon name="select" size={24} />
				</button>
			{/if}
		{/if}
	</nav>

	<header class="head">
		<h1 class="ios-large-title" bind:this={titleEl}>To-do</h1>
		<p class="ios-subhead">{list.openCount} open</p>
	</header>

	<main class="body">
		{#if mainList.length === 0 && !adding}
			<div class="empty">
				<Icon name="inbox" size={28} />
				<p class="empty-title">{empty.title}</p>
				<p class="ios-subhead">{empty.text}</p>
			</div>
		{:else}
			<ul class="group" aria-label="To-dos">
				{#if adding}
					<li transition:slide={{ duration: motion }}>
						<NewTodoRow
							bind:value={draft}
							bind:input={draftInput}
							onCommit={commitDraft}
							onClose={closeDraft}
						/>
					</li>
				{/if}
				{#each mainList as todo (todo.uid)}
					<li animate:flip={{ duration: motion, easing: cubicOut }} transition:slide={{ duration: motion }}>
						<TodoRow
							{todo}
							{selecting}
							selected={selected.has(todo.uid)}
							onSelect={() => toggleSelected(todo.uid)}
							swiped={swipedUid === todo.uid}
							onSwipe={(open) => (swipedUid = open ? todo.uid : null)}
							onToggle={() => toggle(todo)}
							onRename={(s) => list.rename(todo.uid, s)}
							onDelete={() => remove(todo.uid)}
						/>
					</li>
				{/each}
			</ul>
			{#if !selecting && mainList.length > 0}
				<p class="hint">Swipe left on a to-do to delete it.</p>
			{/if}
		{/if}

		{#if completedList.length > 0}
			<details class="completed" bind:open={completedOpen}>
				<summary>
					<span class="chevron"><Icon name="chevron-right" size={18} stroke={2} /></span>
					<span class="summary-label">Completed</span>
					<span class="summary-count">{completedList.length}</span>
				</summary>
				<ul class="group" aria-label="Completed to-dos">
					{#each completedList as todo (todo.uid)}
						<li animate:flip={{ duration: motion, easing: cubicOut }} transition:slide={{ duration: motion }}>
							<TodoRow
								{todo}
								{selecting}
								selected={selected.has(todo.uid)}
								onSelect={() => toggleSelected(todo.uid)}
								swiped={swipedUid === todo.uid}
								onSwipe={(open) => (swipedUid = open ? todo.uid : null)}
								onToggle={() => toggle(todo)}
								onRename={(s) => list.rename(todo.uid, s)}
								onDelete={() => remove(todo.uid)}
							/>
						</li>
					{/each}
				</ul>
				{#if !selecting}
					<div class="completed-foot">
						<button
							type="button"
							class="ios-icon-btn danger"
							aria-label="Clear completed"
							title="Clear completed"
							onclick={() => list.clearCompleted()}
						>
							<Icon name="trash" size={20} />
						</button>
					</div>
				{/if}
			</details>
		{/if}
	</main>

	{#if selecting}
		<div class="actions" role="toolbar" aria-label="Selected to-dos">
			<button
				type="button"
				class="ios-icon-btn"
				aria-label={`Mark ${count} as done`}
				title="Mark as done"
				disabled={count === 0}
				onclick={completeSelected}
			>
				<Icon name="check" size={24} stroke={2} />
			</button>
			<button
				type="button"
				class="ios-icon-btn danger"
				aria-label={`Delete ${count}`}
				title="Delete"
				disabled={count === 0}
				onclick={deleteSelected}
			>
				<Icon name="trash" size={24} />
			</button>
		</div>
	{:else}
		<button
			type="button"
			class="fab"
			aria-label="Add to-do"
			title="Add to-do"
			onpointerdown={(e) => e.preventDefault()}
			onclick={startAdding}
		>
			<Icon name="plus" size={26} stroke={2.25} />
		</button>
	{/if}
</div>

<style>
	.app {
		max-width: 640px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* Nav bar: transparent over the large title, frosted once it collapses */
	.navbar {
		position: sticky;
		top: 0;
		z-index: 2;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: calc(env(safe-area-inset-top) + 44px);
		padding: env(safe-area-inset-top) var(--space-2) 0;
		border-bottom: var(--hairline) solid transparent;
		transition:
			background 0.2s,
			border-color 0.2s;
	}

	.navbar.collapsed {
		background: var(--bar-bg);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
		backdrop-filter: saturate(180%) blur(20px);
		border-bottom-color: var(--line);
	}

	.nav-title {
		grid-column: 2;
		font: 600 17px/22px var(--font-ui);
		opacity: 0;
		transform: translateY(4px);
		transition:
			opacity 0.2s,
			transform 0.2s;
	}

	.collapsed .nav-title {
		opacity: 1;
		transform: none;
	}

	.nav-left {
		grid-column: 1;
		grid-row: 1;
		justify-self: start;
	}

	.nav-right {
		grid-column: 3;
		grid-row: 1;
		justify-self: end;
	}

	.head {
		padding: 0 var(--space-4) var(--space-2);
	}

	.body {
		flex: 1;
		/* Room below the last row so the floating button never covers it */
		padding: var(--space-2) var(--space-4) calc(env(safe-area-inset-bottom) + 96px);
	}

	/* Inset grouped list */
	.group {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface-raised);
	}

	/* Completed section: a native <details>, collapsed by default */
	.completed {
		margin-top: var(--space-6);
	}

	.completed summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px;
		padding: 0 var(--space-4) 0 var(--space-3);
		border-radius: var(--radius-lg);
		list-style: none;
		font: 600 17px/22px var(--font-ui);
		color: var(--ink);
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
	}

	.completed summary::-webkit-details-marker {
		display: none;
	}

	.completed summary:active {
		background: var(--fill);
	}

	.chevron {
		display: grid;
		color: var(--accent);
		transition: transform 0.25s var(--ease);
	}

	.completed[open] .chevron {
		transform: rotate(90deg);
	}

	.summary-label {
		flex: 1;
	}

	.summary-count {
		font-weight: 400;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}

	.completed .group {
		margin-top: var(--space-2);
	}

	.completed-foot {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-1);
	}

	.completed-foot .danger {
		color: var(--danger);
	}

	.hint {
		margin: var(--space-2) var(--space-4) 0;
		font: 400 13px/18px var(--font-ui);
		color: var(--ink-muted);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: 64px var(--space-6);
		text-align: center;
		color: var(--ink-muted);
	}

	.empty-title {
		margin: var(--space-2) 0 0;
		font: 600 20px/25px var(--font-ui);
		color: var(--ink);
	}

	/* Floating add button, bottom right within thumb reach */
	.fab {
		position: fixed;
		right: max(var(--space-4), calc((100vw - 640px) / 2 + var(--space-4)));
		bottom: calc(env(safe-area-inset-bottom) + var(--space-4));
		z-index: 3;
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		box-shadow: var(--shadow-pop);
		cursor: pointer;
		transition: transform 0.15s var(--ease);
	}

	.fab:active {
		transform: scale(0.92);
	}

	/* Floating action bar for the selection, where the + button sits */
	.actions {
		position: fixed;
		right: max(var(--space-4), calc((100vw - 640px) / 2 + var(--space-4)));
		bottom: calc(env(safe-area-inset-bottom) + var(--space-4));
		z-index: 3;
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		border-radius: 32px;
		background: var(--surface-raised);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-pop);
	}

	.actions .ios-icon-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}

	.actions .danger {
		color: var(--danger);
	}
</style>
