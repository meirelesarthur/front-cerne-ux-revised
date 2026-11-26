// src/constants/languages/languageEsEs/languageRequestAuthorizers.ts
// Traducción ES-ES del módulo de AUTORIZADORES (RequestAuthorizer —
// Registros Base / Personas). SLICE 1 (Lote 06 / esteira 089, Frente C,
// F-141) — `list` + `filter`. SLICE 2 (mismo lote/esteira, frente C) agrega
// `form` (creación/edición) — `rules.value` es texto libre (no Select
// cerrado): la fuente de opciones fiel al legado no está confirmada en este
// backend (contrato §10.4, UX-GAP no bloqueante).

import { ModuleRequestAuthorizers } from '@/@types/language/module-request-authorizers';

export const languageRequestAuthorizers: ModuleRequestAuthorizers = {
  requestAuthorizer: {
    singularLabel: 'Autorizador',
    list: {
      pageTitle: 'Autorizadores',
      pageSubtitle: 'Administre quién puede aprobar solicitudes de compra.',
      deletedToast: 'Registro eliminado con éxito.',
      createdToast: 'Registro creado con éxito.',
      updatedToast: 'Registro actualizado con éxito.',
      deleteConfirm: {
        title: '¿Está seguro?',
        text: 'Una vez eliminado, ¡no podrá recuperar este elemento!',
      },
      table: {
        user: 'Usuario',
        maxValue: 'Valor',
        maxValueUpTo: 'hasta',
        createdAt: 'Fe. Registro',
        numberQuotes: 'Nº mín. cotizaciones',
        expenseOrganizer: '¿Ordenador de Gastos?',
        isConditional: 'Autorizador Condicional',
        isActive: 'Activo',
        farms: 'Fincas',
        farmsCount: 'finca(s)',
        active: 'Activo',
        inactive: 'Inactivo',
        yes: 'Sí',
        no: 'No',
      },
      actions: {
        // "Ver" abre la pantalla propia (`/visualizar`, solo `view`).
        view: 'Ver autorizador',
        edit: 'Editar autorizador',
        delete: 'Eliminar autorizador',
      },
      emptyState: {
        titleEmpty: 'Ninguna información registrada.',
        descriptionEmpty: 'Comience agregando el primer autorizador.',
        titleEmptyNoCreate: 'Ninguna información registrada.',
        descriptionEmptyNoCreate: 'Consulte a un administrador para registrar un autorizador.',
        titleFiltered: 'Ninguna información registrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Autorizador',
      },
    },
    filter: {
      title: 'Filtrar autorizadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre del usuario',
    },
    form: {
      title: {
        create: 'Nuevo Autorizador',
        edit: 'Editar Autorizador',
        view: 'Ver Autorizador',
      },
      subtitle: {
        create: 'Registre un nuevo autorizador de solicitudes de compra.',
        edit: 'Actualice los datos del autorizador.',
        view: 'Consulte los datos del autorizador.',
      },
      fields: {
        userUuid: 'Usuario',
        maxValue: 'Hasta',
        numberQuotes: 'Cantidad mínima de cotizaciones',
        isActive: 'Activo',
        expenseOrganizer: '¿Ordenador de Gastos?',
        isConditional: 'Autorizador condicional',
        responsible: 'Responsable',
        creationDate: 'Fecha de Creación',
        lastUpdate: 'Última actualización',
      },
      placeholders: {
        userUuid: 'Buscar por nombre',
      },
      hints: {
        maxValue: 'Informe el valor máximo que este autorizador puede aprobar',
      },
      farms: {
        sectionTitle: 'Fincas',
        sectionHint: 'Vincule al menos 1 finca y el nivel de aprobación del autorizador en ella.',
        addRowLabel: 'Agregar Finca',
        removeRowLabel: 'Eliminar finca',
        removeConfirm: {
          title: '¿Está seguro?',
          text: '¿Realmente desea eliminar este elemento?',
        },
        incompleteRow: 'Complete todos los campos antes de agregar nuevos.',
        minOneItem: 'Debe tener al menos un elemento en la lista',
        levelPlaceholder: 'Seleccione',
        emptyTitle: 'Agregue al menos 1 finca.',
        fields: {
          farm: 'Finca',
          level: 'Nivel',
        },
        placeholders: {
          farm: 'Seleccione',
        },
      },
      rules: {
        sectionTitle: 'Reglas de Autorización',
        sectionHint: 'Restrinja cuándo este autorizador participa del flujo de aprobación.',
        addRowLabel: 'Agregar Regla',
        removeRowLabel: 'Eliminar regla',
        emptyTitle: 'Agregue al menos 1 regla.',
        fields: {
          type: 'Tipo',
          value: 'Valor',
          applyOn: 'Aplica',
        },
        placeholders: {
          value: 'Seleccione el tipo de solicitud',
        },
        typeOptions: {
          requestPurchase: 'Tipo de Solicitud',
        },
        valueOptions: {
          all: 'Todos',
        },
        applyOnOptions: {
          before: 'Antes de la Cotización',
          after: 'Después de la Cotización',
        },
      },
      validation: {
        userRequired: 'El usuario es obligatorio',
        maxValueRequired: 'El campo Hasta es obligatorio.',
        maxValueRange: 'El límite debe ser mayor o igual a cero',
        numberQuotesRequired: 'La cantidad mínima de cotizaciones es obligatoria',
        numberQuotesMin: 'La cantidad mínima de cotizaciones debe ser al menos 1',
        farmsRequired: 'Agregue al menos 1 finca',
        farmFarmRequired: 'Seleccione la finca',
        farmLevelRequired: 'Seleccione el nivel',
        farmLevelRange: 'El nivel debe estar entre 1 y 4',
        rulesRequired: 'Agregue al menos 1 regla',
        ruleTypeRequired: 'Seleccione el tipo',
        ruleValueRequired: 'El valor es obligatorio',
        ruleApplyOnRequired: 'Seleccione cuándo se aplica la regla',
      },
    },
  },
};
