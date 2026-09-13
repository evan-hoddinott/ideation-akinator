import type { MoneyRange } from '$lib/concepts';
import {
	parseBroadResearchResult,
	type BroadResearchResult,
	type ResearchJobStatus,
	type ResearchProgress
} from '$lib/research';

export const FOCUSED_RESEARCH_CATEGORIES = [
	'direct-competitors',
	'substitutes',
	'feature-overlap',
	'technical-constraints',
	'regulatory-constraints',
	'contrary-evidence',
	'cost-feasibility'
] as const;

export type FocusedResearchCategory = (typeof FOCUSED_RESEARCH_CATEGORIES)[number];
export type FocusedVerdict = 'supported' | 'caution' | 'weakened';
export type FeatureOverlapStatus = 'common' | 'partial' | 'unusual';

export interface SelectedFeatureInput {
	id: string;
	name: string;
	description: string;
	tier: 'core' | 'recommended' | 'optional' | 'custom';
	dependencies: string[];
}

export type DeferredFeatureInput = Pick<SelectedFeatureInput, 'id' | 'name' | 'description'>;

export interface SelectedConceptInput {
	isStretch?: boolean;
	id: string;
	name: string;
	pitch: string;
	description: string;
	targetUser: string;
	distinctApproach: string;
	prototypeBudget: MoneyRange;
	productionBudget: MoneyRange | null;
	prototypeTimeline: string;
}

export interface FocusedResearchRequest {
	projectId: string;
	topic: string;
	problems: string[];
	selectedConcept: SelectedConceptInput;
	includedFeatures: SelectedFeatureInput[];
	deferredFeatures?: DeferredFeatureInput[];
	constraints: Record<string, string>;
	prototypeBudgetUsd: number;
	includeProductionPlanning: boolean;
	productionBudgetUsd: number | null;
	broadResearch: BroadResearchResult;
}

export interface FocusedResearchSource {
	id: string;
	url: string;
	title: string;
	publisher: string;
	publicationDate: string | null;
	retrievedAt: string;
	stage: 'focused';
	evidenceSummary: string;
}

export interface FocusedResearchFinding {
	id: string;
	category: FocusedResearchCategory;
	title: string;
	claim: string;
	interpretation: string | null;
	sourceIds: string[];
}

export interface FocusedFeatureOverlap {
	featureId: string;
	status: FeatureOverlapStatus;
	explanation: string;
	sourceIds: string[];
}

export interface FocusedCompetitorRow {
	name: string;
	type: 'direct' | 'substitute';
	overlappingFeatures: string[];
	missingFeatures: string[];
	comparison: string;
	sourceIds: string[];
}

export interface FocusedResearchGap {
	category: FocusedResearchCategory;
	reason: string;
}

export interface MaterialConflict {
	id: string;
	kind: 'budget' | 'technology' | 'deadline' | 'scope' | 'other';
	description: string;
	sourceIds: string[];
}

export interface FocusedResearchResult {
	materialConflicts?: MaterialConflict[];
	summary: string;
	verdict: FocusedVerdict;
	verdictRationale: string;
	findings: FocusedResearchFinding[];
	featureOverlap: FocusedFeatureOverlap[];
	competitorMatrix: FocusedCompetitorRow[];
	recommendations: string[];
	sources: FocusedResearchSource[];
	gaps: FocusedResearchGap[];
	retrievedAt: string;
	disclaimer: string;
}

export interface FocusedResearchJobView {
	id: string;
	status: ResearchJobStatus;
	progress: ResearchProgress;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	message: string | null;
	result: FocusedResearchResult | null;
	tokenUsage: number;
}

export interface FunctionalRequirement {
	id: string;
	name: string;
	description: string;
	acceptanceCriteria: string[];
}

export interface NonfunctionalRequirement {
	category: string;
	requirement: string;
	measure: string;
}

export interface TechnologyRecommendation {
	area: string;
	choice: string;
	rationale: string;
}

export interface FinalFeatureDependency {
	featureId: string;
	dependsOnFeatureIds: string[];
	explanation: string;
}

export interface FinalCompetitorPosition {
	competitorName: string;
	type: 'direct' | 'substitute';
	overlap: string;
	differentiation: string;
	sourceIds: string[];
}

