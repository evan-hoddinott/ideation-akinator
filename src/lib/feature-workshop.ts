import type { ConceptPortfolio, ProjectConcept } from '$lib/concepts';

export const FEATURE_TIERS = ['core', 'recommended', 'optional', 'custom'] as const;

export type FeatureTier = (typeof FEATURE_TIERS)[number];

export interface WorkshopFeature {
	id: string;
	name: string;
	description: string;
	tier: FeatureTier;
	included: boolean;
	dependencies: string[];
	isCustom: boolean;
}

export interface ConceptFeatureConfiguration {
	conceptId: string;
	features: WorkshopFeature[];
}

export interface FeatureWorkshopState {
	status: 'idle' | 'editing' | 'confirmed';
	configurations: ConceptFeatureConfiguration[];
	selectedConceptId: string | null;
	confirmedAt: string | null;
}

export interface FeatureToggleResult {
	state: FeatureWorkshopState;
	requiresConfirmation: WorkshopFeature[];
	blockedBy: WorkshopFeature[];
}

export function createFeatureWorkshop(portfolio: ConceptPortfolio | null): FeatureWorkshopState {
	if (!portfolio) {
		return { status: 'idle', configurations: [], selectedConceptId: null, confirmedAt: null };
	}

	return {
		status: 'editing',
		configurations: portfolio.concepts.map(createFeatureConfiguration),
		selectedConceptId: null,
		confirmedAt: null
	};
}

export function parseFeatureWorkshopState(value: unknown): FeatureWorkshopState | null {
	if (!isRecord(value)) return null;
	if (value.status !== 'idle' && value.status !== 'editing' && value.status !== 'confirmed') {
		return null;
	}
	if (!Array.isArray(value.configurations)) return null;

	const configurations = value.configurations.map(parseConfiguration);
	if (configurations.some((configuration) => !configuration)) return null;
	const parsedConfigurations = configurations as ConceptFeatureConfiguration[];
	if (
		new Set(parsedConfigurations.map((configuration) => configuration.conceptId)).size !==
		parsedConfigurations.length
	) {
		return null;
	}

	const selectedConceptId =
		value.selectedConceptId === null || typeof value.selectedConceptId === 'string'
			? value.selectedConceptId
			: undefined;
	const confirmedAt =
		value.confirmedAt === null || isIsoDate(value.confirmedAt) ? value.confirmedAt : undefined;
	if (selectedConceptId === undefined || confirmedAt === undefined) return null;
	if (
		selectedConceptId !== null &&
		!parsedConfigurations.some((configuration) => configuration.conceptId === selectedConceptId)
	) {
		return null;
	}
	if (value.status === 'idle' && parsedConfigurations.length !== 0) return null;
	if (value.status === 'confirmed' && (!selectedConceptId || !confirmedAt)) return null;
	if (value.status !== 'confirmed' && confirmedAt !== null) return null;
	if (
		parsedConfigurations.some((configuration) => !configurationDependenciesExist(configuration))
	) {
		return null;
	}

	return {
		status: value.status,
		configurations: parsedConfigurations,
		selectedConceptId,
		confirmedAt
	};
}

