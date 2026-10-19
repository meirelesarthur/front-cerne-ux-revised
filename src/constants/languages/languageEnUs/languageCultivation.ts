// src/constants/languages/languageEnUs/languageCultivation.ts
// EN-US translation of the CULTIVATION module (Crop/Variety — Base Registrations).

import { ModuleCultivation } from "@/@types/language/module-cultivation";

export const languageCultivation: ModuleCultivation = {
  pageTitle: "Crop / Variety",
  pageSubtitle: "Manage the Crop tree and its linked Varieties.",
  deletedToast: "Crop classification removed successfully",
  table: {
    name: "Name",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    varietiesCount: "Varieties",
  },
  tree: {
    expand: "Expand Varieties",
    collapse: "Collapse Varieties",
  },
  actions: {
    edit: "Edit",
    newVariety: "New Variety",
    delete: "Delete",
  },
  empty: {
    message: "No Crop registered yet.",
    cta: "New Crop",
  },
  error: {
    message: "Could not load the Crop/Variety tree.",
    retry: "Try again",
  },
  filter: {
    title: "Filter Crop/Variety",
    search: "Name",
    searchPlaceholder: "Search by name",
  },
  form: {
    title: {
      create: "New Crop/Variety",
      edit: "Edit Crop/Variety",
    },
    subtitle: {
      create:
        "Register a new Crop (no parent) or a Variety (by selecting a parent Crop).",
      edit: "Update this Crop or Variety's data.",
    },
    fields: {
      name: "Name",
      status: "Status",
      parent: "Parent Crop",
    },
    placeholders: {
      name: "Enter the name",
      parent: "None — this is a root Crop",
    },
    validation: {
      nameRequired: "Name is required",
      nameMinLength: "Name must contain at least 2 characters",
    },
  },
};