export interface FinalRisk {
	risk: string;
	mitigation: string;
	evidenceSourceIds: string[];
}

export interface FinalValidationStep {
	hypothesis: string;
	method: string;
	successSignal: string;
}

export interface FinalDevelopmentPhase {
	name: string;
	goal: string;
	deliverables: string[];
}

export interface FinalProjectPlan {
	selectedConceptId: string;
	productName: string;
	oneLineSummary: string;
	executiveSummary: string;
	confirmedFeatures: SelectedFeatureInput[];
	deferredFeatures?: DeferredFeatureInput[];
	prototypeBudget: MoneyRange;
	productionBudget: MoneyRange | null;
	prototypeTimeline: string;
	functionalRequirements: FunctionalRequirement[];
	nonfunctionalRequirements: NonfunctionalRequirement[];
	technologyRecommendations: TechnologyRecommendation[];
	hardwareManufacturingRequirements: string[];
	featureDependencies: FinalFeatureDependency[];
	technicalDifficulty: 'low' | 'medium' | 'high';
	technicalDifficultyRationale: string;
	competitorPositioning: FinalCompetitorPosition[];
	risks: FinalRisk[];
	validationSteps: FinalValidationStep[];
	developmentPhases: FinalDevelopmentPhase[];
	materialWarning: string | null;
	generatedAt: string;
}

export interface FinalRecalculationRequest extends FocusedResearchRequest {
	focusedResearch: FocusedResearchResult;
}

export interface ProjectFinalization {
	planStatus?: 'idle' | 'running' | 'failed' | 'ready';
	printPresented?: boolean;
	configurationFingerprint: string | null;
	research: {
		jobId: string | null;
		status: 'idle' | ResearchJobStatus;
		result: FocusedResearchResult | null;
	};
	plan: FinalProjectPlan | null;
}

export function createProjectFinalization(): ProjectFinalization {
	return {
		planStatus: 'idle',
		printPresented: false,
		configurationFingerprint: null,
		research: { jobId: null, status: 'idle', result: null },
		plan: null
	};
}

export function finalizationFingerprint(
	conceptId: string,
	features: Array<
		Pick<SelectedFeatureInput, 'id' | 'name' | 'description' | 'tier' | 'dependencies'>
	>,
	deferredFeatures: DeferredFeatureInput[] = []
): string {
	return JSON.stringify({
		conceptId,
		...(deferredFeatures.length
			? { deferredFeatures: [...deferredFeatures].sort((a, b) => a.id.localeCompare(b.id)) }
			: {}),
		features: features
			.map((feature) => ({
				id: feature.id,
				name: feature.name,
				description: feature.description,
				tier: feature.tier,
				dependencies: [...feature.dependencies].sort()
			}))
			.sort((left, right) => left.id.localeCompare(right.id))
	});
}

export function parseFocusedResearchRequest(value: unknown): FocusedResearchRequest | null {
	if (!isRecord(value)) return null;
	const problems = parseStringArray(value.problems, 1, 50, 2_000, 12_000);
	const selectedConcept = parseSelectedConcept(value.selectedConcept);
	const includedFeatures = parseSelectedFeatures(value.includedFeatures);
	const deferredFeatures = parseDeferredFeatures(value.deferredFeatures ?? []);
	if (
		!deferredFeatures ||
		deferredFeatures.some((feature) => includedFeatures?.some((item) => item.id === feature.id))
	)
		return null;
	const constraints = parseConstraints(value.constraints);
	const broadResearch = parseBroadResearchResult(value.broadResearch);
	if (
		!isBoundedString(value.projectId, 1, 100) ||
		!isBoundedString(value.topic, 0, 120) ||
		!problems ||
		!selectedConcept ||
		!includedFeatures ||
		!constraints ||
		!isBudget(value.prototypeBudgetUsd) ||
		typeof value.includeProductionPlanning !== 'boolean' ||
		!isNullableBudget(value.productionBudgetUsd) ||
		(value.includeProductionPlanning && value.productionBudgetUsd === null) ||
		!broadResearch
	)
		return null;

	return {
		projectId: value.projectId.trim(),
		topic: value.topic.trim(),
		problems,
		selectedConcept,
		includedFeatures,
		...(value.deferredFeatures !== undefined ? { deferredFeatures } : {}),
		constraints,
		prototypeBudgetUsd: value.prototypeBudgetUsd,
		includeProductionPlanning: value.includeProductionPlanning,
		productionBudgetUsd: value.productionBudgetUsd,
		broadResearch
	};
}

