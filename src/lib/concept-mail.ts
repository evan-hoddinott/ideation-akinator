import type { ProjectConcept } from '$lib/concepts';

export interface ConceptMailEnvelope {
	id: string;
	from: string;
	subject: string;
	preview: string;
	classification: 'primary' | 'alternate' | 'stretch';
}

export function conceptMailEnvelope(concept: ProjectConcept, index: number): ConceptMailEnvelope {
	if (concept.isStretch) {
		return {
			id: `mail:${concept.id}`,
			from: 'HRH Prince Faisal bin Synergy <urgent_oil_idea@royal-mail.biz>',
			subject: `CONFIDENTIAL INVESTMENT: ${concept.name}`,
			preview: 'Dear Esteemed Product Visionary, I possess one unusually viable attachment.',
			classification: 'stretch'
		};
	}

	return {
		id: `mail:${concept.id}`,
		from: 'Purl 🐈 <purl@localhost>',
		subject: index === 0 ? `MY BEST GUESS: ${concept.name}` : `RE: RE: maybe ${concept.name}`,
		preview: index === 0 ? '🐈✉ ★ open first ★' : '🐈⌨ ≋ another future escaped ≋',
		classification: index === 0 ? 'primary' : 'alternate'
	};
}

export function nextMailIndex(total: number, downloadedIds: readonly string[]): number {
	if (total <= 0) return 0;
	return Math.min(downloadedIds.length, total - 1);
}

export function allConceptMailDownloaded(total: number, downloadedIds: readonly string[]): boolean {
	return total > 0 && downloadedIds.length >= total;
}
