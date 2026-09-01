import { parseProjectInterview, type ProjectInterview } from '$lib/interview';
import { parseBroadResearchResult, type BroadResearchResult } from '$lib/research';

export const COMPARISON_DIMENSIONS = [
	'problem-fit',
	'budget-fit',
	'originality',
	'feasibility',
	'time-to-prototype',
	'market-opportunity',
	'technical-risk'
] as const;

export const CONCEPT_ICONS = [
	'terminal',
	'golem',
	'satellite',
	'grimoire',
	'beacon',
	'workbench'
] as const;

export type ComparisonDimension = (typeof COMPARISON_DIMENSIONS)[number];
export type ConceptIcon = (typeof CONCEPT_ICONS)[number];
export type ConceptRating = 'low' | 'medium' | 'high';

export interface MoneyRange {
	minimumUsd: number;
	maximumUsd: number;
	assumptions: string[];
}

export interface ConceptCompetitor {
	name: string;
	type: 'direct' | 'substitute';
	comparison: string;
	sourceIds: string[];
}

export interface ConceptComparison {
	dimension: ComparisonDimension;
	rating: ConceptRating;
	explanation: string;
}

export interface ProjectConcept {
	id: string;
	name: string;
	pitch: string;
	description: string;
	targetUser: string;
	problemsAddressed: string[];
	distinctApproach: string;
	proposedFeatures: string[];
	highLevelRequirements: string[];
	implementationOutline: string[];
	prototypeBudget: MoneyRange;
	productionBudget: MoneyRange | null;
	prototypeTimeline: string;
	competitors: ConceptCompetitor[];
	mainAdvantage: string;
	majorAssumptions: string[];
	majorRisks: string[];
	confidence: 'low' | 'medium' | 'high';
	evidenceGaps: string[];
	isStretch: boolean;
	isRecommended: boolean;
	archetype: string;
	rarity: string;
	icon: ConceptIcon;
	sageReason: string;
	comparison: ConceptComparison[];
}

export interface ConceptGenerationResult {
	concepts: ProjectConcept[];
}

export interface ConceptPortfolio extends ConceptGenerationResult {
	generationNumber: number;
	generatedAt: string;
}

export interface ProjectConceptState {
	status: 'idle' | 'ready';
	portfolio: ConceptPortfolio | null;
}

export interface RejectedConceptSummary {
	name: string;
	pitch: string;
	distinctApproach: string;
}

export interface ConceptGenerationRequest {
	projectId: string;
	topic: string;
	problems: string[];
	technologyTags: string[];
	industryTags: string[];
	innovationLevel: 1 | 2 | 3 | 4 | 5;
	prototypeBudgetUsd: number;
	includeProductionPlanning: boolean;
	productionBudgetUsd: number | null;
	constraints: Record<string, string>;
	research: BroadResearchResult;
	interview: ProjectInterview;
	rejectedConcepts: RejectedConceptSummary[];
}

export function createConceptState(): ProjectConceptState {
	return { status: 'idle', portfolio: null };
}

export function parseConceptGenerationRequest(value: unknown): ConceptGenerationRequest | null {
	if (!isRecord(value)) return null;
	const problems = parseStringArray(value.problems, 1, 50, 2_000, 12_000);
	const technologyTags = parseStringArray(value.technologyTags, 0, 20, 80, 800);
	const industryTags = parseStringArray(value.industryTags, 0, 20, 80, 800);
	const constraints = parseConstraints(value.constraints);
	const research = parseBroadResearchResult(value.research);
	const interview = parseProjectInterview(value.interview);
	const rejectedConcepts = parseRejectedConcepts(value.rejectedConcepts);
	if (
		typeof value.projectId !== 'string' ||
		value.projectId.length < 1 ||
		value.projectId.length > 100 ||
		typeof value.topic !== 'string' ||
		value.topic.length > 120 ||
		!problems ||
		!technologyTags ||
		!industryTags ||
		!isInnovationLevel(value.innovationLevel) ||
		!isBudget(value.prototypeBudgetUsd) ||
		typeof value.includeProductionPlanning !== 'boolean' ||
		!isNullableBudget(value.productionBudgetUsd) ||
		(value.includeProductionPlanning && value.productionBudgetUsd === null) ||
		!constraints ||
		!research ||
		!interview ||
		(interview.status !== 'completed' && interview.status !== 'ended-early') ||
		!rejectedConcepts
	) {
		return null;
	}

	return {
		projectId: value.projectId,
		topic: value.topic.trim(),
		problems,
		technologyTags,
		industryTags,
		innovationLevel: value.innovationLevel,
		prototypeBudgetUsd: value.prototypeBudgetUsd,
		includeProductionPlanning: value.includeProductionPlanning,
		productionBudgetUsd: value.productionBudgetUsd,
		constraints,
		research,
		interview,
		rejectedConcepts
	};
}