export function parseFocusedResearchResult(
	value: unknown,
	request?: Pick<FocusedResearchRequest, 'includedFeatures'>
): FocusedResearchResult | null {
	if (!isRecord(value)) return null;
	const materialConflicts = parseArray<MaterialConflict>(
		value.materialConflicts ?? [],
		0,
		10,
		(item) => {
			if (!isRecord(item)) return null;
			const sourceIds = parseStringArray(item.sourceIds, 1, 5, 100, 500);
			return isBoundedString(item.id, 1, 100) &&
				['budget', 'technology', 'deadline', 'scope', 'other'].includes(String(item.kind)) &&
				isBoundedString(item.description, 1, 800) &&
				sourceIds
				? {
						id: item.id,
						kind: item.kind as MaterialConflict['kind'],
						description: item.description.trim(),
						sourceIds
					}
				: null;
		}
	);
	if (
		!materialConflicts ||
		new Set(materialConflicts.map((item) => item.id)).size !== materialConflicts.length
	)
		return null;
	const findings = parseArray(value.findings, 1, 30, parseFocusedFinding);
	const featureOverlap = parseArray(value.featureOverlap, 1, 40, parseFeatureOverlap);
	const competitorMatrix = parseArray(value.competitorMatrix, 1, 12, parseCompetitorRow);
	const recommendations = parseStringArray(value.recommendations, 1, 10, 400, 2_500);
	const sources = parseArray(value.sources, 1, 50, parseFocusedSource);
	const gaps = parseArray(value.gaps, 0, FOCUSED_RESEARCH_CATEGORIES.length, parseFocusedGap);
	if (
		!isBoundedString(value.summary, 1, 2_000) ||
		(value.verdict !== 'supported' &&
			value.verdict !== 'caution' &&
			value.verdict !== 'weakened') ||
		!isBoundedString(value.verdictRationale, 1, 1_000) ||
		!findings ||
		!featureOverlap ||
		!competitorMatrix ||
		!recommendations ||
		!sources ||
		!gaps ||
		!isIsoDate(value.retrievedAt) ||
		!isBoundedString(value.disclaimer, 1, 500)
	)
		return null;

	const sourceIds = new Set(sources.map((source) => source.id));
	if (sourceIds.size !== sources.length) return null;
	const referenced = [
		...materialConflicts.flatMap((conflict) => conflict.sourceIds),
		...findings.flatMap((finding) => finding.sourceIds),
		...featureOverlap.flatMap((overlap) => overlap.sourceIds),
		...competitorMatrix.flatMap((competitor) => competitor.sourceIds)
	];
	if (referenced.some((id) => !sourceIds.has(id))) return null;
	if (request) {
		const expectedIds = new Set(request.includedFeatures.map((feature) => feature.id));
		if (
			featureOverlap.length !== expectedIds.size ||
			new Set(featureOverlap.map((overlap) => overlap.featureId)).size !== expectedIds.size ||
			featureOverlap.some((overlap) => !expectedIds.has(overlap.featureId))
		)
			return null;
	}

	return {
		...(value.materialConflicts !== undefined ? { materialConflicts } : {}),
		summary: value.summary.trim(),
		verdict: value.verdict,
		verdictRationale: value.verdictRationale.trim(),
		findings,
		featureOverlap,
		competitorMatrix,
		recommendations,
		sources,
		gaps,
		retrievedAt: value.retrievedAt,
		disclaimer: value.disclaimer.trim()
	};
}

