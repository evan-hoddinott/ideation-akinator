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
		expect(project.concepts).toEqual({ status: 'idle', portfolio: null });
		expect(project.featureWorkshop).toEqual({
			status: 'idle',
			configurations: [],
			selectedConceptId: null,
			confirmedAt: null
		});
		expect(project.finalization).toEqual({
			configurationFingerprint: null,
			research: { jobId: null, status: 'idle', result: null },
			plan: null
		});
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
			schemaVersion: PROJECT_SCHEMA_VERSION,
			id: 'old-project',
			stage: 'problem',
			createdAt: '2026-08-31T10:00:00.000Z',
			updatedAt: '2026-08-31T10:01:00.000Z'
		});
		expect(result.project.problemInput.cards).toHaveLength(1);
		expect(JSON.parse(storage.value() ?? '{}').schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
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

	it('migrates slice-three intake into an empty recoverable research room', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-3');
		const versionThree = { ...project, schemaVersion: 3 };
		delete (versionThree as Partial<typeof project>).research;
		const storage = memoryStorage(JSON.stringify(versionThree));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.research).toEqual({ jobId: null, status: 'idle', result: null });
		expect(loaded.project.interview.status).toBe('not-started');
	});

	it('migrates slice-four research into an empty interview without losing the research state', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-4');
		const versionFour = { ...project, schemaVersion: 4 };
		delete (versionFour as Partial<typeof project>).interview;
		const storage = memoryStorage(JSON.stringify(versionFour));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.research).toEqual(project.research);
		expect(loaded.project.interview).toMatchObject({ status: 'not-started', questions: [] });
	});

	it('migrates slice-five interview state and adds the local Sage director', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-5');
		project.interview.status = 'active';
		project.interview.questions = [
			{
				id: 'audience',
				prompt: 'Who needs this first?',
				whyItMatters: 'The first audience changes the prototype.',
				type: 'yes-no',
				options: [],
				unit: null,
				minimum: null,
				maximum: null
			}
		];
		const versionFive = { ...project, schemaVersion: 5 };
		delete (versionFive as Partial<typeof project>).personality;
		const storage = memoryStorage(JSON.stringify(versionFive));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.interview.status).toBe('active');
		expect(loaded.project.personality).toMatchObject({
			mood: 'neutral',
			confidence: 'static',
			muted: true,
			calmMode: false
		});
	});

	it('migrates slice-six personality state into an empty concept room', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-6');
		const versionSix = { ...project, schemaVersion: 6 };
		delete (versionSix as Partial<typeof project>).concepts;
		const storage = memoryStorage(JSON.stringify(versionSix));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.personality).toEqual(project.personality);
		expect(loaded.project.concepts).toEqual({ status: 'idle', portfolio: null });
	});

	it('migrates slice-seven concept state into a separate feature configuration for every idea', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-7');
		const versionSeven = { ...project, schemaVersion: 7 };
		delete (versionSeven as Partial<typeof project>).featureWorkshop;
		const storage = memoryStorage(JSON.stringify(versionSeven));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.featureWorkshop).toEqual({
			status: 'idle',
			configurations: [],
			selectedConceptId: null,
			confirmedAt: null
		});
	});

	it('migrates slice-eight feature state into an empty finalization room', () => {
		const project = createProject(new Date('2026-08-31T10:00:00Z'), 'project-8');
		const versionEight = { ...project, schemaVersion: 8 } as Record<string, unknown>;
		delete versionEight.finalization;
		const storage = memoryStorage(JSON.stringify(versionEight));

		const loaded = loadProject(storage);
		expect(loaded.status).toBe('migrated');
		if (loaded.status !== 'migrated') throw new Error('expected migrated project');
		expect(loaded.project.finalization).toEqual({
			configurationFingerprint: null,
			research: { jobId: null, status: 'idle', result: null },
			plan: null
		});
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
