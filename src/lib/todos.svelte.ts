import { createTodo, type Todo } from './todo';
import { localTodoStorage, type TodoStorage } from './storage';

export class TodoList {
	items = $state<Todo[]>([]);

	open = $derived(this.items.filter((t) => t.status !== 'COMPLETED'));
	/** Most recently completed first. */
	completed = $derived(
		this.items
			.filter((t) => t.status === 'COMPLETED')
			.sort((a, b) => (b.completed ?? '').localeCompare(a.completed ?? ''))
	);
	openCount = $derived(this.open.length);
	doneCount = $derived(this.completed.length);

	#storage: TodoStorage;

	constructor(storage: TodoStorage = localTodoStorage) {
		this.#storage = storage;
		this.items = storage.load();
	}

	add(summary: string) {
		const text = summary.trim();
		if (!text) return;
		this.items.unshift(createTodo(text));
		this.#persist();
	}

	toggle(uid: string) {
		this.#update(uid, (t) => {
			const done = t.status !== 'COMPLETED';
			t.status = done ? 'COMPLETED' : 'NEEDS-ACTION';
			t.completed = done ? new Date().toISOString() : undefined;
		});
	}

	rename(uid: string, summary: string) {
		const text = summary.trim();
		if (!text) return this.remove(uid);
		this.#update(uid, (t) => (t.summary = text));
	}

	remove(uid: string) {
		this.items = this.items.filter((t) => t.uid !== uid);
		this.#persist();
	}

	removeMany(uids: Iterable<string>) {
		const drop = new Set(uids);
		this.items = this.items.filter((t) => !drop.has(t.uid));
		this.#persist();
	}

	clearCompleted() {
		this.items = this.items.filter((t) => t.status !== 'COMPLETED');
		this.#persist();
	}

	#update(uid: string, fn: (t: Todo) => void) {
		const todo = this.items.find((t) => t.uid === uid);
		if (!todo) return;
		fn(todo);
		todo.lastModified = new Date().toISOString();
		this.#persist();
	}

	#persist() {
		this.#storage.save($state.snapshot(this.items));
	}
}
