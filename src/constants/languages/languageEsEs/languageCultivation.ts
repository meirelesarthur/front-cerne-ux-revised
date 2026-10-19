// src/constants/languages/languageEsEs/languageCultivation.ts
// Traducción ES-ES del módulo de CULTIVO/VARIEDAD (Cultivation — Registros Base).

import { ModuleCultivation } from "@/@types/language/module-cultivation";

export const languageCultivation: ModuleCultivation = {
  pageTitle: "Cultivo / Variedad",
  pageSubtitle: "Administre el árbol de Cultivos y sus Variedades vinculadas.",
  deletedToast: "Clasificación de cultivo eliminada con éxito",
  table: {
    name: "Nombre",
    status: "Estado",
    active: "Activo",
    inactive: "Inactivo",
    varietiesCount: "Variedades",
  },
  tree: {
    expand: "Expandir Variedades",
    collapse: "Contraer Variedades",
  },
  actions: {
    edit: "Editar",
    newVariety: "Nueva Variedad",
    delete: "Eliminar",
  },
  empty: {
    message: "Todavía no hay ningún Cultivo registrado.",
    cta: "Nuevo Cultivo",
  },
  error: {
    message: "No fue posible cargar el árbol de Cultivo/Variedad.",
    retry: "Intentar de nuevo",
  },
  filter: {
    title: "Filtrar Cultivo/Variedad",
    search: "Nombre",
    searchPlaceholder: "Buscar por nombre",
  },
  form: {
    title: {
      create: "Nuevo Cultivo/Variedad",
      edit: "Editar Cultivo/Variedad",
    },
    subtitle: {
      create:
        "Registre un nuevo Cultivo (sin padre) o una Variedad (seleccionando un Cultivo-padre).",
      edit: "Actualice los datos de este Cultivo o Variedad.",
    },
    fields: {
      name: "Nombre",
      status: "Estado",
      parent: "Cultivo-padre",
    },
    placeholders: {
      name: "Escriba el nombre",
      parent: "Ninguno — este es un Cultivo-raíz",
    },
    validation: {
      nameRequired: "El nombre es obligatorio",
      nameMinLength: "El nombre debe contener al menos 2 caracteres",
    },
  },
};
