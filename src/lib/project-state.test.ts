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

	it('starts with one empty problem and neutral preference defaults', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-1');

		expect(project.problemInput.cards).toHaveLength(1);
		expect(project.problemInput.cards[0].text).toBe('');
		expect(project.preferences.innovationLevel).toBe(3);
		expect(project.preferences.includeProductionPlanning).toBe(true);
		expect(project.preferences.prototypeBudgetUsd).toBeNull();
	});

	it('migrates a valid slice-one project without changing its identity or stage', () => {
		const storage = memoryStorage(
			JSON.stringify({
				schemaVersion: 1,
				id: 'old-project',
				createdAt: '2026-08-31T10:00:00.000Z',
				updatedAt: '2026-08-31T10:01:00.000Z',
				stage: 'problem'
			})
		);

		const result = loadProject(storage);
		expect(result.status).toBe('migrated');
		if (result.status !== 'migrated') throw new Error('expected migrated project');
		expect(result.project).toMatchObject({
			schemaVersion: 3,
			id: 'old-project',
			stage: 'problem',
			createdAt: '2026-08-31T10:00:00.000Z',
			updatedAt: '2026-08-31T10:01:00.000Z'
		});
		expect(result.project.problemInput.cards).toHaveLength(1);
		expect(JSON.parse(storage.value() ?? '{}').schemaVersion).toBe(3);
	});

	it('migrates slice-two intake data and adds AI suggestion tracking', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-2');
		const versionTwo = {
			...project,
			schemaVersion: 2,
			stage: 'preferences',
			problemInput: {
				topic: 'Campus transit',
				cards: [{ id: 'problem-1', text: 'Students miss route updates.' }],
				clarityLabel: null,
				clarityReasons: [],
				topicCoherenceWarning: null
			},
			preferences: {
				...project.preferences,
				technologyTags: ['Open to anything'],
				selectedIndustryTags: ['Education']
			}
		};
		delete (versionTwo.preferences as Partial<typeof project.preferences>).suggestedIndustryTags;
		const storage = memoryStorage(JSON.stringify(versionTwo));

		const result = loadProject(storage);
		expect(result.status).toBe('migrated');
		if (result.status !== 'migrated') throw new Error('expected migrated project');
		expect(result.project.problemInput.cards[0].text).toBe('Students miss route updates.');
		expect(result.project.preferences.selectedIndustryTags).toEqual(['Education']);
		expect(result.project.preferences.suggestedIndustryTags).toEqual([]);
	});

	it('round-trips validated AI insight fields', () => {
		const storage = memoryStorage();
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-ai');
		project.problemInput.clarityLabel = 'Ready to summon';
		project.problemInput.clarityReasons = ['The group, context, and consequence are clear.'];
		project.problemInput.topicCoherenceWarning = 'One note may concern a separate topic.';
		project.preferences.suggestedIndustryTags = ['Higher Education'];
		saveProject(storage, project);

		expect(loadProject(storage).status).toBe('ready');
	});

	it('clears corrupt state instead of crashing', () => {
		const storage = memoryStorage('{ definitely not json');
		expect(loadProject(storage)).toEqual({ status: 'recovered', project: null });
		expect(storage.value()).toBeNull();
	});

	it('clears state from a future schema version', () => {
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
