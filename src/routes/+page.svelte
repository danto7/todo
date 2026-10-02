<script lang="ts">
	import { tick } from 'svelte';
	import { TodoList, type Filter } from '#lib/todos.svelte.ts';
	import Icon from '#lib/loam/Icon.svelte';

	const list = new TodoList();

	let draft = $state('');
	let editing = $state<string | null>(null);
	let editDraft = $state('');

	const filters = $derived<{ value: Filter; label: string; count: number }[]>([
		{ value: 'all', label: 'All', count: list.items.length },
		{ value: 'open', label: 'Open', count: list.openCount },
		{ value: 'done', label: 'Done', count: list.doneCount }
	]);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		list.add(draft);
		draft = '';
	}

	async function startEdit(uid: string, summary: string) {
		editing = uid;
		editDraft = summary;
		await tick();
		document.querySelector<HTMLInputElement>(`[data-edit="${uid}"]`)?.focus();
	}

	function commitEdit() {
		if (editing) list.rename(editing, editDraft);
		editing = null;
	}

	function onEditKey(event: KeyboardEvent) {
		if (event.key === 'Enter') commitEdit();
		if (event.key === 'Escape') editing = null;
	}

	const empty = $derived(
		list.filter === 'done'
			? { title: 'Nothing done yet', text: 'Completed to-dos show up here.' }
			: list.filter === 'open' && list.items.length
				? { title: 'All done', text: 'Every to-do is checked off.' }
				: { title: 'No to-dos', text: 'Add one below to get started.' }
	);
</script>

