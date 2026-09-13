import { CLARITY_LABELS, type ClarityLabel } from '$lib/intake-insights';
import type { ProjectSession } from '$lib/project-state';

export const SCORE_MODIFIERS = {
	'FORBIDDEN FLOPPY': { label: 'TOUCHED CURSED MEDIA', percent: 3 },
	'POPUP JANITOR': { label: 'CLEAN DESKTOP, CLEAN SOUL', percent: 4 },
	'LOCAL WIZARD ENJOYER': { label: 'CLICKED THE OBVIOUS AD', percent: -2 },
	'INSTALLED THE CAT': { label: 'GAVE PURL ROOT', percent: 1 },
	'PURL ACTUALLY HELPED': { label: 'IMPOSSIBLE CAT ASSIST', percent: 5 },
	'CAT HERDER': { label: 'TEMPORARY CAT MANAGEMENT', percent: 2 }
} as const;

export type ScoreAchievement = keyof typeof SCORE_MODIFIERS;

export interface ScoreInput {
	projectId: string;
	projectName: string;
	createdAt: string;
	completedAt: string;
	clarityLabel: ClarityLabel | null;
	problemCount: number;
	broadSourceCount: number;
	broadGapCount: number;
	focusedSourceCount: number;
	focusedGapCount: number;
	focusedVerdict: 'supported' | 'caution' | 'weakened';
	competitorCount: number;
	confirmedFeatureCount: number;
	prototypeBudgetUsd: number;
	prototypeMinimumUsd: number;
	prototypeMaximumUsd: number;
	technicalDifficulty: 'low' | 'medium' | 'high';
	riskCount: number;
	answeredQuestions: number;
	totalQuestions: number;
	interviewEndedEarly: boolean;
	achievements: ScoreAchievement[];
	tokenTotal: number;
	demo: boolean;
}

export interface ScoreFactor {
	id: 'clarity' | 'evidence' | 'differentiation' | 'feasibility' | 'risk' | 'interview';
	label: string;
	points: number;
	maximum: number;
}

export interface ScoreModifier {
	id: ScoreAchievement;
	label: string;
	percent: number;
}

export interface ScoreResult {
	baseScore: number;
	factors: ScoreFactor[];
	modifiers: ScoreModifier[];
	modifierPercent: number;
	finalScore: number;
	label: string;
	comment: string;
	absurdValuationUsd: number;
	tokenTotal: number;
	fakeInvoiceUsd: number;
}

export function buildScoreInput(project: ProjectSession, tokenTotal: number): ScoreInput | null {
	const plan = project.finalization.plan;
	const focused = project.finalization.research.result;
	if (!plan || !focused) return null;
	return {
		projectId: project.id,
		projectName: plan.productName,
		createdAt: project.createdAt,
		completedAt: plan.generatedAt,
		clarityLabel: project.problemInput.clarityLabel,
		problemCount: project.problemInput.cards.filter((card) => card.text.trim()).length,
		broadSourceCount: project.research.result?.sources.length ?? 0,
		broadGapCount: project.research.result?.gaps.length ?? 0,
		focusedSourceCount: focused.sources.length,
		focusedGapCount: focused.gaps.length,
		focusedVerdict: focused.verdict,
		competitorCount: plan.competitorPositioning.length,
		confirmedFeatureCount: plan.confirmedFeatures.length,
		prototypeBudgetUsd: project.preferences.prototypeBudgetUsd ?? 0,
		prototypeMinimumUsd: plan.prototypeBudget.minimumUsd,
		prototypeMaximumUsd: plan.prototypeBudget.maximumUsd,
		technicalDifficulty: plan.technicalDifficulty,
		riskCount: plan.risks.length,
		answeredQuestions: project.interview.answers.filter((answer) => answer.status === 'answered')
			.length,
		totalQuestions: project.interview.questions.length,
		interviewEndedEarly: project.interview.status === 'ended-early',
		achievements: project.personality.achievements.filter(isScoreAchievement),
		tokenTotal: Math.max(0, Math.floor(tokenTotal)),
		demo: project.id.startsWith('demo-')
	};
}

export function parseScoreInput(value: unknown): ScoreInput | null {
	if (!value || typeof value !== 'object') return null;
	const input = value as Partial<ScoreInput>;
	if (
		!boundedString(input.projectId, 1, 100) ||
		!boundedString(input.projectName, 1, 160) ||
		!isIso(input.createdAt) ||
		!isIso(input.completedAt) ||
		Date.parse(input.completedAt ?? '') < Date.parse(input.createdAt ?? '') ||
		(input.clarityLabel !== null && !CLARITY_LABELS.includes(input.clarityLabel as ClarityLabel)) ||
		!integer(input.problemCount, 1, 50) ||
		!integer(input.broadSourceCount, 0, 100) ||
		!integer(input.broadGapCount, 0, 100) ||
		!integer(input.focusedSourceCount, 0, 100) ||
		!integer(input.focusedGapCount, 0, 100) ||
		!['supported', 'caution', 'weakened'].includes(input.focusedVerdict ?? '') ||
		!integer(input.competitorCount, 0, 100) ||
		!integer(input.confirmedFeatureCount, 1, 100) ||
		!money(input.prototypeBudgetUsd) ||
		!money(input.prototypeMinimumUsd) ||
		!money(input.prototypeMaximumUsd) ||
		(input.prototypeMinimumUsd ?? 0) > (input.prototypeMaximumUsd ?? 0) ||
		!['low', 'medium', 'high'].includes(input.technicalDifficulty ?? '') ||
		!integer(input.riskCount, 0, 100) ||
		!integer(input.answeredQuestions, 0, 100) ||
		!integer(input.totalQuestions, 0, 100) ||
		(input.answeredQuestions ?? 0) > (input.totalQuestions ?? 0) ||
		typeof input.interviewEndedEarly !== 'boolean' ||
		!Array.isArray(input.achievements) ||
		input.achievements.some((item) => !isScoreAchievement(item)) ||
		!integer(input.tokenTotal, 0, 100_000_000) ||
		typeof input.demo !== 'boolean'
	)
		return null;
	return {
		...(input as ScoreInput),
		projectName: input.projectName.trim(),
		achievements: Array.from(new Set(input.achievements)) as ScoreAchievement[]
	};
}

