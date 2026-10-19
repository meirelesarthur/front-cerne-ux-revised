// src/constants/languages/languageEnUs/languageRoles.ts
// EN-US translation of the ROLES module (RBAC roles — Base Registrations).

import { ModuleRoles } from "@/@types/language/module-roles";

export const languageRoles: ModuleRoles = {
  role: {
    singularLabel: "Role",
    list: {
      pageTitle: "Roles",
      pageSubtitle:
        "Manage access roles and their permissions in the system.",
      deletedToast: "Role removed successfully",
      table: {
        name: "Name",
        description: "Description",
      },
      actions: {
        edit: "Edit",
        delete: "Delete",
      },
    },
    filter: {
      title: "Filter roles",
      search: "Name",
      searchPlaceholder: "Search by name or description",
    },
    form: {
      title: { create: "New Role", edit: "Edit Role" },
      subtitle: {
        create: "Register a new access role and select its permissions.",
        edit: "Update the role data and its permissions.",
      },
      tabs: {
        generalInfo: "General Info",
        permissions: "Permissions",
      },
      fields: {
        name: "Name",
        description: "Description",
        isUserVisible: "Visible to users",
      },
      placeholders: {
        name: "E.g.: Operations Manager",
        description: "Optional role description",
      },
      hints: {
        isUserVisible:
          "When off, the role is not shown for selection by users.",
      },
      validation: {
        nameRequired: "Name is required",
        nameMinLength: "Name must be at least 2 characters",
        descriptionRequired: "Description is required",
      },
      permissionsTree: {
        searchPlaceholder: "Search permission by title or description",
        selectedSuffix: "selected",
        noResults: "No permissions found for this search.",
        driftTooltip:
          "Permission not available in this environment (no seed) — it cannot be selected.",
        noAuthorityTooltip:
          "You cannot assign a permission you do not have.",
        readOnlyHint:
          "You do not have permission to change this role — read-only view.",
      },
    },
  },
};