export function toggleWorkshopFeature(
	state: FeatureWorkshopState,
	conceptId: string,
	featureId: string,
	included: boolean,
	confirmDependencies = false
): FeatureToggleResult {
	const configuration = state.configurations.find((item) => item.conceptId === conceptId);
	const feature = configuration?.features.find((item) => item.id === featureId);
	if (!configuration || !feature || feature.included === included) {
		return { state, requiresConfirmation: [], blockedBy: [] };
	}

	if (!included) {
		const blockedBy = configuration.features.filter(
			(item) => item.included && item.dependencies.includes(featureId)
		);
		if (blockedBy.length) return { state, requiresConfirmation: [], blockedBy };
	}

	const requiredIds = included
		? collectMissingDependencies(configuration, feature).filter((id) => id !== featureId)
		: [];
	const requiresConfirmation = requiredIds
		.map((id) => configuration.features.find((item) => item.id === id))
		.filter((item): item is WorkshopFeature => !!item);
	if (requiresConfirmation.length && !confirmDependencies) {
		return { state, requiresConfirmation, blockedBy: [] };
	}

	const idsToInclude = new Set([featureId, ...requiredIds]);
	const configurations = state.configurations.map((item) =>
		item.conceptId !== conceptId
			? item
			: {
					...item,
					features: item.features.map((candidate) =>
						included
							? idsToInclude.has(candidate.id)
								? { ...candidate, included: true }
								: candidate
							: candidate.id === featureId
								? { ...candidate, included: false }
								: candidate
					)
				}
	);

	return {
		state: markConfigurationEdited(state, conceptId, configurations),
		requiresConfirmation: [],
		blockedBy: []
	};
}

export function addCustomFeature(
	state: FeatureWorkshopState,
	conceptId: string,
	feature: Pick<WorkshopFeature, 'id' | 'name' | 'description' | 'dependencies'>
): FeatureWorkshopState {
	const configuration = state.configurations.find((item) => item.conceptId === conceptId);
	const name = feature.name.trim();
	const description = feature.description.trim();
	if (
		!configuration ||
		!name ||
		!description ||
		configuration.features.some((item) => normalize(item.name) === normalize(name)) ||
		configuration.features.some((item) => item.id === feature.id) ||
		feature.dependencies.some((dependency) =>
			configuration.features.every((item) => item.id !== dependency)
		)
	) {
		return state;
	}

	const custom: WorkshopFeature = {
		id: feature.id,
		name,
		description,
		tier: 'custom',
		included: true,
		dependencies: Array.from(new Set(feature.dependencies)),
		isCustom: true
	};
	const dependenciesToInclude = new Set(custom.dependencies);
	for (const dependencyId of custom.dependencies) {
		const dependency = configuration.features.find((item) => item.id === dependencyId);
		if (!dependency) continue;
		for (const transitiveId of collectMissingDependencies(configuration, dependency)) {
			dependenciesToInclude.add(transitiveId);
		}
	}
	const configurations = state.configurations.map((item) =>
		item.conceptId === conceptId
			? {
					...item,
					features: [
						...item.features.map((candidate) =>
							dependenciesToInclude.has(candidate.id) ? { ...candidate, included: true } : candidate
						),
						custom
					]
				}
			: item
	);
	return markConfigurationEdited(state, conceptId, configurations);
}

export function removeCustomFeature(
	state: FeatureWorkshopState,
	conceptId: string,
	featureId: string
): FeatureToggleResult {
	const configuration = state.configurations.find((item) => item.conceptId === conceptId);
	const feature = configuration?.features.find((item) => item.id === featureId);
	if (!configuration || !feature?.isCustom) {
		return { state, requiresConfirmation: [], blockedBy: [] };
	}
	const blockedBy = configuration.features.filter((item) => item.dependencies.includes(featureId));
	if (blockedBy.length) return { state, requiresConfirmation: [], blockedBy };

	const configurations = state.configurations.map((item) =>
		item.conceptId === conceptId
			? { ...item, features: item.features.filter((candidate) => candidate.id !== featureId) }
			: item
	);
	return {
		state: markConfigurationEdited(state, conceptId, configurations),
		requiresConfirmation: [],
		blockedBy: []
	};
}

export function confirmWorkshopConcept(
	state: FeatureWorkshopState,
	conceptId: string,
	confirmedAt = new Date()
): FeatureWorkshopState {
	const configuration = state.configurations.find((item) => item.conceptId === conceptId);
	if (!configuration || !configuration.features.some((feature) => feature.included)) return state;
	const includedIds = new Set(
		configuration.features.filter((feature) => feature.included).map((feature) => feature.id)
	);
	if (
		configuration.features.some(
			(feature) =>
				feature.included && feature.dependencies.some((dependency) => !includedIds.has(dependency))
		)
	) {
		return state;
	}

	return {
		...state,
		status: 'confirmed',
		selectedConceptId: conceptId,
		confirmedAt: confirmedAt.toISOString()
	};
}

