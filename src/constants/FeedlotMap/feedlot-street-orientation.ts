// src/constants/FeedlotMap/feedlot-street-orientation.ts
// Orientação da Rua (FeedlotStreet) — Mapa de Confinamento, TASK-FE-042-207,
// `FM040`. Mirror `Rule::in(['H', 'V'])` (`FeedlotStreetRequest::rules()`).

export const feedlotStreetOrientation = {
  horizontal: 'H',
  vertical: 'V',
} as const;

export type FeedlotStreetOrientation =
  (typeof feedlotStreetOrientation)[keyof typeof feedlotStreetOrientation];