export function parseFocusedResearchJobView(value: unknown): FocusedResearchJobView | null {
	if (!isRecord(value) || !isResearchStatus(value.status) || !isResearchProgress(value.progress))
		return null;
	const result = value.result === null ? null : parseFocusedResearchResult(value.result);
	if (
		!isBoundedString(value.id, 1, 100) ||
		!isIsoDate(value.createdAt) ||
		!isIsoDate(value.updatedAt) ||
		!isIsoDate(value.expiresAt) ||
		(value.message !== null && typeof value.message !== 'string') ||
		(value.result !== null && !result)
	)
		return null;
	return {
		id: value.id,
		status: value.status,
		progress: value.progress,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		expiresAt: value.expiresAt,
		message: value.message,
		result,
		tokenUsage:
			typeof value.tokenUsage === 'number' &&
			Number.isInteger(value.tokenUsage) &&
			value.tokenUsage >= 0 &&
			value.tokenUsage <= 100_000_000
				? value.tokenUsage
				: 0
	};
}

export function parseFinalRecalculationRequest(value: unknown): FinalRecalculationRequest | null {
	const base = parseFocusedResearchRequest(value);
	if (!base || !isRecord(value)) return null;
	const focusedResearch = parseFocusedResearchResult(value.focusedResearch, base);
	return focusedResearch ? { ...base, focusedResearch } : null;
}

export function parseFinalProjectPlan(
	value: unknown,
	request?: Pick<
		FinalRecalculationRequest,
		| 'selectedConcept'
		| 'includedFeatures'
		| 'deferredFeatures'
		| 'includeProductionPlanning'
		| 'focusedResearch'
	>
): FinalProjectPlan | null {
	if (!isRecord(value)) return null;
	const confirmedFeatures = parseSelectedFeatures(value.confirmedFeatures);
	const deferredFeatures = parseDeferredFeatures(value.deferredFeatures ?? []);
	if (
		!deferredFeatures ||
		deferredFeatures.some((feature) => confirmedFeatures?.some((item) => item.id === feature.id))
	)
		return null;
	if (
		request &&
		JSON.stringify(deferredFeatures) !== JSON.stringify(request.deferredFeatures ?? [])
	)
		return null;
	const prototypeBudget = parseMoneyRange(value.prototypeBudget);
	const productionBudget =
		value.productionBudget === null ? null : parseMoneyRange(value.productionBudget);
	const functionalRequirements = parseArray(
		value.functionalRequirements,
		1,
		30,
		parseFunctionalRequirement
	);
	const nonfunctionalRequirements = parseArray(
		value.nonfunctionalRequirements,
		1,
		20,
		parseNonfunctionalRequirement
	);
	const technologyRecommendations = parseArray(
		value.technologyRecommendations,
		1,
		15,
		parseTechnologyRecommendation
	);
	const hardwareManufacturingRequirements = parseStringArray(
		value.hardwareManufacturingRequirements,
		0,
		20,
		400,
		4_000
	);
	const featureDependencies = parseArray(
		value.featureDependencies,
		1,
		40,
		parseFinalFeatureDependency
	);
	const competitorPositioning = parseArray(
		value.competitorPositioning,
		1,
		12,
		parseFinalCompetitorPosition
	);
	const risks = parseArray(value.risks, 1, 15, parseFinalRisk);
	const validationSteps = parseArray(value.validationSteps, 1, 15, parseValidationStep);
	const developmentPhases = parseArray(value.developmentPhases, 2, 10, parseDevelopmentPhase);
	if (
		!isBoundedString(value.selectedConceptId, 1, 100) ||
		!isBoundedString(value.productName, 2, 120) ||
		!isBoundedString(value.oneLineSummary, 8, 300) ||
		!isBoundedString(value.executiveSummary, 20, 2_000) ||
		!confirmedFeatures ||
		!prototypeBudget ||
		(value.productionBudget !== null && !productionBudget) ||
		!isBoundedString(value.prototypeTimeline, 2, 160) ||
		!functionalRequirements ||
		!nonfunctionalRequirements ||
		!technologyRecommendations ||
		!hardwareManufacturingRequirements ||
		!featureDependencies ||
		(value.technicalDifficulty !== 'low' &&
			value.technicalDifficulty !== 'medium' &&
			value.technicalDifficulty !== 'high') ||
		!isBoundedString(value.technicalDifficultyRationale, 5, 800) ||
		!competitorPositioning ||
		!risks ||
		!validationSteps ||
		!developmentPhases ||
		(value.materialWarning !== null && !isBoundedString(value.materialWarning, 1, 800)) ||
		!isIsoDate(value.generatedAt)
	)
		return null;

	if (request) {
		if (value.selectedConceptId !== request.selectedConcept.id) return null;
		if (request.includeProductionPlanning !== (productionBudget !== null)) return null;
		const expected = new Map(request.includedFeatures.map((feature) => [feature.id, feature]));
		if (confirmedFeatures.length !== expected.size) return null;
		if (confirmedFeatures.some((feature) => expected.get(feature.id)?.name !== feature.name))
			return null;
		const featureIds = new Set(expected.keys());
		if (
			featureDependencies.length !== featureIds.size ||
			new Set(featureDependencies.map((item) => item.featureId)).size !== featureIds.size ||
			featureDependencies.some(
				(item) =>
					!featureIds.has(item.featureId) ||
					item.dependsOnFeatureIds.some((id) => !featureIds.has(id))
			)
		)
			return null;
		const sourceIds = new Set(request.focusedResearch.sources.map((source) => source.id));
		if (
			competitorPositioning.flatMap((item) => item.sourceIds).some((id) => !sourceIds.has(id)) ||
			risks.flatMap((item) => item.evidenceSourceIds).some((id) => !sourceIds.has(id))
		)
			return null;
		if (request.focusedResearch.verdict === 'weakened' && value.materialWarning === null)
			return null;
	}

	return {
		selectedConceptId: value.selectedConceptId,
		productName: value.productName.trim(),
		oneLineSummary: value.oneLineSummary.trim(),
		executiveSummary: value.executiveSummary.trim(),
		confirmedFeatures,
		...(value.deferredFeatures !== undefined ? { deferredFeatures } : {}),
		prototypeBudget,
		productionBudget,
		prototypeTimeline: value.prototypeTimeline.trim(),
		functionalRequirements,
		nonfunctionalRequirements,
		technologyRecommendations,
		hardwareManufacturingRequirements,
		featureDependencies,
		technicalDifficulty: value.technicalDifficulty,
		technicalDifficultyRationale: value.technicalDifficultyRationale.trim(),
		competitorPositioning,
		risks,
		validationSteps,
		developmentPhases,
		materialWarning: value.materialWarning === null ? null : value.materialWarning.trim(),
		generatedAt: value.generatedAt
	};
}

