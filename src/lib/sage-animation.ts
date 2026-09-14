import { LoopOnce, LoopRepeat, type AnimationAction, type AnimationMixer } from 'three';
import type { SageClip } from './sage-stage';

const loops = new Set<SageClip>(['idle', 'talk', 'research_typing', 'research_one_hand']);

/** Interruptible, normalized blends driven by the renderer's clock, not wall timers. */
export class SageAnimationDirector {
	current: SageClip = 'idle';
	private active: AnimationAction | null = null;
	private returning = false;
	private blendAge = 0;
	private weights = new Map<AnimationAction, number>();
	private readonly finished = ({ action }: { action: AnimationAction }) => {
		if (action === this.active && this.returning) this.play(this.resting(), false);
	};

	constructor(
		private mixer: AnimationMixer,
		private actions: Record<string, AnimationAction>,
		private resting: () => SageClip = () => 'idle'
	) {
		mixer.addEventListener('finished', this.finished);
	}

	get reacting(): boolean {
		return this.returning;
	}

	play(clip: SageClip, returnToRest = false): void {
		// Retired animation: even legacy/debug callers cannot play the fall.
		if (clip === 'drop') {
			clip = 'idle';
			returnToRest = false;
		}
		const next = this.actions[clip];
		if (!next || (next === this.active && loops.has(clip))) return;
		this.weights.clear();
		for (const action of Object.values(this.actions)) {
			const weight = action.isScheduled() ? action.getEffectiveWeight() : 0;
			if (weight > 0) this.weights.set(action, weight);
		}
		const incomingWeight = this.weights.get(next) ?? 0;
		const hasPrevious = this.weights.size > 0;
		next
			.reset()
			.setEffectiveTimeScale(1)
			.setEffectiveWeight(hasPrevious ? incomingWeight : 1);
		next.setLoop(loops.has(clip) ? LoopRepeat : LoopOnce, loops.has(clip) ? Infinity : 1);
		next.clampWhenFinished = !loops.has(clip);
		next.play();
		this.active = next;
		this.current = clip;
		this.returning = returnToRest;
		this.blendAge = 0;
		if (!hasPrevious) this.weights.set(next, 1);
	}

	update(delta: number): void {
		this.blendAge += delta;
		const progress = Math.min(this.blendAge / 0.22, 1);
		const ease = progress * progress * (3 - 2 * progress);
		for (const action of Object.values(this.actions)) {
			const start = this.weights.get(action) ?? 0;
			const target = action === this.active ? 1 : 0;
			if (start === 0 && target === 0) continue;
			action.setEffectiveWeight(start + (target - start) * ease);
			if (progress === 1 && action !== this.active) action.stop();
		}
		this.mixer.update(delta);
	}

	dispose(): void {
		this.mixer.removeEventListener('finished', this.finished);
		this.mixer.stopAllAction();
	}
}
