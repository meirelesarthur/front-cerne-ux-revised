export const situation = {
  Inactive: 0,
  Active: 1,
  Editing: 2,
} as const;

export type SituationTypes = typeof situation[keyof typeof situation];
