// src/constants/languages/languageEsEs/languageWorkTeams.ts
// Traducción ES-ES del módulo de EQUIPOS (Administrativo / Gestión de
// Personal). Namespace `workTeams` — GAP-EQ-FE-01 (colisión con
// `languageGB.teams`, dominio SaaS/facturación).

import { ModuleWorkTeams } from '@/@types/language/module-work-teams';

export const languageWorkTeams: ModuleWorkTeams = {
  workTeam: {
    singularLabel: 'Equipo',
    pluralLabel: 'Equipos',
    list: {
      pageTitle: 'Equipos',
      pageSubtitle: 'Administre los equipos de trabajo y sus integrantes.',
      deletedToast: 'Equipo eliminado con éxito',
      table: {
        name: 'Nombre',
        description: 'Descripción',
        supervisor: 'Encargado',
        supervisorEmpty: '—',
        status: 'Estado',
        statusActive: 'Activo',
        statusInactive: 'Inactivo',
        createdAt: 'Fecha de Creación',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún equipo registrado.',
        descriptionEmpty: 'Comience agregando el primer equipo.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar',
      },
      error: {
        message: 'No se pudieron cargar los datos.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar equipos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre o descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    deleteDialog: {
      title: 'Confirmar eliminación',
      descriptionTemplate:
        '{name} será eliminado permanentemente. Esta acción no se puede deshacer.',
    },
    reportButton: {
      label: 'Informe PDF',
      successToast: 'Informe descargado con éxito',
      exportError: {
        title: 'Informe',
        description: 'No se pudo generar el informe. Intente de nuevo.',
      },
    },
    form: {
      title: {
        create: 'Nuevo equipo',
        edit: 'Editar equipo',
        view: 'Ver equipo',
      },
      backButton: 'Volver',
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        employeeUuid: 'Encargado',
        isEnabled: 'Activo',
      },
      placeholders: {
        name: 'Nombre del equipo',
        description: 'Descripción del equipo',
        employeeUuid: 'Seleccione el encargado',
      },
      validation: {
        nameMaxLength: 'El nombre debe tener como máximo 30 caracteres.',
        descriptionMaxLength: 'La descripción debe tener como máximo 50 caracteres.',
        memberRowIncomplete: 'Seleccione el Tipo y el Integrante de esta línea, o elimínela.',
      },
      members: {
        sectionTitle: 'Integrantes',
        addButton: 'Agregar',
        removeRowButton: 'Eliminar integrante',
        emptyState: 'Ningún integrante registrado.',
        incompleteRowWarning: 'Complete todos los campos antes de agregar nuevos.',
        memberPlaceholder: 'Seleccione el integrante',
        memberPlaceholderNoType: 'Seleccione el tipo primero',
        optionsError: 'No se pudieron cargar los integrantes.',
        optionsRetry: 'Intentar de nuevo',
        table: {
          type: 'Tipo',
          member: 'Integrante',
          active: 'Activo',
        },
        typeOptions: {
          employee: 'Empleado',
          thirdParty: 'Tercerizado',
        },
      },
      unsavedChanges: {
        title: 'Cambios no guardados',
        message: '¿Tiene cambios sin guardar. Desea salir sin guardar?',
        confirm: 'Salir sin guardar',
      },
      businessErrorFallback: 'No se pudo guardar el equipo. Verifique los datos informados.',
    },
  },
};
