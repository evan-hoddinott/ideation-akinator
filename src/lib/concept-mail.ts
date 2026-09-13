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
			from: 'Purl.exe <budget-overflow@localhost>',
			subject: `CORRUPTED ATTACHMENT: ${concept.name}`,
			preview: 'Purl found the budget limit and walked directly over it.',
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

export function nextUnreadMailIndex(
	conceptIds: readonly string[],
	readIds: readonly string[]
): number {
	return Math.max(
		0,
		conceptIds.findIndex((id) => !readIds.includes(id))
	);
}

export function allConceptMailDownloaded(total: number, downloadedIds: readonly string[]): boolean {
	return total > 0 && downloadedIds.length >= total;
}
