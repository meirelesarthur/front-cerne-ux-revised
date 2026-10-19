// src/constants/languages/languageEsEs/languageExamples.ts
// Traducción ES-ES del módulo de EJEMPLOS (referencia del patrón CRUD).

import { ModuleExamples } from "@/@types/language/module-examples";

export const languageExamples: ModuleExamples = {
  resource: {
    singularLabel: "Recurso",
    list: {
      pageTitle: "Recursos (Ejemplo)",
      pageSubtitle:
        "Módulo de referencia del patrón CRUD. No forma parte de los módulos de GB Cerne.",
      deletedToast: "Recurso eliminado con éxito",
      table: {
        id: "ID",
        name: "Nombre",
        code: "Código",
        description: "Descripción",
        status: "Estado",
        active: "Activo",
        inactive: "Inactivo",
      },
      actions: {
        edit: "Editar",
        delete: "Eliminar",
      },
    },
    filter: {
      title: "Filtrar recursos",
      name: "Nombre",
      namePlaceholder: "Buscar por nombre",
      status: "Estado",
      includeDeleted: "Incluir eliminados",
    },
    form: {
      title: { create: "Nuevo recurso", edit: "Editar recurso" },
      subtitle: {
        create: "Registra un nuevo recurso de ejemplo.",
        edit: "Actualiza los datos del recurso.",
      },
      tabs: {
        generalInfo: "Datos Generales",
        settings: "Configuración",
      },
      fields: {
        name: "Nombre",
        code: "Código",
        description: "Descripción",
        status: "Estado",
        enabled: "Activo",
      },
      placeholders: {
        name: "Ej.: Recurso de ejemplo",
        code: "Ej.: REC-001",
        description: "Descripción opcional del recurso",
      },
      validation: {
        nameRequired: "El nombre es obligatorio",
        nameMinLength: "El nombre debe tener al menos 2 caracteres",
        codeRequired: "El código es obligatorio",
        statusRequired: "El estado es obligatorio",
      },
      settingsTitle: "Configuración",
      configTab: {
        description:
          "Pestaña extra de configuración — solo aparece al editar un recurso existente. Demuestra el patrón de pestaña en archivo separado.",
        visibility: "Visible en el listado público",
        visibilityHint:
          "Cuando está desactivado, el recurso queda oculto para usuarios externos.",
      },
    },
  },
};