function createFeatureConfiguration(concept: ProjectConcept): ConceptFeatureConfiguration {
	const features = concept.proposedFeatures.map((name, index): WorkshopFeature => {
		const tier: FeatureTier = index === 0 ? 'core' : index === 1 ? 'recommended' : 'optional';
		return {
			id: `${concept.id}:feature:${index + 1}`,
			name,
			description:
				tier === 'core'
					? `The smallest usable version of ${concept.name} needs this capability.`
					: tier === 'recommended'
						? 'The Sage recommends this once the core loop is working.'
						: 'Useful, but safe to leave outside the first prototype.',
			tier,
			included: tier !== 'optional',
			dependencies: index === 1 ? [`${concept.id}:feature:1`] : [],
			isCustom: false
		};
	});
	return { conceptId: concept.id, features };
}

function parseConfiguration(value: unknown): ConceptFeatureConfiguration | null {
	if (!isRecord(value) || typeof value.conceptId !== 'string' || !Array.isArray(value.features)) {
		return null;
	}
	const features = value.features.map(parseFeature);
	if (features.some((feature) => !feature)) return null;
	const parsedFeatures = features as WorkshopFeature[];
	if (new Set(parsedFeatures.map((feature) => feature.id)).size !== parsedFeatures.length)
		return null;
	return { conceptId: value.conceptId, features: parsedFeatures };
}

function parseFeature(value: unknown): WorkshopFeature | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.id !== 'string' ||
		typeof value.name !== 'string' ||
		!value.name.trim() ||
		typeof value.description !== 'string' ||
		!value.description.trim() ||
		!FEATURE_TIERS.includes(value.tier as FeatureTier) ||
		typeof value.included !== 'boolean' ||
		typeof value.isCustom !== 'boolean' ||
		!Array.isArray(value.dependencies) ||
		value.dependencies.some((dependency) => typeof dependency !== 'string')
	) {
		return null;
	}
	if (value.isCustom !== (value.tier === 'custom')) return null;
	return {
		id: value.id,
		name: value.name.trim(),
		description: value.description.trim(),
		tier: value.tier as FeatureTier,
		included: value.included,
		dependencies: Array.from(new Set(value.dependencies as string[])),
		isCustom: value.isCustom
	};
}

function configurationDependenciesExist(configuration: ConceptFeatureConfiguration): boolean {
	const ids = new Set(configuration.features.map((feature) => feature.id));
	return configuration.features.every(
		(feature) =>
			!feature.dependencies.includes(feature.id) &&
			feature.dependencies.every((dependency) => ids.has(dependency))
	);
}

function collectMissingDependencies(
	configuration: ConceptFeatureConfiguration,
	feature: WorkshopFeature,
	visited = new Set<string>()
): string[] {
	if (visited.has(feature.id)) return [];
	visited.add(feature.id);
	const missing: string[] = [];
	for (const dependencyId of feature.dependencies) {
		const dependency = configuration.features.find((item) => item.id === dependencyId);
		if (!dependency) continue;
		if (!dependency.included) missing.push(dependency.id);
		missing.push(...collectMissingDependencies(configuration, dependency, visited));
	}
	return Array.from(new Set(missing));
}

function markConfigurationEdited(
	state: FeatureWorkshopState,
	conceptId: string,
	configurations: ConceptFeatureConfiguration[]
): FeatureWorkshopState {
	const changedSelectedConfiguration = state.selectedConceptId === conceptId;
	return {
		...state,
		status: changedSelectedConfiguration ? 'editing' : state.status,
		confirmedAt: changedSelectedConfiguration ? null : state.confirmedAt,
		configurations
	};
}

function normalize(value: string): string {
	return value.trim().toLocaleLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object';
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
