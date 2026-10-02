import type { Todo } from './todo';

/**
 * Persistence backend for to-dos. Only a localStorage implementation exists
 * today; a CalDAV/WebDAV backend can implement the same interface later.
 */
export interface TodoStorage {
	load(): Todo[];
	save(todos: Todo[]): void;
}

const KEY = 'todo.items.v1';

export const localTodoStorage: TodoStorage = {
	load() {
		try {
			const raw = localStorage.getItem(KEY);
			return raw ? (JSON.parse(raw) as Todo[]) : [];
		} catch {
			return [];
		}
	},
	save(todos) {
		try {
			localStorage.setItem(KEY, JSON.stringify(todos));
		} catch {
			// Storage full or unavailable (e.g. private mode); keep working in memory.
		}
	}
};
