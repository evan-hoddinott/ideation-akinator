import { writable } from 'svelte/store';

/** The active document registers its reading surface with the Sage's existing 3D scene. */
export const heldScroll = writable<HTMLElement | null>(null);