<div class="app">
	<header class="head">
		<h1 class="lm-title">To-do</h1>
		<p class="lm-caption">{list.openCount} open · {list.doneCount} done</p>

		<div class="lm-segmented" role="tablist" aria-label="Filter">
			{#each filters as f (f.value)}
				<button
					type="button"
					role="tab"
					class="lm-tab"
					aria-selected={list.filter === f.value}
					onclick={() => (list.filter = f.value)}
				>
					{f.label}
					<span class="count">{f.count}</span>
				</button>
			{/each}
		</div>
	</header>

	<main class="body">
		{#if list.visible.length === 0}
			<div class="lm-empty">
				<Icon name="inbox" size={20} />
				<p class="lm-heading">{empty.title}</p>
				<p class="lm-empty-text">{empty.text}</p>
			</div>
		{:else}
			<ul class="lm-list" aria-label="To-dos">
				{#each list.visible as todo (todo.uid)}
					{@const done = todo.status === 'COMPLETED'}
					<li class="row" class:done>
						<label class="check">
							<input
								type="checkbox"
								checked={done}
								onchange={() => list.toggle(todo.uid)}
								aria-label={done ? `Mark “${todo.summary}” as open` : `Mark “${todo.summary}” as done`}
							/>
						</label>

						{#if editing === todo.uid}
							<input
								class="lm-input edit"
								data-edit={todo.uid}
								bind:value={editDraft}
								onblur={commitEdit}
								onkeydown={onEditKey}
								enterkeyhint="done"
								aria-label="Edit to-do"
							/>
						{:else}
							<button type="button" class="text" onclick={() => startEdit(todo.uid, todo.summary)}>
								{todo.summary}
							</button>
						{/if}

						<button
							type="button"
							class="lm-iconbtn"
							aria-label={`Delete “${todo.summary}”`}
							title="Delete"
							onclick={() => list.remove(todo.uid)}
						>
							<Icon name="trash" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if list.doneCount > 0}
			<div class="actions">
				<button type="button" class="lm-btn lm-btn-secondary" onclick={() => list.clearCompleted()}>
					<Icon name="trash" />
					Clear completed
				</button>
			</div>
		{/if}
	</main>

	<form class="composer" onsubmit={submit}>
		<input
			class="lm-input"
			bind:value={draft}
			placeholder="Add a to-do"
			aria-label="New to-do"
			enterkeyhint="done"
			autocomplete="off"
		/>
		<button type="submit" class="lm-btn lm-btn-primary" disabled={!draft.trim()}>
			<Icon name="plus" />
			Add
		</button>
	</form>
</div>

<style>
	/*
	 * Loam components, ported from its bundle.css. Loam is tuned for dense desktop UI,
	 * so on touch screens controls keep their look but get >=44px hit areas, and
	 * text inputs use 16px so iOS Safari doesn't zoom on focus.
	 */
	.app {
		max-width: 640px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.head {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: calc(env(safe-area-inset-top) + var(--space-6)) var(--space-4) var(--space-4);
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}

	/* Tabs, segmented variant — stretched to full width on phones */
	.lm-segmented {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2px;
		padding: 2px;
		margin-top: var(--space-3);
		background: var(--surface-sunken);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
	}

	.lm-tab {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		height: 36px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		font: 500 13px/18px var(--font-sans);
		color: var(--ink-muted);
		cursor: pointer;
	}

	.lm-tab[aria-selected='true'] {
		color: var(--ink);
		background: var(--surface-raised);
		box-shadow: 0 0 0 1px var(--line);
	}

	.count {
		font-size: 12px;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}

	.body {
		flex: 1;
		padding: var(--space-4);
	}

	/* List */
	.lm-list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: var(--surface-raised);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.row {
		display: flex;
		align-items: center;
		min-height: 48px;
		padding: 0 var(--space-1);
		border-bottom: 1px solid var(--line);
	}

	.row:last-child {
		border-bottom: 0;
	}

	/* Checkbox: 18px box in a 44px hit area */
	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		cursor: pointer;
	}

	.check input {
		appearance: none;
		margin: 0;
		width: 18px;
		height: 18px;
		display: grid;
		place-content: center;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--surface-raised);
		cursor: pointer;
	}

	.check input:checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	.check input:checked::after {
		content: '';
		width: 9px;
		height: 5px;
		border: 2px solid var(--on-accent);
		border-top: 0;
		border-right: 0;
		transform: translateY(-1px) rotate(-45deg);
	}

	.text {
		flex: 1;
		min-width: 0;
		padding: var(--space-3) var(--space-1);
		border: 0;
		background: none;
		text-align: left;
		font: 400 15px/20px var(--font-sans);
		color: var(--ink);
		overflow-wrap: anywhere;
		cursor: text;
	}

	.done .text {
		color: var(--ink-muted);
		text-decoration: line-through;
	}

	/* Input */
	.lm-input {
		width: 100%;
		height: 40px;
		padding: 0 var(--space-3);
		font: 400 16px/20px var(--font-sans);
		color: var(--ink);
		background: var(--surface-raised);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
	}

	.lm-input::placeholder {
		color: var(--ink-muted);
	}

	.lm-input:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
		border-color: var(--accent);
	}

	.edit {
		flex: 1;
		min-width: 0;
		margin: var(--space-1) 0;
	}

	/* IconButton, ghost: 32px visual in a 44px hit area */
	.lm-iconbtn {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-md);
		background: none;
		color: var(--ink-muted);
		cursor: pointer;
	}

	.lm-iconbtn:active {
		background: var(--surface-sunken);
		color: var(--ink);
	}

	/* Button */
	.lm-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		height: 40px;
		padding: 0 var(--space-3);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font: 500 13px/18px var(--font-sans);
		white-space: nowrap;
		cursor: pointer;
		background: none;
		color: var(--ink);
	}

	.lm-btn-primary {
		background: var(--accent);
		color: var(--on-accent);
	}

	.lm-btn-secondary {
		background: var(--surface-raised);
		border-color: var(--line-strong);
	}

	.lm-btn-secondary:active {
		background: var(--surface-sunken);
	}

	.lm-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions {
		display: flex;
		justify-content: center;
		margin-top: var(--space-4);
	}

	/* EmptyState */
	.lm-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-6);
		margin-top: var(--space-6);
		text-align: center;
		color: var(--ink-muted);
	}

	.lm-empty .lm-heading {
		color: var(--ink);
	}

	.lm-empty-text {
		max-width: 320px;
		margin: 0;
	}

	/* Composer: sunken well pinned to the bottom, within thumb reach */
	.composer {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4) calc(env(safe-area-inset-bottom) + var(--space-3));
		background: var(--surface-sunken);
		border-top: 1px solid var(--line);
	}

	.composer .lm-input {
		flex: 1;
		min-width: 0;
	}
</style>
