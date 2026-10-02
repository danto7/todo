<script lang="ts">
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { TodoList, type Filter } from '#lib/todos.svelte.ts';
	import Icon from '#lib/loam/Icon.svelte';
	import TodoRow from '#lib/components/TodoRow.svelte';
	import SegmentedControl from '#lib/components/SegmentedControl.svelte';

	const list = new TodoList();

	let draft = $state('');
	let editMode = $state(false);
	let swipedUid = $state<string | null>(null);

	// Large title collapses into the nav bar once it scrolls under it.
	let scrollY = $state(0);
	let titleEl = $state<HTMLElement>();
	const collapsed = $derived(!!titleEl && scrollY > titleEl.offsetTop + titleEl.offsetHeight - 52);

	const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280;

	const filters: { value: Filter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'open', label: 'Open' },
		{ value: 'done', label: 'Done' }
	];

	function submit(event: SubmitEvent) {
		event.preventDefault();
		list.add(draft);
		draft = '';
	}

	function remove(uid: string) {
		if (swipedUid === uid) swipedUid = null;
		list.remove(uid);
		if (list.items.length === 0) editMode = false;
	}

	function toggleEditMode() {
		editMode = !editMode;
		swipedUid = null;
	}

	const empty = $derived(
		list.filter === 'done'
			? { title: 'Nothing done yet', text: 'Completed to-dos show up here.' }
			: list.filter === 'open' && list.items.length
				? { title: 'All done', text: 'Every to-do is checked off.' }
				: { title: 'No to-dos', text: 'Add one below to get started.' }
	);
</script>

<svelte:window onscroll={() => (scrollY = window.scrollY)} />

<div class="app">
	<nav class="navbar" class:collapsed>
		<span class="nav-title" aria-hidden={!collapsed}>To-do</span>
		{#if list.items.length > 0}
			<button type="button" class="ios-text-btn nav-action" class:bold={editMode} onclick={toggleEditMode}>
				{editMode ? 'Done' : 'Edit'}
			</button>
		{/if}
	</nav>

	<header class="head">
		<h1 class="ios-large-title" bind:this={titleEl}>To-do</h1>
		<p class="ios-subhead">{list.openCount} open</p>
		<div class="filters">
			<SegmentedControl options={filters} bind:value={list.filter} label="Filter" />
		</div>
	</header>

	<main class="body">
		{#if list.doneCount > 0}
			<div class="completed-bar">
				<span>{list.doneCount} completed</span>
				<span aria-hidden="true">·</span>
				<button type="button" class="ios-text-btn" onclick={() => list.clearCompleted()}>Clear</button>
			</div>
		{/if}

		{#if list.visible.length === 0}
			<div class="empty">
				<Icon name="inbox" size={28} />
				<p class="empty-title">{empty.title}</p>
				<p class="ios-subhead">{empty.text}</p>
			</div>
		{:else}
			<ul class="group" aria-label="To-dos">
				{#each list.visible as todo (todo.uid)}
					<li animate:flip={{ duration: motion, easing: cubicOut }} transition:slide={{ duration: motion }}>
						<TodoRow
							{todo}
							{editMode}
							swiped={swipedUid === todo.uid}
							onSwipe={(open) => (swipedUid = open ? todo.uid : null)}
							onToggle={() => list.toggle(todo.uid)}
							onRename={(s) => list.rename(todo.uid, s)}
							onDelete={() => remove(todo.uid)}
						/>
					</li>
				{/each}
			</ul>
			{#if !editMode}
				<p class="hint">Swipe left on a to-do to delete it.</p>
			{/if}
		{/if}
	</main>

	<form class="toolbar" onsubmit={submit}>
		<input
			class="field"
			bind:value={draft}
			placeholder="New to-do"
			aria-label="New to-do"
			enterkeyhint="done"
			autocomplete="off"
		/>
		<button type="submit" class="add" aria-label="Add to-do" disabled={!draft.trim()}>
			<Icon name="plus" size={20} stroke={2.25} />
		</button>
	</form>
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

	.nav-action {
		grid-column: 3;
		justify-self: end;
	}

	.nav-action.bold {
		font-weight: 600;
	}

	.head {
		padding: 0 var(--space-4) var(--space-2);
	}

	.filters {
		margin-top: var(--space-4);
	}

	.body {
		flex: 1;
		padding: var(--space-2) var(--space-4) var(--space-6);
	}

	.completed-bar {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin: 0 0 var(--space-1) var(--space-4);
		font: 400 15px/20px var(--font-ui);
		color: var(--ink-muted);
	}

	.completed-bar .ios-text-btn {
		font-size: 15px;
		padding: 0 var(--space-1);
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

	/* Bottom toolbar: frosted, with a filled field and round tint button */
	.toolbar {
		position: sticky;
		bottom: 0;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4) calc(env(safe-area-inset-bottom) + var(--space-2));
		background: var(--bar-bg);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
		backdrop-filter: saturate(180%) blur(20px);
		border-top: var(--hairline) solid var(--line);
	}

	.field {
		flex: 1;
		min-width: 0;
		height: 40px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-lg);
		background: var(--fill);
		/* 17px also keeps iOS Safari from zooming on focus */
		font: 400 17px/22px var(--font-ui);
		color: var(--ink);
		caret-color: var(--accent);
		outline: none;
	}

	.field::placeholder {
		color: var(--ink-muted);
	}

	.field:focus-visible {
		box-shadow: 0 0 0 2px var(--accent);
	}

	.add {
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		cursor: pointer;
		transition:
			opacity 0.2s,
			transform 0.15s;
	}

	.add:active {
		transform: scale(0.92);
	}

	.add:disabled {
		opacity: 0.35;
		cursor: default;
	}
</style>
