export const by = {
  Company: 0,
  Employee: 1,
  Team: 2,
} as const;

export type By = typeof by[keyof typeof by];
