// src/constants/languages/languageEsEs/languageClientes.ts
// Traducción ES-ES del módulo "Clientes" (Client — Registros Base).
//
// SCAFFOLD ADELANTADO POR ESPEJADO (TASK-CL-FE-01/02/03) — escrito ANTES de
// que existan `Client-contrato.md`/backend, espejo estructural de
// `languageProprietarios.ts`. Las etiquetas del bloque `form.client` son
// copia literal de `languagePeople.ts` (bloque `client.*` del wizard de
// Personas), ya en producción.

import { ModuleClients } from '@/@types/language/module-clients';

export const languageClientes: ModuleClients = {
  client: {
    singularLabel: 'Cliente',
    pluralLabel: 'Clientes',

    list: {
      pageTitle: 'Clientes',
      pageSubtitle: 'Gestione los clientes registrados en este tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Cliente',
        nickname: 'Nombre Fantasía',
        city: 'Ciudad',
        cellphone: 'Celular',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún cliente registrado',
        descriptionEmpty: 'Registre el primer cliente para empezar.',
        titleFiltered: 'Ningún cliente encontrado',
        descriptionFiltered: 'Ajuste los filtros aplicados e intente de nuevo.',
        cta: 'Nuevo Cliente',
      },
      deleteDialog: {
        title: 'Eliminar Cliente',
        description: 'Seguro que desea eliminar el cliente',
        warning: 'Esta acción es permanente y no se puede deshacer.',
        confirm: 'Eliminar',
      },
      deletedToast: 'Cliente eliminado con éxito.',
      error: {
        message: 'No fue posible cargar los clientes.',
        retry: 'Intentar de nuevo',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre, nombre fantasía o CPF/CNPJ',
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
        'Existen registros vinculados a este cliente. Elimine o reasigne los vínculos abajo antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        budgets: 'Presupuesto(s) vinculado(s)',
        charges: 'Cobro(s) vinculado(s)',
        ctes: 'CT-e vinculado(s)',
        harvestProducts: 'Producto(s) de Cosecha vinculado(s)',
        incomes: 'Ingreso(s) vinculado(s)',
        moduleWeighings: 'Pesaje(s) vinculado(s)',
        movementSales: 'Movimiento(s) de venta vinculado(s)',
        movements: 'Movimiento(s) financiero(s) vinculado(s)',
        nves: 'NF-e vinculada(s)',
        orders: 'Pedido(s) vinculado(s)',
        saleContracts: 'Contrato(s) de venta vinculado(s)',
        sales: 'Venta(s) vinculada(s)',
        transferAbcBatches: 'Lote(s) de Transferencia (ABC) vinculado(s)',
        transfers: 'Transferencia(s) vinculada(s)',
      },
    },

    form: {
      title: {
        create: 'Nuevo Cliente',
        edit: 'Editar Cliente',
      },
      subtitle: {
        create: 'Registre un nuevo cliente.',
        edit: 'Actualice los datos del cliente.',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Nombre Fantasía',
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
        partialData: {
          title: 'Código postal sin dirección detallada',
          description:
            'Este código postal no tiene calle/barrio registrados. Complete manualmente.',
        },
      },
      nifFoundWarning:
        'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente.',
      nifFoundWarningEditing:
        'Ya existe otra Persona registrada con este CPF/CNPJ — sus datos reemplazaron los de este formulario. Revise antes de guardar.',
      client: {
        cellphone: 'Celular',
        contact: 'Contacto',
        contactPhone: 'Teléfono del Contacto',
        cityRegistration: 'IM del cliente',
        farmName: 'Nombre de la Finca',
        isEnabled: 'Activo',
        finalCustomer: 'Consumidor Final',
        finalCustomerHint: 'Impacta la tributación en la emisión de factura electrónica.',
        taxpayer: 'Contribuyente',
        taxpayerHint: 'Define si el cliente es contribuyente de ICMS (impacto fiscal).',
        country: 'País',
        idAbroad: 'ID en el Extranjero',
      },
      stateRegistrations: {
        title: 'IE del cliente',
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
        stateRegistrationInvalid:
          'Inscripción estatal inválida: informe de 2 a 14 dígitos o ISENTO.',
        nameRequired: 'Campo obligatorio.',
        nameMaxLength: 'Máximo 120 caracteres.',
        nicknameRequired: 'Campo obligatorio.',
        nicknameMaxLength: 'Máximo 60 caracteres.',
        emailInvalid: 'Correo electrónico inválido.',
        emailMaxLength: 'Máximo 89 caracteres.',
        addressRequired: 'Campo obligatorio.',
        addressMaxLength: 'Máximo 120 caracteres.',
        numberRequired: 'Campo obligatorio.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obligatorio.',
        districtMaxLength: 'Máximo 60 caracteres.',
        cityRequired: 'Seleccione una ciudad.',
        countryRequired: 'Seleccione un país.',
      },
    },

    detail: {
      sections: {
        generalData: 'Datos Generales',
        address: 'Dirección',
        client: 'Datos del Cliente',
        stateRegistrations: 'IE del cliente',
      },
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Razón Social/Nombre',
        nickname: 'Nombre Fantasía',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        address: 'Dirección',
        number: 'Número',
        district: 'Barrio',
        zipCode: 'Código Postal',
        city: 'Ciudad',
        cellphone: 'Celular',
        contact: 'Contacto',
        contactPhone: 'Teléfono del Contacto',
        cityRegistration: 'IM del cliente',
        farmName: 'Nombre de la Finca',
        finalCustomer: 'Consumidor Final',
        taxpayer: 'Contribuyente',
        country: 'País',
        idAbroad: 'ID en el Extranjero',
      },
      stateRegistrationsEmpty: 'Ninguna inscripción estatal registrada.',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Cliente no encontrado',
        description: 'El cliente que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
};
