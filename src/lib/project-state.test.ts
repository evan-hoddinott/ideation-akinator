import { describe, expect, it } from 'vitest';
import {
	clearProject,
	createProject,
	loadProject,
	PROJECT_SCHEMA_VERSION,
	PROJECT_STORAGE_KEY,
	saveProject,
	type StorageLike
} from './project-state';

function memoryStorage(initial?: string): StorageLike & { value: () => string | null } {
	let stored = initial ?? null;
	return {
		getItem: () => stored,
		setItem: (_key, value) => {
			stored = value;
		},
		removeItem: () => {
			stored = null;
		},
		value: () => stored
	};
}

describe('versioned project state', () => {
	it('round-trips a current project', () => {
		const storage = memoryStorage();
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-1');
		saveProject(storage, project, new Date('2026-08-31T10:01:00Z'));

		expect(loadProject(storage)).toEqual({
			status: 'ready',
			project: {
				...project,
				updatedAt: '2026-08-31T10:01:00.000Z'
			}
		});
	});

	it('clears corrupt state instead of crashing', () => {
		const storage = memoryStorage('{ definitely not json');
		expect(loadProject(storage)).toEqual({ status: 'recovered', project: null });
		expect(storage.value()).toBeNull();
	});

	it('clears state from an unsupported schema version', () => {
		const storage = memoryStorage(
			JSON.stringify({
				schemaVersion: PROJECT_SCHEMA_VERSION + 1,
				id: 'future-project',
				createdAt: '2026-08-31T10:00:00.000Z',
				updatedAt: '2026-08-31T10:00:00.000Z',
				stage: 'welcome'
			})
		);

		expect(loadProject(storage).status).toBe('recovered');
		expect(storage.value()).toBeNull();
	});

	it('removes the active project on start over', () => {
		const storage = memoryStorage('saved');
		clearProject(storage);
		expect(storage.value()).toBeNull();
	});

	it('uses the stable storage key', () => {
		expect(PROJECT_STORAGE_KEY).toBe('ideation-akinator:active-project');
	});
});