export function parseProjectFinalization(value: unknown): ProjectFinalization | null {
	if (!isRecord(value) || !isRecord(value.research)) return null;
	const status = value.research.status;
	const result =
		value.research.result === null ? null : parseFocusedResearchResult(value.research.result);
	const plan = value.plan === null ? null : parseFinalProjectPlan(value.plan);
	if (
		(value.configurationFingerprint !== null &&
			typeof value.configurationFingerprint !== 'string') ||
		(value.research.jobId !== null && typeof value.research.jobId !== 'string') ||
		(value.planStatus !== undefined &&
			!['idle', 'running', 'failed', 'ready'].includes(String(value.planStatus))) ||
		(value.printPresented !== undefined && typeof value.printPresented !== 'boolean') ||
		(status !== 'idle' && !isResearchStatus(status)) ||
		(value.research.result !== null && !result) ||
		(value.plan !== null && !plan) ||
		((status === 'queued' || status === 'running') && typeof value.research.jobId !== 'string')
	)
		return null;
	return {
		...(value.planStatus !== undefined
			? { planStatus: value.planStatus as ProjectFinalization['planStatus'] }
			: {}),
		...(value.printPresented !== undefined ? { printPresented: value.printPresented } : {}),
		configurationFingerprint: value.configurationFingerprint,
		research: { jobId: value.research.jobId, status, result },
		plan
	};
}

