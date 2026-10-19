// src/constants/languages/languageEsEs/languageRoles.ts
// Traducción ES-ES del módulo de PERFILES (Roles RBAC — Registros Base).

import { ModuleRoles } from "@/@types/language/module-roles";

export const languageRoles: ModuleRoles = {
  role: {
    singularLabel: "Perfil",
    list: {
      pageTitle: "Perfiles",
      pageSubtitle:
        "Administre los perfiles de acceso (roles) y sus permisos en el sistema.",
      deletedToast: "Perfil eliminado con éxito",
      table: {
        name: "Nombre",
        description: "Descripción",
      },
      actions: {
        edit: "Editar",
        delete: "Eliminar",
      },
    },
    filter: {
      title: "Filtrar perfiles",
      search: "Nombre",
      searchPlaceholder: "Buscar por nombre o descripción",
    },
    form: {
      title: { create: "Nuevo Perfil", edit: "Editar Perfil" },
      subtitle: {
        create: "Registre un nuevo perfil de acceso y seleccione sus permisos.",
        edit: "Actualice los datos y los permisos del perfil.",
      },
      tabs: {
        generalInfo: "Datos Generales",
        permissions: "Permisos",
      },
      fields: {
        name: "Nombre",
        description: "Descripción",
        isUserVisible: "Visible al usuario",
      },
      placeholders: {
        name: "Ej.: Gerente Operacional",
        description: "Descripción opcional del perfil",
      },
      hints: {
        isUserVisible:
          "Cuando está desactivado, el perfil no aparece para selección por los usuarios.",
      },
      validation: {
        nameRequired: "El nombre es obligatorio",
        nameMinLength: "El nombre debe tener al menos 2 caracteres",
        descriptionRequired: "La descripción es obligatoria",
      },
      permissionsTree: {
        searchPlaceholder: "Buscar permiso por título o descripción",
        selectedSuffix: "seleccionado(s)",
        noResults: "No se encontraron permisos para la búsqueda.",
        driftTooltip:
          "Permiso no disponible en este entorno (sin seed) — no puede ser seleccionado.",
        noAuthorityTooltip:
          "No puedes asignar un permiso que no posees.",
        readOnlyHint:
          "No tiene permiso para modificar este perfil — vista de solo lectura.",
      },
    },
  },
};
