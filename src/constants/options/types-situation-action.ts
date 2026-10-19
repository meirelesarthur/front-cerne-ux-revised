export const typesSituationAction = {
  activeForm: "activeForm",
  activeFormCreate: "activeFormCreate",
  activeGrid: "activeGrid",
  inactivateGrid: "inactivateGrid",
  inactivateForm: "inactivateForm",
  editing: "editingForm",
} as const;

export type TypesSituationAction =
  (typeof typesSituationAction)[keyof typeof typesSituationAction];
