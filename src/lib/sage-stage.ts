import type { ProjectSession, WorkflowStage } from '$lib/project-state';
import type { SageMood } from '$lib/personality';
import { CLARITY_LABELS } from '$lib/intake-insights';

export const STAGE_ALTITUDES: Record<WorkflowStage, number> = {
	welcome: 0.015,
	problem: 0.065,
	preferences: 0.2,
	research: 0.34,
	questions: 0.48,
	concepts: 0.68,
	focused: 0.82
};

export type SageClip =
	| 'idle'
	| 'talk'
	| 'attentive'
	| 'ascend'
	| 'drop'
	| 'reaction'
	| 'thinking'
	| 'approval'
	| 'confusion'
	| 'suspicious'
	| 'shocked'
	| 'smug'
	| 'lie'
	| 'chair_wobble'
	| 'popup_notice'
	| 'popup_swat'
	| 'weak_answer'
	| 'workstation_exit'
	| 'workstation_push'
	| 'workstation_park'
	| 'workstation_turn'
	| 'research_typing'
	| 'research_one_hand'
	| 'research_inspect'
	| 'research_smack'
	| 'research_cable'
	| 'research_sleep'
	| 'research_celebrate'
	| 'research_complete'
	| 'scroll_present'
	| 'mail_notice'
	| 'mail_click'
	| 'reveal'
	| 'defeat'
	| 'forbidden';

export interface SageScreenAnchors {
	seat: { x: number; y: number };
	head: { x: number; y: number };
	leftHand: { x: number; y: number };
	rightHand: { x: number; y: number };
	updatedAt: number;
}

export interface SageFaceProfile {
	eyeWidth: number;
	leftEyeHeight: number;
	rightEyeHeight: number;
	eyeTilt: number;
	eyeLift: number;
	mouthWidth: number;
	mouthHeight: number;
	color: number;
}

const DEFAULT_FACE: SageFaceProfile = {
	eyeWidth: 1,
	leftEyeHeight: 1,
	rightEyeHeight: 1,
	eyeTilt: 0,
	eyeLift: 0,
	mouthWidth: 1,
	mouthHeight: 1,
	color: 0xff701f
};

export const SAGE_FACE_PROFILES: Record<SageMood, SageFaceProfile> = {
	neutral: DEFAULT_FACE,
	thinking: {
		...DEFAULT_FACE,
		leftEyeHeight: 0.58,
		rightEyeHeight: 0.9,
		eyeTilt: -0.08,
		eyeLift: 0.015,
		mouthWidth: 0.72,
		color: 0xffb22e
	},
	suspicious: {
		...DEFAULT_FACE,
		leftEyeHeight: 0.32,
		rightEyeHeight: 0.72,
		eyeTilt: -0.14,
		mouthWidth: 0.62,
		mouthHeight: 0.72,
		color: 0xd6ff38
	},
	delighted: {
		...DEFAULT_FACE,
		eyeWidth: 1.08,
		leftEyeHeight: 0.72,
		rightEyeHeight: 0.72,
		eyeTilt: 0.12,
		mouthWidth: 1.5,
		mouthHeight: 1.45,
		color: 0x50ffd2
	},
	irritated: {
		...DEFAULT_FACE,
		leftEyeHeight: 0.5,
		rightEyeHeight: 0.5,
		eyeTilt: 0.2,
		mouthWidth: 0.82,
		mouthHeight: 0.62,
		color: 0xff3b30
	},
	shocked: {
		...DEFAULT_FACE,
		eyeWidth: 0.72,
		leftEyeHeight: 1.5,
		rightEyeHeight: 1.5,
		mouthWidth: 0.7,
		mouthHeight: 2.8,
		color: 0xffffff
	},
	smug: {
		...DEFAULT_FACE,
		leftEyeHeight: 0.62,
		rightEyeHeight: 0.62,
		eyeTilt: -0.1,
		eyeLift: 0.01,
		mouthWidth: 1.25,
		mouthHeight: 0.68,
		color: 0xff7ad9
	},
	defeated: {
		...DEFAULT_FACE,
		leftEyeHeight: 0.26,
		rightEyeHeight: 0.26,
		eyeTilt: 0.08,
		eyeLift: -0.025,
		mouthWidth: 0.58,
		mouthHeight: 0.62,
		color: 0x7f87aa
	},
	forbidden: {
		...DEFAULT_FACE,
		eyeWidth: 1.1,
		leftEyeHeight: 1.08,
		rightEyeHeight: 1.08,
		eyeTilt: 0.18,
		mouthWidth: 1.35,
		mouthHeight: 1.3,
		color: 0xb67cff
	}
};