function parseSelectedConcept(value: unknown): SelectedConceptInput | null {
	if (!isRecord(value)) return null;
	const prototypeBudget = parseMoneyRange(value.prototypeBudget);
	const productionBudget =
		value.productionBudget === null ? null : parseMoneyRange(value.productionBudget);
	return isBoundedString(value.id, 1, 100) &&
		isBoundedString(value.name, 2, 100) &&
		(value.isStretch === undefined || typeof value.isStretch === 'boolean') &&
		isBoundedString(value.pitch, 8, 240) &&
		isBoundedString(value.description, 20, 1_200) &&
		isBoundedString(value.targetUser, 3, 300) &&
		isBoundedString(value.distinctApproach, 3, 240) &&
		prototypeBudget &&
		(value.productionBudget === null || productionBudget) &&
		isBoundedString(value.prototypeTimeline, 2, 120)
		? {
				id: value.id.trim(),
				name: value.name.trim(),
				...(value.isStretch !== undefined ? { isStretch: value.isStretch } : {}),
				pitch: value.pitch.trim(),
				description: value.description.trim(),
				targetUser: value.targetUser.trim(),
				distinctApproach: value.distinctApproach.trim(),
				prototypeBudget,
				productionBudget,
				prototypeTimeline: value.prototypeTimeline.trim()
			}
		: null;
}

function parseDeferredFeatures(value: unknown): DeferredFeatureInput[] | null {
	const parsed = parseArray<DeferredFeatureInput>(value, 0, 40, (item) =>
		isRecord(item) &&
		isBoundedString(item.id, 1, 100) &&
		isBoundedString(item.name, 1, 120) &&
		isBoundedString(item.description, 1, 500)
			? { id: item.id.trim(), name: item.name.trim(), description: item.description.trim() }
			: null
	);
	return parsed && new Set(parsed.map((item) => item.id)).size === parsed.length ? parsed : null;
}

function parseSelectedFeatures(value: unknown): SelectedFeatureInput[] | null {
	const parsed = parseArray<SelectedFeatureInput>(value, 1, 40, (entry) => {
		if (!isRecord(entry)) return null;
		const dependencies = parseStringArray(entry.dependencies, 0, 20, 100, 1_000);
		return isBoundedString(entry.id, 1, 100) &&
			isBoundedString(entry.name, 1, 120) &&
			isBoundedString(entry.description, 1, 500) &&
			(entry.tier === 'core' ||
				entry.tier === 'recommended' ||
				entry.tier === 'optional' ||
				entry.tier === 'custom') &&
			dependencies
			? {
					id: entry.id.trim(),
					name: entry.name.trim(),
					description: entry.description.trim(),
					tier: entry.tier as SelectedFeatureInput['tier'],
					dependencies
				}
			: null;
	});
	if (!parsed || new Set(parsed.map((feature) => feature.id)).size !== parsed.length) return null;
	const ids = new Set(parsed.map((feature) => feature.id));
	return parsed.some((feature) => feature.dependencies.some((id) => !ids.has(id))) ? null : parsed;
}

function parseFocusedSource(value: unknown): FocusedResearchSource | null {
	if (!isRecord(value)) return null;
	const url = normalizeHttpsUrl(value.url);
	return url &&
		isBoundedString(value.id, 1, 100) &&
		isBoundedString(value.title, 1, 240) &&
		isBoundedString(value.publisher, 0, 160) &&
		(value.publicationDate === null || isSimpleDate(value.publicationDate)) &&
		isIsoDate(value.retrievedAt) &&
		value.stage === 'focused' &&
		isBoundedString(value.evidenceSummary, 1, 500)
		? {
				id: value.id,
				url,
				title: value.title.trim(),
				publisher: value.publisher.trim(),
				publicationDate: value.publicationDate,
				retrievedAt: value.retrievedAt,
				stage: 'focused',
				evidenceSummary: value.evidenceSummary.trim()
			}
		: null;
}

function parseFocusedFinding(value: unknown): FocusedResearchFinding | null {
	if (
		!isRecord(value) ||
		!FOCUSED_RESEARCH_CATEGORIES.includes(value.category as FocusedResearchCategory)
	)
		return null;
	const sourceIds = parseStringArray(value.sourceIds, 1, 5, 100, 500);
	return isBoundedString(value.id, 1, 100) &&
		isBoundedString(value.title, 1, 140) &&
		isBoundedString(value.claim, 1, 700) &&
		(value.interpretation === null || isBoundedString(value.interpretation, 1, 500)) &&
		sourceIds
		? {
				id: value.id,
				category: value.category as FocusedResearchCategory,
				title: value.title.trim(),
				claim: value.claim.trim(),
				interpretation: value.interpretation === null ? null : value.interpretation.trim(),
				sourceIds
			}
		: null;
}

