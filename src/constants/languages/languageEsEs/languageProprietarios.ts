// src/constants/languages/languageEsEs/languageProprietarios.ts
// Traducción ES-ES del módulo "Proprietários" (Proprietary — Registros
// Base). TASK-PY-FE-01: singular/plural (queryKey) + mensajes de
// validación del schema Yup + esqueleto de list/filter/form (copy completo
// en TASK-PY-FE-02/03, mismo patrón incremental de `languageProviders.ts`).

import { ModuleProprietaries } from '@/@types/language/module-proprietaries';

export const languageProprietarios: ModuleProprietaries = {
  proprietary: {
    singularLabel: 'Propietario',
    pluralLabel: 'Propietarios',

    list: {
      pageTitle: 'Propietarios',
      pageSubtitle: 'Gestione los propietarios registrados en este tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Propietario',
        nickname: 'Apodo',
        city: 'Ciudad',
        percentage: 'Participación',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún propietario registrado',
        descriptionEmpty: 'Registre el primer propietario para empezar.',
        titleFiltered: 'Ningún propietario encontrado',
        descriptionFiltered: 'Ajuste los filtros aplicados e intente de nuevo.',
        cta: 'Nuevo Propietario',
      },
      deleteDialog: {
        title: 'Eliminar Propietario',
        description: 'Seguro que desea eliminar el propietario',
        warning: 'Esta acción es permanente y no se puede deshacer.',
        confirm: 'Eliminar',
      },
      deletedToast: 'Propietario eliminado con éxito.',
      error: {
        message: 'No fue posible cargar los propietarios.',
        retry: 'Intentar de nuevo',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre, apodo o CPF/CNPJ',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },

    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Existen registros vinculados a este propietario. Elimine o reasigne los vínculos abajo antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        expenses: 'Gasto(s) vinculado(s)',
        incomes: 'Ingreso(s) vinculado(s)',
        movements: 'Movimiento(s) financiero(s) vinculado(s)',
        transfers: 'Transferencia(s) vinculada(s)',
        areas: 'Área(s) vinculada(s)',
        invoices: 'Factura(s) vinculada(s)',
        equipments: 'Equipo(s) vinculado(s)',
        cashBooks: 'Libro(s) Caja vinculado(s)',
        inputEntries: 'Entrada(s) de Insumo vinculada(s)',
        sales: 'Venta(s) vinculada(s)',
        tickets: 'Ticket(s) vinculado(s)',
        traceabilityConfigs: 'Configuración(es) de Trazabilidad vinculada(s)',
      },
    },

    form: {
      title: {
        create: 'Nuevo Propietario',
        edit: 'Editar Propietario',
      },
      subtitle: {
        create: 'Registre un nuevo propietario.',
        edit: 'Actualice los datos del propietario.',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apodo',
        name: 'Razón Social/Nombre',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        zipCode: 'Código Postal',
        address: 'Dirección',
        number: 'Número',
        district: 'Barrio',
        city: 'Ciudad',
      },
      cepAutofill: {
        notFound: {
          title: 'Código postal no encontrado',
          description: 'Complete la dirección manualmente.',
        },
        cityNotResolved: {
          title: 'Ciudad no localizada',
          description: 'Seleccione la ciudad manualmente.',
        },
        networkError: {
          title: 'Error al consultar el código postal',
          description: 'Complete la dirección manualmente.',
        },
      },
      nifFoundWarning:
        'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente. Si ya es propietaria en otra granja, las granjas e IEs existentes se mantienen y la granja activa se suma al guardar.',
      nifFoundWarningEditing:
        'Ya existe otra Persona registrada con este CPF/CNPJ — sus datos reemplazaron los de este formulario. Revise antes de guardar.',
      nifAlreadyProprietaryRedirectWarning:
        'Propietario ya registrado en esta granja. Abriendo el registro para edición.',
      nifPermissionDeniedWarning:
        'Sin permiso para consultar el registro de personas — complete los datos manualmente.',
      farms: {
        empty: 'Ninguna finca vinculada.',
        add: 'Agregar Finca',
        removeAria: 'Eliminar finca',
        fields: {
          farm: 'Finca',
          percentage: 'Participación (%)',
        },
      },
      stateRegistrations: {
        title: 'IE (Propietario)',
        empty: 'Ninguna inscripción estatal registrada.',
        add: 'Agregar Inscripción Estatal',
        removeAria: 'Eliminar inscripción estatal',
        fields: {
          value: 'IE',
        },
      },
      validation: {
        nifRequired: 'El CPF/CNPJ es obligatorio.',
        nifInvalid: 'CPF/CNPJ inválido — verifique los dígitos.',
        nameRequired: 'Campo obligatorio.',
        nameMaxLength: 'Máximo 120 caracteres.',
        nicknameRequired: 'Campo obligatorio.',
        nicknameMaxLength: 'Máximo 60 caracteres.',
        emailRequired: 'El correo electrónico es obligatorio.',
        emailInvalid: 'Correo electrónico inválido.',
        emailMaxLength: 'Máximo 89 caracteres.',
        addressRequired: 'Campo obligatorio.',
        addressMaxLength: 'Máximo 120 caracteres.',
        numberRequired: 'Campo obligatorio.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obligatorio.',
        districtMaxLength: 'Máximo 60 caracteres.',
        cityRequired: 'Seleccione una ciudad.',
        farmRequired: 'Seleccione una finca.',
        farmsMinRequired: 'Agregue al menos una finca.',
        percentageRange: 'Ingrese una participación entre 0 y 100.',
      },
    },
  },
};