export function faceProfileForMood(mood: SageMood): SageFaceProfile {
	return SAGE_FACE_PROFILES[mood];
}

export function normalizedCursorTarget(
	clientX: number,
	clientY: number,
	viewportWidth: number,
	viewportHeight: number
): { x: number; y: number } {
	if (viewportWidth <= 0 || viewportHeight <= 0) return { x: 0, y: 0 };
	return {
		x: Math.max(-1, Math.min(1, (clientX / viewportWidth) * 2 - 1)),
		y: Math.max(-1, Math.min(1, (clientY / viewportHeight) * 2 - 1))
	};
}

export function speechMeter(
	speaking: boolean,
	phase: number,
	energy = 0.5
): { width: number; height: number } {
	if (!speaking) return { width: 1, height: 1 };
	const safeEnergy = Math.max(0, Math.min(1, energy));
	const beat = (Math.sin(phase * 17) + 1) / 2;
	return {
		width: 1.05 + safeEnergy * 0.65 + beat * 0.32,
		height: 0.8 + safeEnergy * 0.85 + (1 - beat) * 0.5
	};
}

export function projectAltitude(project: ProjectSession): number {
	let localLift = 0;

	if (project.stage === 'problem') {
		const clarityLift = project.problemInput.clarityLabel
			? CLARITY_LABELS.indexOf(project.problemInput.clarityLabel) * 0.018
			: 0;
		const problemLift = Math.min(
			project.problemInput.cards.filter((card) => card.text.trim()).length * 0.008,
			0.04
		);
		localLift = Math.max(0, clarityLift) + problemLift;
	}

	if (project.stage === 'preferences') {
		localLift = Math.min(
			(project.preferences.technologyTags.length +
				project.preferences.selectedIndustryTags.length) *
				0.005,
			0.1
		);
		if (project.preferences.prototypeBudgetUsd !== null) localLift += 0.018;
	}

	if (project.stage === 'research') {
		localLift = project.research.result ? 0.11 : project.research.status === 'running' ? 0.055 : 0;
		if (project.research.result) {
			localLift -= Math.min(project.research.result.gaps.length * 0.006, 0.03);
			localLift += Math.min(project.research.result.findings.length * 0.004, 0.025);
		}
	}

	if (project.stage === 'questions') {
		const total = Math.max(project.interview.questions.length, 1);
		localLift = Math.min((project.interview.answers.length / total) * 0.15, 0.15);
		if (project.interview.confidence === 'reduced') localLift -= 0.025;
	}

	if (project.stage === 'concepts') {
		if (project.concepts.portfolio) localLift += 0.075;
		if (project.featureWorkshop.status === 'confirmed') localLift += 0.07;
	}

	if (project.stage === 'focused') {
		const result = project.finalization.research.result;
		if (project.finalization.research.status === 'running') localLift += 0.045;
		if (result) {
			localLift +=
				result.verdict === 'supported' ? 0.1 : result.verdict === 'caution' ? 0.065 : 0.025;
			localLift -= Math.min(result.gaps.length * 0.004, 0.02);
		}
		if (project.finalization.plan) localLift += 0.08;
	}

	return Math.max(0, Math.min(STAGE_ALTITUDES[project.stage] + localLift, 0.995));
}

export function clipForMood(mood: SageMood): SageClip {
	if (mood === 'defeated' || mood === 'irritated') return 'weak_answer';
	if (mood === 'delighted' || mood === 'forbidden') return 'reveal';
	if (mood === 'neutral') return 'idle';
	if (mood === 'thinking') return 'thinking';
	if (mood === 'suspicious') return 'suspicious';
	if (mood === 'shocked') return 'shocked';
	if (mood === 'smug') return 'smug';
	return 'reaction';
}