export function parseConceptGenerationResult(
	value: unknown,
	request?: Pick<
		ConceptGenerationRequest,
		'prototypeBudgetUsd' | 'includeProductionPlanning' | 'research' | 'rejectedConcepts'
	>
): ConceptGenerationResult | null {
	if (!isRecord(value) || !Array.isArray(value.concepts) || value.concepts.length !== 4)
		return null;
	const concepts = value.concepts.map(parseConcept);
	if (concepts.some((concept) => !concept)) return null;
	const parsed = concepts as ProjectConcept[];
	if (new Set(parsed.map((concept) => concept.id)).size !== 4) return null;
	if (new Set(parsed.map((concept) => normalize(concept.name))).size !== 4) return null;
	if (new Set(parsed.map((concept) => normalize(concept.distinctApproach))).size !== 4) return null;
	if (parsed.filter((concept) => concept.isRecommended).length !== 1 || !parsed[0].isRecommended)
		return null;
	if (parsed.filter((concept) => concept.isStretch).length !== 1) return null;
	if (parsed[0].isStretch) return null;

	if (request) {
		const sourceIds = new Set(request.research.sources.map((source) => source.id));
		if (
			parsed.some((concept) =>
				concept.competitors.some((competitor) =>
					competitor.sourceIds.some((sourceId) => !sourceIds.has(sourceId))
				)
			)
		) {
			return null;
		}
		if (
			parsed.some((concept) =>
				concept.isStretch
					? concept.prototypeBudget.maximumUsd <= request.prototypeBudgetUsd
					: concept.prototypeBudget.maximumUsd > request.prototypeBudgetUsd
			)
		) {
			return null;
		}
		if (
			parsed.some((concept) =>
				request.includeProductionPlanning
					? concept.productionBudget === null
					: concept.productionBudget !== null
			)
		) {
			return null;
		}
		const rejectedNames = new Set(
			request.rejectedConcepts.map((concept) => normalize(concept.name))
		);
		const rejectedApproaches = new Set(
			request.rejectedConcepts.map((concept) => normalize(concept.distinctApproach))
		);
		if (parsed.some((concept) => rejectedNames.has(normalize(concept.name)))) return null;
		if (parsed.some((concept) => rejectedApproaches.has(normalize(concept.distinctApproach))))
			return null;
	}

	return { concepts: parsed };
}

export function parseConceptPortfolio(value: unknown): ConceptPortfolio | null {
	if (
		!isRecord(value) ||
		!Number.isInteger(value.generationNumber) ||
		typeof value.generationNumber !== 'number' ||
		value.generationNumber < 1 ||
		!isIsoDate(value.generatedAt)
	) {
		return null;
	}
	const result = parseConceptGenerationResult(value);
	return result
		? { ...result, generationNumber: value.generationNumber, generatedAt: value.generatedAt }
		: null;
}

export function parseProjectConceptState(value: unknown): ProjectConceptState | null {
	if (!isRecord(value) || (value.status !== 'idle' && value.status !== 'ready')) return null;
	if (value.status === 'idle') {
		return value.portfolio === null ? { status: 'idle', portfolio: null } : null;
	}
	const portfolio = parseConceptPortfolio(value.portfolio);
	return portfolio ? { status: 'ready', portfolio } : null;
}

function parseConcept(value: unknown): ProjectConcept | null {
	if (!isRecord(value)) return null;
	const problemsAddressed = parseStringArray(value.problemsAddressed, 1, 8, 300, 1_500);
	const proposedFeatures = parseStringArray(value.proposedFeatures, 3, 10, 180, 1_200);
	const highLevelRequirements = parseStringArray(value.highLevelRequirements, 2, 10, 240, 1_600);
	const implementationOutline = parseStringArray(value.implementationOutline, 2, 8, 280, 1_600);
	const majorAssumptions = parseStringArray(value.majorAssumptions, 1, 6, 240, 1_000);
	const majorRisks = parseStringArray(value.majorRisks, 1, 6, 240, 1_000);
	const evidenceGaps = parseStringArray(value.evidenceGaps, 0, 6, 240, 1_000);
	const prototypeBudget = parseMoneyRange(value.prototypeBudget);
	const productionBudget =
		value.productionBudget === null ? null : parseMoneyRange(value.productionBudget);
	if (
		!isBoundedString(value.id, 1, 100) ||
		!isBoundedString(value.name, 2, 100) ||
		!isBoundedString(value.pitch, 8, 240) ||
		!isBoundedString(value.description, 20, 1_200) ||
		!isBoundedString(value.targetUser, 3, 300) ||
		!problemsAddressed ||
		!isBoundedString(value.distinctApproach, 3, 240) ||
		!proposedFeatures ||
		!highLevelRequirements ||
		!implementationOutline ||
		!prototypeBudget ||
		(value.productionBudget !== null && !productionBudget) ||
		!isBoundedString(value.prototypeTimeline, 2, 120) ||
		!Array.isArray(value.competitors) ||
		value.competitors.length < 1 ||
		value.competitors.length > 6 ||
		!isBoundedString(value.mainAdvantage, 5, 500) ||
		!majorAssumptions ||
		!majorRisks ||
		(value.confidence !== 'low' && value.confidence !== 'medium' && value.confidence !== 'high') ||
		!evidenceGaps ||
		typeof value.isStretch !== 'boolean' ||
		typeof value.isRecommended !== 'boolean' ||
		!isBoundedString(value.archetype, 2, 80) ||
		!isBoundedString(value.rarity, 2, 80) ||
		!CONCEPT_ICONS.includes(value.icon as ConceptIcon) ||
		!isBoundedString(value.sageReason, 5, 400) ||
		!Array.isArray(value.comparison) ||
		value.comparison.length !== COMPARISON_DIMENSIONS.length
	) {
		return null;
	}
	const competitors = value.competitors.map(parseCompetitor);
	const comparison = value.comparison.map(parseComparison);
	if (competitors.some((entry) => !entry) || comparison.some((entry) => !entry)) return null;
	if (
		new Set((comparison as ConceptComparison[]).map((entry) => entry.dimension)).size !==
		COMPARISON_DIMENSIONS.length
	)
		return null;

	return {
		id: value.id,
		name: value.name.trim(),
		pitch: value.pitch.trim(),
		description: value.description.trim(),
		targetUser: value.targetUser.trim(),
		problemsAddressed,
		distinctApproach: value.distinctApproach.trim(),
		proposedFeatures,
		highLevelRequirements,
		implementationOutline,
		prototypeBudget,
		productionBudget,
		prototypeTimeline: value.prototypeTimeline.trim(),
		competitors: competitors as ConceptCompetitor[],
		mainAdvantage: value.mainAdvantage.trim(),
		majorAssumptions,
		majorRisks,
		confidence: value.confidence,
		evidenceGaps,
		isStretch: value.isStretch,
		isRecommended: value.isRecommended,
		archetype: value.archetype.trim(),
		rarity: value.rarity.trim(),
		icon: value.icon as ConceptIcon,
		sageReason: value.sageReason.trim(),
		comparison: comparison as ConceptComparison[]
	};
}

