// src/constants/languages/languageEnUs/languageExamples.ts
// EN-US translation of the EXAMPLES module (CRUD pattern reference).

import { ModuleExamples } from "@/@types/language/module-examples";

export const languageExamples: ModuleExamples = {
  resource: {
    singularLabel: "Resource",
    list: {
      pageTitle: "Resources (Example)",
      pageSubtitle:
        "Reference module for the CRUD pattern. It is not part of the GB Cerne modules.",
      deletedToast: "Resource removed successfully",
      table: {
        id: "ID",
        name: "Name",
        code: "Code",
        description: "Description",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
      },
      actions: {
        edit: "Edit",
        delete: "Delete",
      },
    },
    filter: {
      title: "Filter resources",
      name: "Name",
      namePlaceholder: "Search by name",
      status: "Status",
      includeDeleted: "Include removed",
    },
    form: {
      title: { create: "New resource", edit: "Edit resource" },
      subtitle: {
        create: "Register a new example resource.",
        edit: "Update the resource details.",
      },
      tabs: {
        generalInfo: "General Info",
        settings: "Settings",
      },
      fields: {
        name: "Name",
        code: "Code",
        description: "Description",
        status: "Status",
        enabled: "Active",
      },
      placeholders: {
        name: "e.g. Example resource",
        code: "e.g. REC-001",
        description: "Optional resource description",
      },
      validation: {
        nameRequired: "Name is required",
        nameMinLength: "Name must be at least 2 characters long",
        codeRequired: "Code is required",
        statusRequired: "Status is required",
      },
      settingsTitle: "Settings",
      configTab: {
        description:
          "Extra settings tab — only shown when editing an existing resource. Demonstrates the separate-file tab pattern.",
        visibility: "Visible in the public listing",
        visibilityHint:
          "When off, the resource is hidden from external users.",
      },
    },
  },
};
