import {
	createDemoFinalPlan,
	createDemoFocusedResearchResult,
	createDemoPortfolio,
	createDemoProject,
	createDemoResearchResult
} from '$lib/demo';
import type { FinalRecalculationRequest, FocusedResearchRequest } from '$lib/finalization';
import { createFeatureWorkshop } from '$lib/feature-workshop';
import { renderProjectPdf } from '$lib/server/report-pdf';
import { describe, expect, it } from 'vitest';
import { buildProjectReport, parseProjectReport, safeReportFilename } from './report';

describe('finished project report', () => {
	it('builds one numbered source ledger from broad and focused research', () => {
		const report = buildProjectReport(finalizedDemo(), new Date('2026-09-02T12:00:00Z'));
		expect(report).not.toBeNull();
		expect(report?.sources.map((source) => source.number)).toEqual([1, 2, 3, 4, 5]);
		expect(report?.broadResearch.findings[0].sourceNumbers).toEqual([1]);
		expect(report?.competitorRows[0].sourceNumbers).toEqual([4]);
		expect(report?.plan.confirmedFeatures.length).toBeGreaterThan(0);
		expect(parseProjectReport(report)).not.toBeNull();
	});

	it('rejects an invalid report identity and creates a safe download name', () => {
		const report = buildProjectReport(finalizedDemo())!;
		expect(parseProjectReport({ ...report, projectId: '' })).toBeNull();
		expect(safeReportFilename('Campus Signal Bell!?')).toBe('campus-signal-bell-prd.pdf');
	});

	it('renders a real PDF with the saved source links', async () => {
		const report = buildProjectReport(finalizedDemo(), new Date('2026-09-02T12:00:00Z'))!;
		const pdf = await renderProjectPdf(report);
		expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
		expect(pdf.byteLength).toBeGreaterThan(10_000);
		expect(pdf.toString('latin1')).toContain('https://example.com/demo/configured-competitor');
	});
});

function finalizedDemo() {
	const now = new Date('2026-09-02T10:00:00Z');
	const project = createDemoProject(now);
	const portfolio = createDemoPortfolio(now);
	const concept = portfolio.concepts[0];
	const workshop = createFeatureWorkshop(portfolio);
	const selected = workshop.configurations[0];
	const features = selected.features.filter((feature) => feature.included);
	const broadResearch = createDemoResearchResult(now);
	const focusedRequest: FocusedResearchRequest = {
		projectId: project.id,
		topic: project.problemInput.topic,
		problems: project.problemInput.cards.map((card) => card.text),
		selectedConcept: {
			id: concept.id,
			name: concept.name,
			pitch: concept.pitch,
			description: concept.description,
			targetUser: concept.targetUser,
			distinctApproach: concept.distinctApproach,
			prototypeBudget: concept.prototypeBudget,
			productionBudget: concept.productionBudget,
			prototypeTimeline: concept.prototypeTimeline
		},
		includedFeatures: features.map((feature) => ({
			id: feature.id,
			name: feature.name,
			description: feature.description,
			tier: feature.tier,
			dependencies: feature.dependencies
		})),
		constraints: { ...project.preferences.constraints },
		prototypeBudgetUsd: project.preferences.prototypeBudgetUsd!,
		includeProductionPlanning: true,
		productionBudgetUsd: project.preferences.productionBudgetUsd,
		broadResearch
	};
	const focusedResearch = createDemoFocusedResearchResult(focusedRequest, now);
	const finalRequest: FinalRecalculationRequest = { ...focusedRequest, focusedResearch };
	return {
		...project,
		stage: 'focused' as const,
		research: { jobId: 'demo-broad-job', status: 'completed' as const, result: broadResearch },
		concepts: { status: 'ready' as const, portfolio },
		featureWorkshop: {
			...workshop,
			status: 'confirmed' as const,
			selectedConceptId: concept.id,
			confirmedAt: now.toISOString()
		},
		finalization: {
			configurationFingerprint: 'demo-finalized',
			research: {
				jobId: 'demo-focused-job',
				status: 'completed' as const,
				result: focusedResearch
			},
			plan: createDemoFinalPlan(finalRequest, now)
		}
	};
}