function parseFeatureOverlap(value: unknown): FocusedFeatureOverlap | null {
	if (!isRecord(value)) return null;
	const sourceIds = parseStringArray(value.sourceIds, 1, 5, 100, 500);
	return isBoundedString(value.featureId, 1, 100) &&
		(value.status === 'common' || value.status === 'partial' || value.status === 'unusual') &&
		isBoundedString(value.explanation, 1, 500) &&
		sourceIds
		? {
				featureId: value.featureId,
				status: value.status,
				explanation: value.explanation.trim(),
				sourceIds
			}
		: null;
}

function parseCompetitorRow(value: unknown): FocusedCompetitorRow | null {
	if (!isRecord(value)) return null;
	const overlappingFeatures = parseStringArray(value.overlappingFeatures, 0, 20, 120, 1_500);
	const missingFeatures = parseStringArray(value.missingFeatures, 0, 20, 120, 1_500);
	const sourceIds = parseStringArray(value.sourceIds, 1, 5, 100, 500);
	return isBoundedString(value.name, 1, 160) &&
		(value.type === 'direct' || value.type === 'substitute') &&
		overlappingFeatures &&
		missingFeatures &&
		isBoundedString(value.comparison, 1, 700) &&
		sourceIds
		? {
				name: value.name.trim(),
				type: value.type,
				overlappingFeatures,
				missingFeatures,
				comparison: value.comparison.trim(),
				sourceIds
			}
		: null;
}

function parseFocusedGap(value: unknown): FocusedResearchGap | null {
	return isRecord(value) &&
		FOCUSED_RESEARCH_CATEGORIES.includes(value.category as FocusedResearchCategory) &&
		isBoundedString(value.reason, 1, 300)
		? { category: value.category as FocusedResearchCategory, reason: value.reason.trim() }
		: null;
}

function parseFunctionalRequirement(value: unknown): FunctionalRequirement | null {
	if (!isRecord(value)) return null;
	const acceptanceCriteria = parseStringArray(value.acceptanceCriteria, 1, 8, 300, 1_500);
	return isBoundedString(value.id, 1, 40) &&
		isBoundedString(value.name, 1, 160) &&
		isBoundedString(value.description, 1, 700) &&
		acceptanceCriteria
		? {
				id: value.id.trim(),
				name: value.name.trim(),
				description: value.description.trim(),
				acceptanceCriteria
			}
		: null;
}

function parseNonfunctionalRequirement(value: unknown): NonfunctionalRequirement | null {
	return isRecord(value) &&
		isBoundedString(value.category, 1, 100) &&
		isBoundedString(value.requirement, 1, 500) &&
		isBoundedString(value.measure, 1, 300)
		? {
				category: value.category.trim(),
				requirement: value.requirement.trim(),
				measure: value.measure.trim()
			}
		: null;
}

function parseTechnologyRecommendation(value: unknown): TechnologyRecommendation | null {
	return isRecord(value) &&
		isBoundedString(value.area, 1, 100) &&
		isBoundedString(value.choice, 1, 300) &&
		isBoundedString(value.rationale, 1, 500)
		? { area: value.area.trim(), choice: value.choice.trim(), rationale: value.rationale.trim() }
		: null;
}

function parseFinalFeatureDependency(value: unknown): FinalFeatureDependency | null {
	if (!isRecord(value)) return null;
	const dependsOnFeatureIds = parseStringArray(value.dependsOnFeatureIds, 0, 20, 100, 1_000);
	return isBoundedString(value.featureId, 1, 100) &&
		dependsOnFeatureIds &&
		isBoundedString(value.explanation, 1, 500)
		? { featureId: value.featureId, dependsOnFeatureIds, explanation: value.explanation.trim() }
		: null;
}

function parseFinalCompetitorPosition(value: unknown): FinalCompetitorPosition | null {
	if (!isRecord(value)) return null;
	const sourceIds = parseStringArray(value.sourceIds, 1, 5, 100, 500);
	return isBoundedString(value.competitorName, 1, 160) &&
		(value.type === 'direct' || value.type === 'substitute') &&
		isBoundedString(value.overlap, 1, 500) &&
		isBoundedString(value.differentiation, 1, 500) &&
		sourceIds
		? {
				competitorName: value.competitorName.trim(),
				type: value.type,
				overlap: value.overlap.trim(),
				differentiation: value.differentiation.trim(),
				sourceIds
			}
		: null;
}