function parseMoneyRange(value: unknown): MoneyRange | null {
	if (!isRecord(value)) return null;
	const assumptions = parseStringArray(value.assumptions, 1, 5, 200, 700);
	return isBudget(value.minimumUsd) &&
		isBudget(value.maximumUsd) &&
		value.minimumUsd <= value.maximumUsd &&
		assumptions
		? { minimumUsd: value.minimumUsd, maximumUsd: value.maximumUsd, assumptions }
		: null;
}

function parseCompetitor(value: unknown): ConceptCompetitor | null {
	if (!isRecord(value)) return null;
	const sourceIds = parseStringArray(value.sourceIds, 1, 4, 100, 300);
	return isBoundedString(value.name, 1, 160) &&
		(value.type === 'direct' || value.type === 'substitute') &&
		isBoundedString(value.comparison, 5, 500) &&
		sourceIds
		? { name: value.name.trim(), type: value.type, comparison: value.comparison.trim(), sourceIds }
		: null;
}

function parseComparison(value: unknown): ConceptComparison | null {
	return isRecord(value) &&
		COMPARISON_DIMENSIONS.includes(value.dimension as ComparisonDimension) &&
		(value.rating === 'low' || value.rating === 'medium' || value.rating === 'high') &&
		isBoundedString(value.explanation, 5, 300)
		? {
				dimension: value.dimension as ComparisonDimension,
				rating: value.rating,
				explanation: value.explanation.trim()
			}
		: null;
}

function parseRejectedConcepts(value: unknown): RejectedConceptSummary[] | null {
	if (!Array.isArray(value) || value.length > 4) return null;
	const parsed = value.map((entry) => {
		if (
			!isRecord(entry) ||
			!isBoundedString(entry.name, 2, 100) ||
			!isBoundedString(entry.pitch, 8, 240) ||
			!isBoundedString(entry.distinctApproach, 3, 240)
		)
			return null;
		return {
			name: entry.name.trim(),
			pitch: entry.pitch.trim(),
			distinctApproach: entry.distinctApproach.trim()
		};
	});
	return parsed.some((entry) => !entry) ? null : (parsed as RejectedConceptSummary[]);
}

function parseConstraints(value: unknown): Record<string, string> | null {
	if (!isRecord(value) || Object.keys(value).length > 20) return null;
	const entries = Object.entries(value);
	if (entries.some(([key, entry]) => key.length > 80 || !isBoundedString(entry, 0, 500)))
		return null;
	return Object.fromEntries(entries.map(([key, entry]) => [key, (entry as string).trim()]));
}

function parseStringArray(
	value: unknown,
	minimum: number,
	maximum: number,
	itemMaximum: number,
	totalMaximum: number
): string[] | null {
	if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return null;
	const normalized = value.map((entry) => (typeof entry === 'string' ? entry.trim() : ''));
	if (
		normalized.some((entry) => !entry || entry.length > itemMaximum) ||
		normalized.reduce((total, entry) => total + entry.length, 0) > totalMaximum
	)
		return null;
	return normalized;
}

function normalize(value: string): string {
	return value
		.toLocaleLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
	return typeof value === 'string' && value.trim().length >= minimum && value.length <= maximum;
}

function isInnovationLevel(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
	return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isBudget(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
	);
}

function isNullableBudget(value: unknown): value is number | null {
	return value === null || isBudget(value);
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