export function calculateScore(input: ScoreInput): ScoreResult {
	const clarity =
		input.clarityLabel === null
			? 0
			: clamp(
					8 + CLARITY_LABELS.indexOf(input.clarityLabel) * 4 + Math.min(2, input.problemCount - 1),
					0,
					20
				);
	const evidence = clamp(
		4 +
			input.broadSourceCount +
			input.focusedSourceCount * 1.5 -
			(input.broadGapCount + input.focusedGapCount),
		0,
		20
	);
	const differentiation = clamp(
		8 +
			Math.min(6, input.competitorCount * 2) +
			(input.focusedVerdict === 'supported' ? 6 : input.focusedVerdict === 'caution' ? 3 : 0),
		0,
		20
	);
	const budgetFit =
		input.prototypeMaximumUsd <= input.prototypeBudgetUsd
			? 8
			: input.prototypeMinimumUsd <= input.prototypeBudgetUsd
				? 5
				: 1;
	const difficulty =
		input.technicalDifficulty === 'low' ? 7 : input.technicalDifficulty === 'medium' ? 5 : 2;
	const feasibility = clamp(
		budgetFit + difficulty + Math.min(5, input.confirmedFeatureCount),
		0,
		20
	);
	const risk = clamp(
		10 - Math.max(0, input.riskCount - 2) * 1.5 - (input.focusedVerdict === 'weakened' ? 3 : 0),
		0,
		10
	);
	const ratio = input.totalQuestions ? input.answeredQuestions / input.totalQuestions : 0;
	const interview = clamp(Math.round(ratio * 10) - (input.interviewEndedEarly ? 2 : 0), 0, 10);
	const factors: ScoreFactor[] = [
		{
			id: 'clarity',
			label: input.clarityLabel === null ? 'Problem clarity · not assessed' : 'Problem clarity',
			points: Math.round(clarity),
			maximum: 20
		},
		{ id: 'evidence', label: 'Evidence quality', points: Math.round(evidence), maximum: 20 },
		{
			id: 'differentiation',
			label: 'Differentiation',
			points: Math.round(differentiation),
			maximum: 20
		},
		{
			id: 'feasibility',
			label: 'Feasibility and budget',
			points: Math.round(feasibility),
			maximum: 20
		},
		{ id: 'risk', label: 'Known-risk control', points: Math.round(risk), maximum: 10 },
		{ id: 'interview', label: 'Interview completeness', points: Math.round(interview), maximum: 10 }
	];
	const baseScore = clamp(
		factors.reduce((sum, factor) => sum + factor.points, 0),
		0,
		100
	);
	const modifiers = input.achievements.map((id) => ({ id, ...SCORE_MODIFIERS[id] }));
	const modifierPercent = clamp(
		modifiers.reduce((sum, modifier) => sum + modifier.percent, 0),
		-10,
		15
	);
	const finalScore = Math.round(baseScore * (1 + modifierPercent / 100));
	return {
		baseScore,
		factors,
		modifiers,
		modifierPercent,
		finalScore,
		label: scoreLabel(finalScore),
		comment: scoreComment(input.projectId, finalScore),
		absurdValuationUsd: finalScore * 1_337_000 + (stableHash(input.projectId) % 999_999),
		tokenTotal: input.tokenTotal,
		fakeInvoiceUsd: Math.round(Math.max(4.2, input.tokenTotal * 0.000042) * 100) / 100
	};
}

export function scoreRunId(input: ScoreInput): string {
	return `${input.projectId}:${input.completedAt}`;
}

function scoreLabel(score: number): string {
	if (score >= 95) return 'FORBIDDEN UNICORN';
	if (score >= 85) return 'SUSPICIOUSLY BUILDABLE';
	if (score >= 72) return 'STRONG MORTAL CONTRAPTION';
	if (score >= 58) return 'PROMISING WITH GOBLINS';
	return 'CHARMINGLY HAUNTED MVP';
}

function scoreComment(id: string, score: number): string {
	const comments = [
		`I value this at roughly ${score} enchanted briefcases. Finance will object.`,
		'The prophecy has legs. Unfortunately, Purl is sitting on two of them.',
		'I would build it. Please never repeat that sentence outside this room.',
		'This may survive contact with reality, which is deeply inconvenient.'
	];
	return comments[stableHash(id) % comments.length];
}

function isScoreAchievement(value: unknown): value is ScoreAchievement {
	return typeof value === 'string' && value in SCORE_MODIFIERS;
}
function boundedString(value: unknown, min: number, max: number): value is string {
	return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}
function integer(value: unknown, min: number, max: number): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
function money(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
	);
}
function isIso(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
function stableHash(value: string): number {
	let hash = 2_166_136_261;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16_777_619);
	}
	return hash >>> 0;
}