function parseFinalRisk(value: unknown): FinalRisk | null {
	if (!isRecord(value)) return null;
	const evidenceSourceIds = parseStringArray(value.evidenceSourceIds, 0, 5, 100, 500);
	return isBoundedString(value.risk, 1, 500) &&
		isBoundedString(value.mitigation, 1, 500) &&
		evidenceSourceIds
		? { risk: value.risk.trim(), mitigation: value.mitigation.trim(), evidenceSourceIds }
		: null;
}

function parseValidationStep(value: unknown): FinalValidationStep | null {
	return isRecord(value) &&
		isBoundedString(value.hypothesis, 1, 500) &&
		isBoundedString(value.method, 1, 500) &&
		isBoundedString(value.successSignal, 1, 500)
		? {
				hypothesis: value.hypothesis.trim(),
				method: value.method.trim(),
				successSignal: value.successSignal.trim()
			}
		: null;
}

function parseDevelopmentPhase(value: unknown): FinalDevelopmentPhase | null {
	if (!isRecord(value)) return null;
	const deliverables = parseStringArray(value.deliverables, 1, 10, 300, 1_500);
	return isBoundedString(value.name, 1, 120) && isBoundedString(value.goal, 1, 500) && deliverables
		? { name: value.name.trim(), goal: value.goal.trim(), deliverables }
		: null;
}

function parseMoneyRange(value: unknown): MoneyRange | null {
	if (!isRecord(value)) return null;
	const assumptions = parseStringArray(value.assumptions, 1, 8, 300, 1_500);
	return isBudget(value.minimumUsd) &&
		isBudget(value.maximumUsd) &&
		value.minimumUsd <= value.maximumUsd &&
		assumptions
		? { minimumUsd: value.minimumUsd, maximumUsd: value.maximumUsd, assumptions }
		: null;
}

function parseConstraints(value: unknown): Record<string, string> | null {
	if (!isRecord(value) || Object.keys(value).length > 20) return null;
	if (
		Object.entries(value).some(
			([key, entry]) => key.length > 80 || typeof entry !== 'string' || entry.length > 500
		)
	)
		return null;
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => [key, (entry as string).trim()])
	);
}

function parseArray<T>(
	value: unknown,
	minimum: number,
	maximum: number,
	parser: (entry: unknown) => T | null
): T[] | null {
	if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return null;
	const parsed = value.map(parser);
	return parsed.some((entry) => !entry) ? null : (parsed as T[]);
}

function parseStringArray(
	value: unknown,
	minimum: number,
	maximum: number,
	itemMaximum: number,
	totalMaximum: number
): string[] | null {
	if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return null;
	const parsed = value.map((entry) => (typeof entry === 'string' ? entry.trim() : ''));
	if (
		parsed.some((entry) => !entry || entry.length > itemMaximum) ||
		parsed.reduce((total, entry) => total + entry.length, 0) > totalMaximum
	)
		return null;
	return parsed;
}

function normalizeHttpsUrl(value: unknown): string | null {
	if (typeof value !== 'string' || value.length > 2_048) return null;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
		parsed.hash = '';
		return parsed.href;
	} catch {
		return null;
	}
}

function isResearchStatus(value: unknown): value is ResearchJobStatus {
	return (
		value === 'queued' ||
		value === 'running' ||
		value === 'completed' ||
		value === 'partial' ||
		value === 'failed' ||
		value === 'cancelled'
	);
}

function isResearchProgress(value: unknown): value is ResearchProgress {
	return (
		value === 'queued' ||
		value === 'starting' ||
		value === 'researching' ||
		value === 'checking-sources' ||
		value === 'retrying-structure' ||
		value === 'complete'
	);
}

function isSimpleDate(value: unknown): value is string {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
	return typeof value === 'string' && value.trim().length >= minimum && value.length <= maximum;
}
function isBudget(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
	);
}
function isNullableBudget(value: unknown): value is number | null {
	return value === null || isBudget(value);
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
