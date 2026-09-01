import type { ProjectSession, WorkflowStage } from '$lib/project-state';
import type { SageMood } from '$lib/personality';
import { CLARITY_LABELS } from '$lib/intake-insights';

export const STAGE_ALTITUDES: Record<WorkflowStage, number> = {
	welcome: 0.04,
	problem: 0.16,
	preferences: 0.4,
	research: 0.65,
	questions: 0.84,
	concepts: 0.95
};

export type SageClip = 'idle' | 'ascend' | 'reaction' | 'popup_swat' | 'weak_answer' | 'reveal';

export function projectAltitude(project: ProjectSession): number {
	let localLift = 0;

	if (project.stage === 'problem') {
		const clarityLift = project.problemInput.clarityLabel
			? CLARITY_LABELS.indexOf(project.problemInput.clarityLabel) * 0.016
			: 0;
		const problemLift = Math.min(
			project.problemInput.cards.filter((card) => card.text.trim()).length * 0.008,
			0.024
		);
		localLift = Math.max(0, clarityLift) + problemLift;
	}

	if (project.stage === 'preferences') {
		localLift = Math.min(
			(project.preferences.technologyTags.length +
				project.preferences.selectedIndustryTags.length) *
				0.005,
			0.05
		);
	}

	if (project.stage === 'research') {
		localLift = project.research.result ? 0.07 : project.research.status === 'running' ? 0.035 : 0;
	}

	if (project.stage === 'questions') {
		const total = Math.max(project.interview.questions.length, 1);
		localLift = Math.min((project.interview.answers.length / total) * 0.09, 0.09);
	}

	return Math.min(STAGE_ALTITUDES[project.stage] + localLift, 0.97);
}

export function clipForMood(mood: SageMood): SageClip {
	if (mood === 'defeated' || mood === 'irritated') return 'weak_answer';
	if (mood === 'delighted' || mood === 'forbidden') return 'reveal';
	if (mood === 'neutral') return 'idle';
	return 'reaction';
}
