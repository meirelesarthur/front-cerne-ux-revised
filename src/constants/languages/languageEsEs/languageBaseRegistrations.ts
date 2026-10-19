// src/constants/languages/languageEsEs/languageBaseRegistrations.ts
// Traducción ES-ES del módulo agregador Registros Base.

import { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

import { languageDocumentManagements } from './languageDocumentManagements';

export const languageBaseRegistrations: ModuleBaseRegistrations = {
  documentManagements: languageDocumentManagements,
  titleModule: 'Registros Base',
  diagnosisPregnancy: {
    singularLabel: 'Diagnóstico de Gestación',
    pluralLabel: 'Diagnósticos de Gestación',
    list: {
      pageTitle: 'Diagnóstico de Gestación',
      pageSubtitle:
        'Administre los resultados de diagnóstico de gestación utilizados en el manejo reproductivo.',
      deletedToast: 'Diagnóstico de gestación eliminado con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún diagnóstico de gestación registrado.',
        descriptionEmpty: 'Comience agregando el primer resultado de diagnóstico.',
        titleFiltered: 'Ningún diagnóstico encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Diagnóstico',
      },
    },
    filter: {
      title: 'Filtrar diagnósticos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nuevo Diagnóstico',
        edit: 'Editar Diagnóstico',
      },
      subtitle: {
        create: 'Registre un nuevo resultado de diagnóstico de gestación.',
        edit: 'Actualice los datos del diagnóstico de gestación.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Preñada',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },

  // Escore Corporal (BodyScore, TASK-BS-FE-01) — mirror `diagnosisPregnancy`
  // + FK de Especie. Etiqueta de `is_enabled` = "Habilitado" (GAP-BS-FE-01,
  // [AVALIADO] — decisión del dueño, fiel al Blade legado). Representación
  // booleana "Sí"/"No" — textos exactos del `<select>` del legado
  // (`00-Documentacao_Bruta/BodyScore/01-BodyScore.md ## 6`, ítem 3) — NO
  // "Activo"/"Inactivo".
  bodyScore: {
    singularLabel: 'Escore Corporal',
    pluralLabel: 'Escores Corporales',
    list: {
      pageTitle: 'Escore Corporal',
      pageSubtitle: 'Administre los escores corporales utilizados en el manejo del rebaño.',
      deletedToast: 'Escore corporal eliminado con éxito',
      table: {
        description: 'Descripción',
        specie: 'Especie',
        isEnabled: 'Habilitado',
        yes: 'Sí',
        no: 'No',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún escore corporal registrado.',
        descriptionEmpty: 'Comience agregando el primer escore corporal.',
        titleFiltered: 'Ningún escore corporal encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Escore Corporal',
      },
    },
    filter: {
      title: 'Filtrar escores corporales',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      specie: 'Especie',
      specieAll: 'Todas',
    },
    form: {
      title: {
        create: 'Nuevo Escore Corporal',
        edit: 'Editar Escore Corporal',
      },
      subtitle: {
        create: 'Registre un nuevo escore corporal utilizado en el manejo del rebaño.',
        edit: 'Actualice los datos del escore corporal.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Habilitado',
        specie: 'Especie',
      },
      placeholders: {
        description: 'Ej.: 3.5',
        specie: 'Seleccione la especie',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        specieRequired: 'La especie es obligatoria',
      },
    },
  },

  accountingGroupers: {
    singularLabel: 'Agrupador Contable',
    pluralLabel: 'Agrupador Contables',
    list: {
      pageTitle: 'Agrupadores Contables',
      pageSubtitle: 'Administre el árbol de agrupadores contables (DRE).',
      deletedToast: 'Agrupador contable eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
        order: 'Orden',
        isEnabled: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        actions: 'Acciones',
      },
      actions: {
        edit: 'Editar',
        addChild: 'Crear descendiente',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún agrupador contable registrado.',
        descriptionEmpty: 'Comience agregando el primer agrupador contable.',
        titleFiltered: 'Ningún agrupador contable encontrado.',
        descriptionFiltered: 'Intente ajustar la búsqueda.',
        cta: 'Nuevo Agrupador Contable',
      },
      error: {
        message: 'No fue posible cargar el árbol de Agrupadores Contables.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar agrupadores contables',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código o nombre',
    },
    form: {
      title: {
        create: 'Nuevo Agrupador Contable',
        createChild: 'Nuevo Agrupador Contable (descendiente)',
        edit: 'Editar Agrupador Contable',
      },
      subtitle: {
        create: 'Registre un nuevo agrupador contable.',
        edit: 'Actualice los datos del agrupador contable.',
      },
      fields: {
        code: 'Código',
        name: 'Nombre',
        isEnabled: 'Estado',
        order: 'Orden',
        parent: 'Antecesor',
      },
      placeholders: {
        name: 'Ej.: Ingreso Bruto',
      },
      parentPlaceholder: {
        root: 'Raíz (sin antecesor)',
      },
      hints: {
        codeGenerated: 'Generado automáticamente al guardar',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 60 caracteres',
        isEnabledRequired: 'El estado es obligatorio',
        orderRequired: 'El orden es obligatorio',
        orderMin: 'El orden debe ser mayor o igual a 1',
      },
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Hay registros vinculados a este agrupador contable. Elimine o reasigne los vínculos a continuación antes de eliminar',
      resourceLabel: '{count} vínculo(s) en {resource}',
      tableLabels: {
        accounting_groupers: 'Agrupador(es) contable(s) hijo(s)',
        financial_categories: 'Categoría(s) financiera(s) vinculada(s)',
      },
    },
  },
  additionalInfo: {
    singularLabel: 'Información Complementaria',
    pluralLabel: 'Información Complementarias',
    list: {
      pageTitle: 'Informaciones Complementarias',
      pageSubtitle:
        'Administre las informaciones complementarias utilizadas en la Naturaleza de Operación.',
      deletedToast: 'Información Complementaria eliminada con éxito',
      table: {
        description: 'Descripción',
        info: 'Información',
        isActive: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna información complementaria registrada.',
        descriptionEmpty: 'Comience agregando la primera información complementaria.',
        titleEmptyNoCreate: 'Ninguna información complementaria registrada.',
        descriptionEmptyNoCreate:
          'Consulte a un administrador para registrar una información complementaria.',
        titleFiltered: 'Ninguna información complementaria encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Información Complementaria',
      },
    },
    filter: {
      title: 'Filtrar informaciones complementarias',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isActive: 'Estado',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nueva Información Complementaria',
        edit: 'Editar Información Complementaria',
      },
      subtitle: {
        create:
          'Registre una nueva información complementaria para uso en la Naturaleza de Operación.',
        edit: 'Actualice los datos de la información complementaria.',
      },
      fields: {
        description: 'Descripción',
        info: 'Información',
        isActive: 'Estado',
      },
      placeholders: {
        description: 'Ej.: ICMS Sustitución Tributaria',
        info: 'Describa el detalle de esta información complementaria',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        infoRequired: 'La información es obligatoria',
        infoMaxLength: 'La información debe tener como máximo 1000 caracteres',
      },
    },
  },
  addressing: {
    singularLabel: 'Direccionamientos',
    pluralLabel: 'Direccionamientoss',
    pageTitle: 'Direccionamientos',
    pageSubtitle: 'Administre el árbol de Direccionamientos (Sector, Pasillo, Estante y Nivel).',
    deletedToast: 'Direccionamiento eliminado con éxito',
    levels: {
      1: 'Sector',
      2: 'Pasillo',
      3: 'Estante',
      4: 'Nivel',
    },
    table: {
      description: 'Descripción',
      level: 'Nivel',
      childrenCount: 'Hijos',
    },
    tree: {
      expand: 'Expandir',
      collapse: 'Contraer',
    },
    actions: {
      edit: 'Editar',
      addChild: 'Agregar {level}',
      delete: 'Eliminar',
    },
    empty: {
      message: 'Todavía no hay ningún Direccionamiento registrado.',
      cta: 'Nuevo Direccionamiento',
    },
    error: {
      message: 'No fue posible cargar el árbol de Direccionamientos.',
      retry: 'Intentar de nuevo',
    },
    filter: {
      title: 'Filtrar Direccionamientos',
      search: 'Descripción',
      searchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nuevo {level}',
        edit: 'Editar {level}',
      },
      subtitle: {
        create: 'Registre un nuevo direccionamiento.',
        edit: 'Actualice la descripción de este direccionamiento.',
      },
      fields: {
        description: 'Descripción',
        parentInfo: 'Direccionamiento padre',
      },
      parentInfo: {
        noParent: 'Este será un Sector (raíz) — sin direccionamiento padre.',
      },
      placeholders: {
        description: 'Escriba la descripción',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
      },
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Hay registros vinculados a este direccionamiento. Elimine o reasigne los vínculos abajo antes de eliminar',
      resourceLabel: '{count} vínculo(s) en {resource}',
      tableLabels: {
        addressings: 'Direccionamiento(s) hijo(s)',
        products: 'Producto(s) vinculado(s)',
      },
    },
  },
  // Prorrateo - Categoría Financiera (Apportionment, TASK-AP-FE-02) — vincula
  // 1 Categoría Financiera sintética a la distribución fija de las
  // actividades productivas de la finca, con detalle opcional por Centro de
  // Costo.
  apportionment: {
    singularLabel: 'Prorrateo',
    pluralLabel: 'Prorrateos',
    list: {
      pageTitle: 'Prorrateos / Categorías',
      pageSubtitle:
        'Administre el prorrateo fijo de cada Categoría Financiera entre las actividades productivas de la finca.',
      deletedToast: 'Prorrateo eliminado con éxito',
      table: {
        financialCategory: 'Categoría Financiera',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
        actions: 'Acciones',
      },
      actions: { edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ningún prorrateo registrado.',
        descriptionEmpty:
          'Comience vinculando una Categoría Financiera al prorrateo de las actividades.',
        titleFiltered: 'Ningún prorrateo encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Prorrateo',
      },
    },
    filter: {
      title: 'Filtrar prorrateos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por Categoría Financiera',
    },
    form: {
      title: { create: 'Nuevo Prorrateo', edit: 'Editar Prorrateo' },
      subtitle: {
        create: 'Vincule una Categoría Financiera al prorrateo de las actividades productivas.',
        edit: 'Actualice el prorrateo de las actividades productivas.',
      },
      fields: {
        financialCategory: 'Categoría Financiera',
        activity: 'Actividad',
        ha: 'Área Productiva (ha)',
        percentage: 'Área Productiva (%)',
        costCentersSectionTitle: 'Centros de Costo',
        costCenter: 'Centro de Costo',
        unsetedHa: 'Ha Disponible',
        costCenterHa: 'Ha a Asignar',
        costCenterHaPercentage: 'Porcentaje',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
      },
      placeholders: {
        financialCategory: 'Seleccione la Categoría Financiera',
        costCenter: 'Seleccione el Centro de Costo',
      },
      validation: {
        financialCategoryRequired: 'La Categoría Financiera es obligatoria',
        itemsMinLength: 'Debe haber al menos una actividad productiva registrada en la finca',
        centerRequired: 'Seleccione un Centro de Costo',
        haRequired: 'El valor de Ha es obligatorio',
        haMin: 'El valor de Ha no puede ser negativo',
        haExceedsAvailable: 'El valor de Ha no puede exceder el disponible para esta actividad',
        haPercentageMax: 'El porcentaje no puede exceder el 100%',
        haPercentageExceedsRemaining:
          'El porcentaje no puede exceder el restante disponible entre los Centros de Costo de esta actividad',
      },
      addCenterRowLabel: 'Agregar Centro de Costo',
      removeCenterRowLabel: 'Eliminar Centro de Costo',
    },
  },
  bank: {
    singularLabel: 'Banco',
    pluralLabel: 'Bancos',
    list: {
      pageTitle: 'Bancos',
      pageSubtitle: 'Consulte el catálogo de instituciones financieras (código y nombre).',
      deletedToast: 'Banco eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      search: {
        placeholder: 'Buscar por código o nombre',
      },
      emptyState: {
        titleEmpty: 'Ningún banco registrado.',
        descriptionEmpty: 'Comience agregando el primer banco.',
        titleEmptyNoCreate: 'Ningún banco disponible.',
        descriptionEmptyNoCreate:
          'Todavía no hay bancos registrados. Póngase en contacto con el administrador de la plataforma.',
        titleFiltered: 'Ningún banco encontrado.',
        descriptionFiltered: 'Intente ajustar la búsqueda por código o nombre.',
        cta: 'Nuevo Banco',
      },
      deleteConfirm: {
        title: 'Eliminar banco',
        message: '¿Está seguro de que desea eliminar el banco',
        warning:
          'Esta eliminación es definitiva. Si el banco está vinculado a un proveedor, la eliminación puede fallar.',
      },
    },
    form: {
      title: {
        create: 'Nuevo Banco',
        edit: 'Editar Banco',
      },
      subtitle: {
        create: 'Registre un nuevo banco en el catálogo de instituciones financieras.',
        edit: 'Actualice los datos del banco.',
      },
      fields: {
        code: 'Código',
        name: 'Nombre',
      },
      placeholders: {
        code: 'Ej.: 001',
        name: 'Ej.: Banco do Brasil S.A.',
      },
      validation: {
        codeRequired: 'El código es obligatorio',
        codeMaxLength: 'El código debe tener como máximo 4 caracteres',
        codeDuplicate:
          'Ya existe un banco con este código. Los principales bancos ya están precargados.',
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 100 caracteres',
      },
    },
  },

  headband: {
    singularLabel: 'Banda de Encabezado',
    pluralLabel: 'Bandas de Encabezado',
    type: {
      central: 'Central',
      partnerLogo: 'Logo de Socio',
    },
    list: {
      pageTitle: 'Bandas de Encabezado',
      pageSubtitle: 'Administre los banners mostrados en la parte superior del sistema.',
      deletedToast: 'Banda de encabezado eliminada correctamente',
      table: {
        position: 'Posición',
        description: 'Descripción',
        type: 'Tipo',
        partners: 'Socios',
        partnersNone: 'Sin socios vinculados',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna banda de encabezado registrada.',
        descriptionEmpty: 'Comience agregando el primer banner.',
        titleFiltered: 'Ninguna banda de encabezado encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros.',
        cta: 'Nueva Banda de Encabezado',
      },
    },
    filter: {
      title: 'Filtrar bandas de encabezado',
      type: 'Tipo',
      typeAll: 'Todos',
      partner: 'Socio',
      partnerPlaceholder: 'Buscar socio',
    },
    form: {
      title: {
        create: 'Nueva Banda de Encabezado',
        edit: 'Editar Banda de Encabezado',
      },
      subtitle: {
        create: 'Cree un nuevo banner.',
        edit: 'Actualice los datos de la banda de encabezado.',
      },
      fields: {
        description: 'Descripción',
        link: 'Enlace',
        position: 'Posición',
        type: 'Tipo',
        image: 'Imagen',
        partner: 'Socio (único)',
        partners: 'Socios vinculados',
      },
      placeholders: {
        description: 'Ej.: Campaña de verano',
        link: 'https://...',
        position: 'Ej.: 1',
      },
      hints: {
        imageAccepted: 'Formatos aceptados: PNG, JPG, JPEG, GIF.',
        imageMaxSize: 'Tamaño máximo: 2MB.',
      },
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar imagen',
        errorType: 'Tipo de archivo no aceptado.',
        errorSize: 'El archivo excede el tamaño máximo.',
      },
      partnersChecklist: {
        searchPlaceholder: 'Buscar socio',
        selectAllLabel: 'Seleccionar todo',
        deselectAllLabel: 'Deseleccionar todo',
        selectedCountLabel: 'Número de socios seleccionados',
        emptyLabel: 'No se encontraron socios.',
        errorLabel: 'Error al cargar la lista de socios.',
        retryLabel: 'Intentar de nuevo',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 40 caracteres',
        linkRequired: 'El enlace es obligatorio',
        linkMaxLength: 'El enlace debe tener como máximo 200 caracteres',
        positionRequired: 'La posición es obligatoria',
        positionMin: 'La posición debe ser como mínimo 1',
        positionMax: 'La posición debe ser como máximo 127',
        typeRequired: 'El tipo es obligatorio',
      },
      businessRule: {
        limitReached: 'Se alcanzó el límite de 7 bandas de encabezado para este tipo.',
        svgNotAccepted: 'Los archivos SVG no son aceptados. Use PNG, JPG, JPEG o GIF.',
      },
    },
  },

  birthNote: {
    singularLabel: 'Observación de Nacimiento',
    pluralLabel: 'Observación de Nacimientos',
    list: {
      pageTitle: 'Observación Nacimiento',
      pageSubtitle: 'Administre las observaciones de nacimiento utilizadas en los animales.',
      deletedToast: 'Observación de nacimiento eliminada con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna observación de nacimiento registrada.',
        descriptionEmpty: 'Comience agregando la primera observación de nacimiento.',
        titleFiltered: 'Ninguna observación de nacimiento encontrada.',
        descriptionFiltered: 'Intente ajustar la búsqueda.',
        cta: 'Nueva Observación de Nacimiento',
      },
    },
    filter: {
      title: 'Filtrar observaciones de nacimiento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nueva Observación de Nacimiento',
        edit: 'Editar Observación de Nacimiento',
      },
      subtitle: {
        create: 'Registre una nueva observación de nacimiento utilizada en los animales.',
        edit: 'Actualice los datos de la observación de nacimiento.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Nacimiento asistido',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  categoryType: {
    singularLabel: 'Tipo de Categoría',
    pluralLabel: 'Tipo de Categorías',
    list: {
      pageTitle: 'Tipos de Categoría',
      pageSubtitle: 'Administre los tipos utilizados en las categorías financieras.',
      deletedToast: 'Tipo de categoría eliminado con éxito',
      table: {
        description: 'Descripción',
        isEnabled: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún tipo de categoría registrado.',
        descriptionEmpty: 'Comience agregando el primer tipo de categoría.',
        titleEmptyNoCreate: 'Ningún tipo de categoría registrado.',
        descriptionEmptyNoCreate:
          'Consulte a un administrador para registrar un tipo de categoría.',
        titleFiltered: 'Ningún tipo de categoría encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Tipo de Categoría',
      },
    },
    filter: {
      title: 'Filtrar tipos de categoría',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nuevo Tipo de Categoría',
        edit: 'Editar Tipo de Categoría',
      },
      subtitle: {
        create: 'Registre un nuevo tipo para uso en las categorías financieras.',
        edit: 'Actualice los datos del tipo de categoría.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Ingresos Operacionales',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  diagnosticTechnique: {
    singularLabel: 'Técnica de Diagnóstico',
    pluralLabel: 'Técnica de Diagnósticos',
    list: {
      pageTitle: 'Técnicas de Diagnóstico',
      pageSubtitle: 'Administre las técnicas utilizadas en el diagnóstico de gestación.',
      deletedToast: 'Técnica de diagnóstico eliminada con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna técnica de diagnóstico registrada.',
        descriptionEmpty: 'Comience agregando la primera técnica de diagnóstico.',
        titleFiltered: 'Ninguna técnica de diagnóstico encontrada.',
        descriptionFiltered: 'Intente ajustar la búsqueda.',
        cta: 'Nueva Técnica de Diagnóstico',
      },
    },
    filter: {
      title: 'Filtrar técnicas de diagnóstico',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
    },
    form: {
      title: {
        create: 'Nueva Técnica de Diagnóstico',
        edit: 'Editar Técnica de Diagnóstico',
      },
      subtitle: {
        create: 'Registre una nueva técnica utilizada en el diagnóstico de gestación.',
        edit: 'Actualice los datos de la técnica de diagnóstico.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Ultrasonografía',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  // ============================================
  // Administrativo — Gestión Documentos — Tipo Documento (DocumentType,
  // TASK-DT-FE-01). Esta Tarea cubre solo `list`/`filter` — `form.*` se
  // completa en TASK-DT-FE-02.
  // ============================================
  documentTypes: {
    singularLabel: 'Tipo Documento',
    pluralLabel: 'Tipos de Documento',
    list: {
      pageTitle: 'Tipos de Documento',
      pageSubtitle: 'Administre el árbol de tipos de documento.',
      deletedToast: 'Tipo de documento eliminado con éxito',
      table: {
        code: 'Código',
        name: 'Nombre',
        order: 'Orden',
        isEnabled: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        actions: 'Acciones',
      },
      actions: {
        edit: 'Editar',
        addChild: 'Crear descendiente',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún tipo de documento registrado.',
        descriptionEmpty: 'Comience agregando el primer tipo de documento.',
        titleFiltered: 'Ningún tipo de documento encontrado.',
        descriptionFiltered: 'Intente ajustar la búsqueda.',
        cta: 'Nuevo Tipo de Documento',
      },
      error: {
        message: 'No fue posible cargar el árbol de Tipos de Documento.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar tipos de documento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código o nombre',
    },
    form: {
      title: {
        create: 'Nuevo Tipo de Documento',
        createChild: 'Nuevo Tipo de Documento (descendiente)',
        edit: 'Editar Tipo de Documento',
      },
      subtitle: {
        create: 'Registre un nuevo tipo de documento.',
        edit: 'Actualice los datos del tipo de documento.',
      },
      fields: {
        code: 'Código',
        name: 'Nombre',
        isEnabled: 'Estado',
        order: 'Orden',
        parent: 'Antecesor',
      },
      placeholders: {
        name: 'Ej.: Licencia de Conducir',
      },
      parentPlaceholder: {
        root: 'Raíz (sin antecesor)',
      },
      hints: {
        codeGenerated: 'Generado automáticamente al guardar',
      },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 60 caracteres',
        isEnabledRequired: 'El estado es obligatorio',
        orderRequired: 'El orden es obligatorio',
      },
    },
  },
  familyEquipment: {
    singularLabel: 'Familia de Bienes',
    pluralLabel: 'Familia de Bieness',
    list: {
      pageTitle: 'Familia de Bienes',
      pageSubtitle:
        'Administre el catálogo de parámetros de equipos utilizado por inventario y depreciación.',
      deletedToast: 'Familia de bienes eliminada con éxito',
      table: {
        image: 'Imagen',
        description: 'Descripción',
        typeDepreciation: 'Tipo de depreciación',
        lifeBens: 'Vida útil (años)',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna familia de bienes registrada.',
        descriptionEmpty: 'Comience agregando la primera familia de bienes.',
        titleFiltered: 'Ninguna familia de bienes encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Familia de Bienes',
      },
    },
    filter: {
      title: 'Filtrar familia de bienes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      typeDepreciation: 'Tipo de depreciación',
      typeDepreciationAll: 'Todos',
      typeDepreciationOptions: {
        semResidual: 'Sin valor residual',
        comResidual: 'Con valor residual',
      },
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },
    form: {
      title: {
        create: 'Nueva Familia de Bienes',
        edit: 'Editar Familia de Bienes',
      },
      subtitle: {
        create: 'Registre una nueva familia de bienes para uso en inventario y depreciación.',
        edit: 'Actualice los datos de la familia de bienes.',
      },
      fields: {
        description: 'Descripción',
        typeDepreciation: 'Tipo de depreciación',
        depreciation: 'Depreciación (%)',
        residual: 'Valor residual (%)',
        lifeBens: 'Vida útil (años)',
        vlTimeProductive: 'Tiempo productivo',
        vlTimeUnproductive: 'Tiempo improductivo',
        isEnabled: 'Activo',
        image: 'Imagen',
      },
      placeholders: {
        description: 'Ej.: Tractor oruga',
      },
      hints: {
        residualConditional: 'Obligatorio cuando el tipo de depreciación es "Con valor residual".',
        imageAccepted: 'Formatos aceptados: JPEG, PNG, JPG, GIF, SVG.',
        imageMaxSize: 'Tamaño máximo: 2 MB.',
      },
      typeDepreciationOptions: {
        semResidual: 'Sin valor residual',
        comResidual: 'Con valor residual',
      },
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar imagen',
        removeLabel: 'Eliminar imagen',
        errorType: 'Formato no aceptado. Suba un archivo JPEG, PNG, JPG, GIF o SVG.',
        errorSize: 'El archivo excede el tamaño máximo de 2 MB.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        typeDepreciationRequired: 'Seleccione el tipo de depreciación',
        depreciationRange: 'La depreciación debe estar entre 0 y 100',
        residualRequired: 'El valor residual es obligatorio para este tipo de depreciación',
        residualRange: 'El valor residual debe estar entre 0 y 100',
        lifeBensPositive: 'La vida útil debe ser un número entero mayor que cero',
        vlTimeMin: 'El valor debe ser mayor o igual a cero',
      },
    },
  },
  fodder: {
    singularLabel: 'Forraje',
    pluralLabel: 'Forrajes',
    list: {
      pageTitle: 'Forraje',
      pageSubtitle: 'Administre los registros de forraje utilizados en el pastoreo del rebaño.',
      deletedToast: 'Forraje eliminado con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún forraje registrado.',
        descriptionEmpty: 'Comience agregando el primer forraje.',
        cta: 'Nuevo Forraje',
      },
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Este forraje está vinculado a registros de pastoreo. Elimine el vínculo abajo antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        grazings: 'Pastoreo(s) vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Nuevo Forraje',
        edit: 'Editar Forraje',
      },
      subtitle: {
        create: 'Registre un nuevo forraje utilizado en el pastoreo del rebaño.',
        edit: 'Actualice los datos del forraje.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Pasto elefante',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  grazing: {
    singularLabel: 'Pastoreo',
    pluralLabel: 'Pastoreos',
    list: {
      pageTitle: 'Módulo de Pastoreo',
      pageSubtitle: 'Administre los pastoreos utilizados en la rotación de potreros del rebaño.',
      deletedToast: 'Pastoreo eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        fodder: 'Forraje',
        date: 'Fecha',
        color: 'Color',
        controlProductivity: 'Controla Productividad',
        areasCount: 'Potreros',
        areasSum: 'Área Total (ha)',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún pastoreo registrado.',
        descriptionEmpty: 'Comience agregando el primer pastoreo.',
        cta: 'Nuevo Pastoreo',
      },
    },
    controlProductivityOptions: {
      yes: 'Sí',
      no: 'No',
    },
    colorOptions: {
      white: 'Blanco',
      blue: 'Azul',
      black: 'Negro',
      green: 'Verde',
      yellow: 'Amarillo',
      red: 'Rojo',
      gray: 'Gris',
      lightGray: 'Gris Claro',
      lightBlue: 'Azul Claro',
      darkBlue: 'Azul Oscuro',
      turquoise: 'Turquesa',
      darkGreen: 'Verde Oscuro',
      lightGreen: 'Verde Claro',
      orange: 'Naranja',
    },
    form: {
      title: {
        create: 'Nuevo Pastoreo',
        edit: 'Editar Pastoreo',
      },
      subtitle: {
        create: 'Registre un nuevo pastoreo para la rotación de potreros del rebaño.',
        edit: 'Actualice los datos del pastoreo.',
      },
      fields: {
        description: 'Descripción',
        fodder: 'Forraje',
        date: 'Fecha',
        code: 'Código',
        color: 'Color',
        controlProductivity: 'Controla Productividad',
        responsible: 'Responsable',
        areas: 'Potreros',
      },
      placeholders: {
        description: 'Ingrese la descripción del pastoreo',
        fodder: 'Seleccione el forraje',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
        // TASK-GZ-FE-03: el mapa de selección de potreros ya existe — texto
        // actualizado de "disponible en la próxima etapa" a la indicación de
        // uso real, mostrada arriba del mapa (mirror `demarcacaoText.mapHint`).
        areasPlaceholder: 'Haga clic en un potrero del mapa para seleccionarlo o deseleccionarlo.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        fodderRequired: 'El forraje es obligatorio',
        dateRequired: 'La fecha es obligatoria',
        colorFormat: 'Seleccione un color válido de la paleta disponible',
        colorRequired: 'El color es obligatorio',
        areasMin: 'Seleccione al menos un potrero',
        areasRequired: 'Los potreros son obligatorios',
      },
      invalidFieldsToast: 'Revise los campos resaltados en el formulario.',
    },
    map: {
      loading: 'Cargando potreros...',
      noActiveFarm: 'Seleccione una finca activa para ver los potreros disponibles.',
      errorState: {
        title: 'No se pudieron cargar los potreros',
        description: 'Ocurrió un error al buscar las Áreas de la finca activa.',
        retry: 'Intentar de nuevo',
      },
      emptyState: {
        title: 'Ningún potrero registrado en esta finca',
        description: 'Registre Áreas en el módulo de Finca/Área para poder seleccionarlas aquí.',
      },
      selectedCountLabel: '{count} potrero(s) seleccionado(s)',
      areaSumPreviewLabel: 'Área sumada (previa): {value} ha',
      conflictToast: {
        title: 'Potrero no disponible',
        description: '{description} ({code}) ya está vinculado a otro Pastoreo.',
      },
      validateErrorToast:
        'No se pudo verificar la disponibilidad de este potrero. Inténtelo de nuevo.',
    },
  },
  ibpt: {
    singularLabel: 'Tabla IBPT',
    pluralLabel: 'Tablas IBPT',
    list: {
      pageTitle: 'IBPT',
      pageSubtitle: 'Administre las tablas fiscales de incidencia tributaria por estado.',
      deletedToast: 'Tabla IBPT eliminada con éxito',
      table: { uf: 'Estado', versao: 'Versión', itemsCount: 'N.º Registros' },
      actions: { view: 'Visualizar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ninguna tabla IBPT registrada.',
        descriptionEmpty: 'Importe la primera tabla fiscal por estado.',
        cta: 'Nueva Tabla',
      },
    },
    import: {
      title: { create: 'Nueva Tabla IBPT' },
      subtitle: { create: 'Importe una tabla fiscal por estado desde un archivo CSV.' },
      fields: { uf: 'Estado', versao: 'Versión', file: 'Archivo CSV' },
      fileUpload: {
        label: 'Archivo CSV',
        hint: 'Formatos aceptados: .csv, .txt — hasta 10MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Formato de archivo no aceptado.',
        errorSizeMessage: 'El archivo excede el tamaño máximo.',
      },
      warning: {
        title: 'Atención: sustitución total de la tabla',
        description:
          'Reimportar un estado que ya tiene tabla registrada sustituye por completo la tabla anterior ' +
          '(encabezado y filas). No hay historial de versiones.',
      },
      rowErrors: { title: 'El archivo CSV contiene filas inválidas:' },
      validation: {
        ufRequired: 'El estado es obligatorio',
        versaoRequired: 'La versión es obligatoria',
        versaoMaxLength: 'La versión debe tener como máximo 30 caracteres',
        fileRequired: 'Seleccione un archivo CSV',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Guardar',
      importSuccessToast: 'Tabla IBPT importada con éxito',
    },
    detail: {
      pageTitle: 'IBPT {uf}',
      itemsLabel: 'Registros',
      fields: { uf: 'Estado', versao: 'Versión', itemsCount: 'N.º Registros' },
      table: {
        codigo: 'Código',
        nacionalFederal: 'Nac. Federal',
        importadoFederal: 'Imp. Federal',
        estadual: 'Estadual',
        municipal: 'Municipal',
      },
      notFound: {
        title: 'Tabla IBPT no encontrada',
        description: 'La tabla solicitada no existe o fue eliminada.',
        back: 'Volver',
      },
    },
  },
  identificationType: {
    singularLabel: 'Tipo de Identificación',
    pluralLabel: 'Tipo de Identificacións',
    list: {
      pageTitle: 'Tipos de Identificación',
      pageSubtitle: 'Administre los tipos de identificación utilizados en los animales.',
      deletedToast: 'Tipo de identificación eliminado con éxito',
      table: {
        description: 'Descripción',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún tipo de identificación registrado.',
        descriptionEmpty: 'Comience agregando el primer tipo de identificación.',
        cta: 'Nuevo Tipo de Identificación',
      },
    },
    form: {
      title: {
        create: 'Nuevo Tipo de Identificación',
        edit: 'Editar Tipo de Identificación',
      },
      subtitle: {
        create: 'Registre un nuevo tipo de identificación utilizado en los animales.',
        edit: 'Actualice los datos del tipo de identificación.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Caravana',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  indexer: {
    singularLabel: 'Indexador',
    pluralLabel: 'Indexadors',
    list: {
      pageTitle: 'Indexadores',
      pageSubtitle: 'Administre los indexadores utilizados en los contratos financieros.',
      deletedToast: 'Indexador eliminado con éxito',
      table: {
        description: 'Descripción',
        descriptive: 'Descriptivo',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún indexador registrado.',
        descriptionEmpty: 'Comience agregando el primer indexador.',
        titleFiltered: 'Ningún indexador encontrado.',
        descriptionFiltered: 'Intente ajustar la búsqueda.',
        cta: 'Nuevo Indexador',
      },
    },
    filter: {
      title: 'Filtrar indexadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción o descriptivo',
    },
    form: {
      title: {
        create: 'Nuevo Indexador',
        edit: 'Editar Indexador',
      },
      subtitle: {
        create: 'Registre un nuevo indexador utilizado en los contratos financieros.',
        edit: 'Actualice los datos del indexador.',
      },
      fields: {
        description: 'Descripción',
        descriptive: 'Descriptivo',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: IGPM',
        descriptive: 'Ej.: Índice General de Precios del Mercado',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        descriptiveRequired: 'El descriptivo es obligatorio',
        descriptiveMaxLength: 'El descriptivo debe tener como máximo 100 caracteres',
      },
    },
  },
  issueDfeSyncTime: {
    singularLabel: 'Sincronización DFe',
    pluralLabel: 'Sincronización DFes',
    list: {
      pageTitle: 'Sincronización DFe',
      pageSubtitle: 'Administre los horarios de sincronización de DFe por Emisor Fiscal.',
      deletedToast: 'Sincronización eliminada con éxito',
      table: {
        issuer: 'Emisor',
        syncHour: 'Hora de Sincronización',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna sincronización registrada.',
        descriptionEmpty: 'Comience agregando la primera sincronización de DFe.',
        titleEmptyNoCreate: 'Ninguna sincronización registrada.',
        descriptionEmptyNoCreate: 'Consulte a un administrador para registrar una sincronización.',
        cta: 'Nueva Sincronización',
      },
      error: {
        message: 'No fue posible cargar las sincronizaciones.',
        retry: 'Intentar de nuevo',
      },
    },
    form: {
      title: { create: 'Nueva Sincronización', edit: 'Editar Sincronización' },
      subtitle: {
        create: 'Registre un nuevo horario de sincronización de DFe para un Emisor Fiscal.',
        edit: 'Actualice el horario de sincronización de DFe.',
      },
      fields: {
        issue: 'Emisor',
        syncHour: 'Hora de Sincronización',
      },
      placeholders: {
        issue: 'Buscar emisor fiscal...',
      },
      validation: {
        issueRequired: 'Seleccione un Emisor Fiscal',
        syncHourRequired: 'Seleccione la hora de sincronización',
      },
    },
  },
  lowReason: {
    singularLabel: 'Motivo de Baja',
    pluralLabel: 'Motivo de Bajas',
    list: {
      pageTitle: 'Motivos de Baja',
      pageSubtitle: 'Administre los motivos utilizados en las bajas de animales.',
      deletedToast: 'Motivo de baja eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        doMovement: 'Mueve Stock',
        isEnabled: 'Estado',
        doMovementYes: 'Sí',
        doMovementNo: 'No',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún motivo de baja registrado.',
        descriptionEmpty: 'Comience agregando el primer motivo de baja.',
        titleEmptyNoCreate: 'Ningún motivo de baja registrado.',
        descriptionEmptyNoCreate: 'Consulte a un administrador para registrar un motivo de baja.',
        titleFiltered: 'Ningún motivo de baja encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Motivo de Baja',
      },
    },
    filter: {
      title: 'Filtrar motivos de baja',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      doMovement: 'Mueve Stock',
      doMovementAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      movementOptions: {
        yes: 'Sí',
        no: 'No',
      },
    },
    form: {
      title: {
        create: 'Nuevo Motivo de Baja',
        edit: 'Editar Motivo de Baja',
      },
      subtitle: {
        create: 'Registre un nuevo motivo para uso en las bajas de animales.',
        edit: 'Actualice los datos del motivo de baja.',
      },
      fields: {
        code: 'Código',
        description: 'Descripción',
        doMovement: 'Mueve Stock',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Muerte, Venta, Hurto',
      },
      hints: {
        codeGenerated: 'Generado automáticamente al guardar',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
    detail: {
      sections: {
        generalData: 'Datos Generales',
      },
      fields: {
        code: 'Código',
        description: 'Descripción',
        doMovement: 'Mueve Stock',
        isEnabled: 'Estado',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Motivo de baja no encontrado',
        description: 'El motivo de baja que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
  measurement: {
    singularLabel: 'Unidad de Medida',
    pluralLabel: 'Unidad de Medidas',
    list: {
      pageTitle: 'Unidades de Medida',
      pageSubtitle: 'Administre las unidades de medida utilizadas en los registros del sistema.',
      deletedToast: 'Unidad de medida eliminada con éxito',
      table: {
        name: 'Sigla',
        description: 'Descripción',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna unidad de medida registrada.',
        descriptionEmpty: 'Comience agregando la primera unidad de medida.',
        titleEmptyNoCreate: 'Ninguna unidad de medida disponible.',
        descriptionEmptyNoCreate:
          'Aún no hay unidades de medida registradas. Póngase en contacto con el administrador de la plataforma.',
        titleFiltered: 'Ninguna unidad de medida encontrada.',
        descriptionFiltered: 'Intente ajustar o borrar la búsqueda.',
        cta: 'Nueva Unidad de Medida',
      },
      deleteConfirm: {
        title: 'Eliminar unidad de medida',
        description: '¿Está seguro de que desea eliminar la unidad de medida',
        warning: 'Esta eliminación es definitiva y no se puede deshacer.',
      },
    },
    filter: {
      title: 'Buscar Unidad de Medida',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por sigla o descripción',
    },
    form: {
      title: {
        create: 'Nueva Unidad de Medida',
        edit: 'Editar Unidad de Medida',
      },
      subtitle: {
        create: 'Registre una nueva unidad de medida.',
        edit: 'Actualice los datos de la unidad de medida.',
      },
      fields: {
        name: 'Sigla',
        description: 'Descripción',
      },
      placeholders: {
        name: 'Ej.: KG',
        description: 'Ej.: Kilogramo',
      },
      validation: {
        nameRequired: 'La sigla es obligatoria',
        nameMaxLength: 'La sigla debe tener como máximo 8 caracteres',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
      },
    },
  },
  nfse: {
    singularLabel: 'NFS-e Recibida',
    pluralLabel: 'NFS-e Recibidas',
    list: {
      pageTitle: 'NFSe Recibidas',
      pageSubtitle: 'Consulte las notas fiscales de servicio recibidas por el Emisor.',
      table: {
        prestador: 'Prestador',
        cpfCnpj: 'CPF/CNPJ',
        numero: 'Número',
        valor: 'Valor',
        dtEmissao: 'Fecha de Emisión',
        competencia: 'Período',
        lancada: 'Lanzada',
        ibs: 'IBS',
        cbs: 'CBS',
      },
      badges: {
        launched: 'Lanzada',
        notLaunched: 'No lanzada',
      },
      actions: {
        launchExpense: 'Lanzar NFe Gasto',
        generateDanfe: 'Generar DANFE',
        downloadXml: 'Descargar XML',
      },
      emptyState: {
        titleNoIssuer: 'Seleccione el Emisor',
        descriptionNoIssuer: 'Seleccione el Emisor para filtrar y listar las NFS-e recibidas.',
        titleEmpty: 'Ninguna NFS-e sincronizada todavía.',
        descriptionEmpty: 'Use "Buscar DFe" para sincronizar los documentos de este Emisor.',
        titleFiltered: 'Ninguna NFS-e encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o el período informado.',
      },
      error: {
        message: 'No fue posible cargar las NFS-e recibidas.',
        retry: 'Intentar de nuevo',
      },
      downloadXmlError: 'No fue posible descargar el XML de esta NFS-e.',
      downloadXmlSuccess: 'XML descargado con éxito',
      generateDanfeError: 'No fue posible generar el DANFE de esta NFS-e.',
    },
    filter: {
      title: 'Filtrar NFSe Recibidas',
      issuer: 'Seleccione el Emisor',
      issuerPlaceholder: 'Buscar emisor fiscal...',
      issuerRequired: 'Obligatorio para listar',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por prestador o CPF/CNPJ',
      dateFrom: 'Fecha Inicial',
      dateTo: 'Fecha Final',
      dateRangeInvalid: 'La fecha final es anterior a la fecha inicial.',
      launched: 'Lanzada',
      launchedAll: 'Todas',
      launchedOptions: {
        yes: 'Sí',
        no: 'No',
      },
    },
    syncScreen: {
      pageTitle: 'Buscar DFe',
      pageSubtitle: 'Consulte los documentos fiscales electrónicos recibidos de este Emisor.',
      issuer: 'Seleccione el Emisor',
      issuerPlaceholder: 'Buscar emisor fiscal...',
      issuerRequired: 'Seleccione un Emisor Fiscal',
      submitButton: 'Consultar DF-e',
      loadingMessage:
        'Consultando el webservice nacional... esto puede tardar algunos segundos o minutos.',
      successToast: 'documento(s) sincronizado(s)',
      errorToast: 'No fue posible consultar los DF-e de este Emisor.',
      certificateMissingError:
        'Este Emisor no tiene certificado digital A1 registrado. Registre el certificado para consultar DF-e.',
      certificateMissingLink: 'Ir al certificado del Emisor',
      emptyIssuerState: 'Seleccione un Emisor para consultar los DF-e.',
      successNone: 'ninguna NFS-e nueva',
      environmentHomologation: '(homologación)',
      retryButton: 'Intentar de nuevo',
      issuerLink: 'Ver registro del emisor',
      timeoutError: 'No fue posible completar la consulta a tiempo. Inténtelo de nuevo.',
    },
    expenseDraft: {
      successMessage: 'Borrador de gasto calculado con éxito',
      noPermissionReason: 'Necesita permiso para crear gastos para lanzar esta NFS-e.',
    },
  },
  parameterWeight: {
    singularLabel: 'Parámetro de Peso',
    pluralLabel: 'Parámetros de Peso',
    list: {
      pageTitle: 'Parámetros / Peso',
      pageSubtitle: 'Administre los rangos de peso utilizados en el manejo del rebaño.',
      deletedToast: 'Parámetro de peso eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        date: 'Fecha',
        info: 'Variación de Peso',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún parámetro de peso registrado.',
        descriptionEmpty: 'Comience agregando el primer rango de peso.',
        titleFiltered: 'Ningún parámetro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Parámetro de Peso',
      },
    },
    filter: {
      title: 'Filtrar parámetros de peso',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción o código',
      dateFrom: 'Desde',
      dateTo: 'Hasta',
      dateRangeInvalid: 'La fecha final debe ser igual o posterior a la fecha inicial',
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Hay registros vinculados a este parámetro de peso. Elimine o reasigne los vínculos abajo antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        batches: 'Lote(s) vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Nuevo Parámetro de Peso',
        edit: 'Editar Parámetro de Peso',
      },
      subtitle: {
        create: 'Registre un nuevo rango de peso para el manejo del rebaño.',
        edit: 'Actualice los datos del rango de peso.',
      },
      fields: {
        description: 'Descripción',
        date: 'Fecha',
        initialWeight: 'Peso Inicial',
        finalWeight: 'Peso Final',
        code: 'Código',
        employee: 'Responsable',
        responsible: 'Responsable',
      },
      placeholders: {
        description: 'Ej.: Ternero - Destete',
      },
      hints: {
        codeAutoGenerated: 'El código se generará automáticamente al guardar.',
        employeeHistoric: 'Responsable (histórico): {name}',
      },
      validation: {
        dateInvalid: 'Ingrese una fecha válida',
        dateRequired: 'La fecha es obligatoria',
        dateOutOfRange: 'La fecha debe estar entre 01/01/1900 y 31/12/2100',
        weightInvalid: 'Ingrese un peso válido',
        weightRequired: 'El peso es obligatorio',
        weightMin: 'El peso no puede ser negativo',
        finalWeightMustBeGreater: 'El peso final debe ser mayor que el peso inicial',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 40 caracteres',
      },
    },
  },
  paymentTerm: {
    singularLabel: 'Condición de Pago',
    pluralLabel: 'Condición de Pagos',
    list: {
      pageTitle: 'Condiciones de Pago',
      pageSubtitle:
        'Administre las condiciones de pago utilizadas en cuentas por pagar y por cobrar.',
      deletedToast: 'Condición de pago eliminada con éxito',
      table: {
        description: 'Descripción',
        condition: 'Condición',
        type: 'Tipo',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: { edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ninguna condición de pago registrada.',
        descriptionEmpty: 'Comience agregando la primera condición de pago.',
        titleFiltered: 'Ninguna condición de pago encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Condición de Pago',
      },
    },
    filter: {
      title: 'Filtrar condiciones de pago',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Activo', inactive: 'Inactivo' },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: { purchase: 'Compra', sale: 'Venta', both: 'Ambos' },
    },
    form: {
      title: { create: 'Nueva Condición de Pago', edit: 'Editar Condición de Pago' },
      subtitle: {
        create: 'Registre una nueva condición de pago para uso en cuentas por pagar y por cobrar.',
        edit: 'Actualice los datos de la condición de pago.',
      },
      fields: {
        description: 'Descripción',
        condition: 'Condición (días)',
        type: 'Tipo',
        isEnabled: 'Estado',
        outDay: 'Fuera de día',
      },
      placeholders: { description: 'Ej.: 30/60/90 días', condition: 'Ej.: 10,20,30' },
      typeOptions: { purchase: 'Compra', sale: 'Venta', both: 'Ambos' },
      outDayOptions: { yes: 'Sí', no: 'No' },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        conditionRequired: 'La condición es obligatoria',
        conditionMaxLength: 'La condición debe tener como máximo 100 caracteres',
        conditionInvalid: 'Favor seguir el patrón de días separados por coma: 10,20,30.',
        typeRequired: 'El tipo es obligatorio',
      },
    },
  },
  // Registros Base — Configuraciones — Permisos (Permission, ejecución
  // 032, TASK-FE-2400/2404). 4 pantallas: Listado (búsqueda opcional,
  // contrato §7.2) + Creación/Edición (2 campos) + Visualización (4 campos,
  // fiel a `show.blade.php`).
  permission: {
    singularLabel: 'Permiso',
    pluralLabel: 'Permisos',
    list: {
      pageTitle: 'Permisos',
      pageSubtitle: 'Administre el catálogo de permisos del sistema.',
      deletedToast: 'Permiso eliminado con éxito',
      table: { name: 'Nombre', description: 'Descripción' },
      actions: { view: 'Ver', edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ningún permiso registrado.',
        descriptionEmpty: 'Comience registrando el primer permiso.',
        titleFiltered: 'Ningún permiso encontrado.',
        descriptionFiltered: 'Intente ajustar los términos de la búsqueda.',
        cta: 'Nuevo Permiso',
      },
      search: { placeholder: 'Buscar por nombre o descripción...' },
    },
    form: {
      title: { create: 'Nuevo Permiso', edit: 'Editar Permiso' },
      subtitle: {
        create: 'Registre un nuevo permiso.',
        edit: 'Actualice los datos del permiso.',
      },
      fields: { name: 'Nombre', description: 'Descripción' },
      validation: {
        nameRequired: 'El nombre es obligatorio',
        nameMaxLength: 'El nombre debe tener como máximo 60 caracteres',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 191 caracteres',
      },
    },
    detail: {
      pageTitle: 'Permiso',
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        createdAt: 'Fecha de Creación',
        updatedAt: 'Fecha de Actualización',
      },
      actions: { edit: 'Editar' },
      notFound: {
        title: 'Permiso no encontrado',
        description: 'El permiso solicitado no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
  // Cadastros Base — Configuraciones — Términos y Condiciones
  // (PlatformDocument, ejecución 032, TASK-FE-2500/2501/2502). Pantalla ÚNICA
  // (settings-form de registro singleton, SIN lista, SIN `/nuevo`/`:uuid`) — 2
  // tarjetas independientes ("Términos de Uso AGRO365" / "Política de
  // Privacidad AGRO365"), cada una con su propia carga + metadato + botón
  // "Guardar".
  platformDocuments: {
    singularLabel: 'Términos y Condiciones',
    page: {
      title: 'Términos y Condiciones',
      subtitle: 'Administre los documentos institucionales PDF mostrados a los usuarios.',
    },
    cards: {
      termsOfUse: {
        title: 'Términos de Uso AGRO365',
        uploadHint: 'Adjuntar en formato PDF. Máx. 2MB.',
        uploadedAt: 'Enviado el {date}',
        uploadedAtWithAuthor: 'Enviado el {date} por {author}',
        emptyState: 'Ningún documento enviado todavía.',
      },
      privacyPolicy: {
        title: 'Política de Privacidad AGRO365',
        uploadHint: 'Adjuntar en formato PDF. Máx. 2MB.',
        uploadedAt: 'Enviado el {date}',
        uploadedAtWithAuthor: 'Enviado el {date} por {author}',
        emptyState: 'Ningún documento enviado todavía.',
      },
    },
    errors: {
      loadFailed: {
        title: 'No fue posible cargar los documentos',
        description: 'Intente nuevamente en unos instantes.',
      },
    },
  },
  reversalExpense: {
    singularLabel: 'Reembolso',
    pluralLabel: 'Reembolsos',
    list: {
      pageTitle: 'Reembolso',
      pageSubtitle:
        'Administre los tipos de reembolso utilizados para clasificar gastos accesorios de Cobranza y Transferencia.',
      deletedToast: 'Reembolso eliminado con éxito',
      table: {
        description: 'Descripción',
        useKg: 'Usa Kg',
        isEnabled: 'Estado',
        value: 'Valor',
        active: 'Activo',
        inactive: 'Inactivo',
        yes: 'Sí',
        no: 'No',
      },
      actions: { edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ningún reembolso registrado.',
        descriptionEmpty: 'Comience agregando el primer reembolso.',
        titleFiltered: 'Ningún reembolso encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Reembolso',
      },
    },
    filter: {
      title: 'Filtrar reembolsos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Activo', inactive: 'Inactivo' },
    },
    form: {
      title: { create: 'Nuevo Reembolso', edit: 'Editar Reembolso' },
      subtitle: {
        create: 'Registre un nuevo tipo de reembolso.',
        edit: 'Actualice los datos del reembolso.',
      },
      fields: { description: 'Descripción', isEnabled: 'Estado', value: 'Valor', useKg: 'Usa Kg' },
      placeholders: { description: 'Ej.: Reembolso de DARF' },
      useKgOptions: { yes: 'Sí', no: 'No' },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 30 caracteres',
        valueRequired: 'El valor es obligatorio',
        valueInvalid: 'Ingrese un valor numérico válido',
        valueMin: 'El valor no puede ser negativo',
      },
    },
  },
  serviceExpense: {
    singularLabel: 'Servicio',
    pluralLabel: 'Servicios',
    list: {
      pageTitle: 'Servicios',
      pageSubtitle:
        'Administre los tipos de servicio utilizados para clasificar gastos accesorios de Cobranza y Transferencia.',
      deletedToast: 'Servicio eliminado con éxito',
      table: {
        description: 'Descripción',
        useKg: 'Usa Kg',
        isEnabled: 'Estado',
        payTeam: 'Pago de Equipo',
        hasCommission: 'Tiene Comisión',
        value: 'Valor',
        active: 'Activo',
        inactive: 'Inactivo',
        yes: 'Sí',
        no: 'No',
      },
      actions: { edit: 'Editar', delete: 'Eliminar' },
      emptyState: {
        titleEmpty: 'Ningún servicio registrado.',
        descriptionEmpty: 'Comience agregando el primer servicio.',
        titleFiltered: 'Ningún servicio encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Agregar Servicio',
      },
    },
    filter: {
      title: 'Filtrar servicios',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Activo', inactive: 'Inactivo' },
    },
    form: {
      title: { create: 'Nuevo Servicio', edit: 'Editar Servicio' },
      subtitle: {
        create: 'Registre un nuevo tipo de servicio.',
        edit: 'Actualice los datos del servicio.',
      },
      fields: {
        description: 'Descripción',
        isEnabled: 'Estado',
        value: 'Vl. Referencia',
        useKg: 'Usa Kg',
        payTeam: 'Pago de Equipo',
        hasCommission: 'Tiene Comisión',
        commission: 'Comisión(%)',
      },
      placeholders: { description: 'Ej.: Poda de árboles' },
      useKgOptions: { yes: 'Sí', no: 'No' },
      payTeamOptions: { yes: 'Sí', no: 'No' },
      hasCommissionOptions: { yes: 'Sí', no: 'No' },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 30 caracteres',
        valueRequired: 'El valor es obligatorio',
        valueInvalid: 'Ingrese un valor numérico válido',
        valueMin: 'El valor no puede ser negativo',
        commissionRequired: 'La comisión es obligatoria',
        commissionInvalid: 'Ingrese un valor numérico válido',
        commissionMin: 'La comisión no puede ser negativa',
      },
    },
  },
  systemUpdate: {
    singularLabel: 'Actualización del Sistema',
    pluralLabel: 'Actualizaciones del Sistema',
    list: {
      pageTitle: 'Actualizaciones del Sistema',
      pageSubtitle: 'Administre los comunicados y el changelog mostrados a los usuarios.',
      deletedToast: 'Actualización del sistema eliminada con éxito',
      table: {
        releaseDate: 'Fecha de Lanzamiento',
        description: 'Descripción',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna actualización del sistema registrada.',
        descriptionEmpty: 'Comience agregando el primer comunicado.',
        cta: 'Nueva Actualización',
      },
    },
    form: {
      title: { create: 'Nueva Actualización', edit: 'Editar Actualización' },
      subtitle: {
        create: 'Registre un nuevo comunicado del sistema.',
        edit: 'Actualice los datos del comunicado.',
      },
      fields: {
        releaseDate: 'Fecha de Lanzamiento',
        description: 'Descripción',
      },
      placeholders: {
        description: 'Describa la actualización...',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
      },
    },
    detail: {
      pageTitle: 'Actualización del Sistema',
      fields: {
        releaseDate: 'Fecha de Lanzamiento',
        description: 'Descripción',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Actualización no encontrada',
        description: 'La actualización del sistema solicitada no existe o fue eliminada.',
        back: 'Volver',
      },
    },
    pendingModal: {
      title: 'Actualización del Sistema',
      dismiss: 'Cerrar',
    },
  },
  // Contratantes (Tenant, TASK-TN-FE-01/02) — CRUD completo, fidelidad al
  // formulario legado `agro365/resources/views/tenants/_forms.blade.php`.
  tenant: {
    singularLabel: 'Contratante',
    pluralLabel: 'Contratantes',
    list: {
      pageTitle: 'Contratantes',
      pageSubtitle: 'Gestione los contratantes (clientes) de la plataforma.',
      deletedToast: 'Contratante eliminado correctamente',
      table: {
        nickname: 'Razón Social',
        nif: 'CPF/CNPJ',
        status: 'Estado',
        dueDate: 'Vencimiento',
        dueDateIndeterminate: 'Indeterminado',
      },
      actions: {
        edit: 'Editar',
        view: 'Ver',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún contratante registrado.',
        descriptionEmpty: 'Comience agregando el primer contratante.',
        titleFiltered: 'Ningún contratante encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Contratante',
      },
      deleteConfirm: {
        title: 'Eliminar contratante',
        description: '¿Está seguro de que desea eliminar el contratante',
        warning:
          'Esta acción es irreversible: las fincas y todos los datos vinculados a este contratante también serán eliminados.',
      },
    },
    filter: {
      title: 'Filtrar contratantes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre, razón social o CPF/CNPJ',
      searchMaxLength: 'La búsqueda acepta como máximo 60 caracteres.',
      status: 'Estado',
      statusAll: 'Todos',
      signature: 'Suscripción',
      signatureAll: 'Todas',
      dueMonth: 'Mes de vigencia',
      dueMonthAll: 'Todos',
      dueDay: 'Día de vencimiento',
      dueDayAll: 'Todos',
      dtAccession: 'Fecha de adhesión',
      startDate: 'Registrado desde',
      endDate: 'Registrado hasta',
      role: 'Asignación',
      roleAll: 'Todas',
      plan: 'Plan',
      planAll: 'Todos',
      months: {
        january: 'Enero',
        february: 'Febrero',
        march: 'Marzo',
        april: 'Abril',
        may: 'Mayo',
        june: 'Junio',
        july: 'Julio',
        august: 'Agosto',
        september: 'Septiembre',
        october: 'Octubre',
        november: 'Noviembre',
        december: 'Diciembre',
      },
    },
    status: {
      active: 'Habilitado',
      defaulting: 'Moroso',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    },
    signature: {
      trial: 'Prueba',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
      biannual: 'Bianual',
      undetermined: 'Indeterminado',
    },
    dueDay: {
      dayPrefix: 'Día',
    },
    form: {
      title: {
        create: 'Nuevo Contratante',
        edit: 'Editar Contratante',
        view: 'Ver Contratante',
      },
      subtitle: {
        create: 'Registre un nuevo contratante de la plataforma.',
        edit: 'Actualice los datos del contratante.',
      },
      fields: {
        countryId: 'País',
        nif: 'CPF/CNPJ',
        nickname: 'Razón Social',
        name: 'Nombre Fantasía',
        email: 'Correo Electrónico',
        phone: 'Teléfono',
        cellphone: 'Celular',
        roleId: 'Rol',
        planUuid: 'Plan',
        listAllFarms: 'Listar Todas las Fincas',
        qtdFarms: 'Cant. Fincas',
        qtdUsers: 'Cant. Usuarios',
        exportXls: 'Exportar XLS',
        zipCode: 'Código Postal',
        address: 'Dirección',
        city: 'Ciudad',
        contact: 'Contacto',
        contactPhone: 'Tel. del Contacto',
        status: 'Estado',
        usesCashBook: 'Utiliza Libro de Caja',
        useFiscal: 'Fiscal/No Fiscal',
        signature: 'Suscripción',
        dtAccession: 'Fecha de Adhesión',
        dueDate: 'Fecha de Vigencia de Suscripción',
        dueDay: 'Día de Vencimiento',
        value: 'Valor',
        generateFinancial: 'Genera Financiero NFe',
        generateTicket: 'Genera Boleto/Remesa',
        cancellationReason: 'Motivo de Cancelación',
        centers: 'Centros de Costo',
        qtdIssuers: 'Cant. Emisores',
        qtdNfe: 'Cant. NF-e',
        qtdCte: 'Cant. CT-e',
        qtdMdfe: 'Cant. MDF-e',
      },
      placeholders: {
        countryId: 'Seleccione el país',
        roleId: 'Seleccione el rol',
        planUuid: 'Seleccione el plan',
        city: 'Seleccione la ciudad',
        status: 'Seleccione el estado',
        signature: 'Seleccione la suscripción',
        dueDay: 'Seleccione el día',
        centersSearch: 'Buscar centro de costo',
        zipCode: '00000-000',
      },
      booleanOptions: {
        yes: 'Sí',
        no: 'No',
      },
      centersField: {
        selectAll: 'Marcar todos',
        deselectAll: 'Desmarcar todos',
        selectedCount: 'Seleccionados',
        empty: 'Ningún centro de costo encontrado.',
      },
      cepAutofill: {
        invalidFormat: {
          title: 'Formato de código postal inválido.',
          description: 'Informe el código postal completo en el formato 00000-000.',
        },
        notFound: {
          title: 'Código postal no encontrado.',
          description: 'Complete la dirección manualmente.',
        },
        cityNotResolved: {
          title: 'Ciudad no resuelta automáticamente',
          description:
            'Dirección completada, pero no fue posible identificar la ciudad — selecciónela manualmente.',
        },
        networkError: {
          title: 'Error al consultar el código postal',
          description:
            'No fue posible consultar el código postal ahora. Complete la dirección manualmente.',
        },
      },
      nifAutofill: {
        alreadyTenant: {
          title: 'La persona ya es contratante',
          description:
            'Esta persona ya está registrada como contratante. Los datos fueron completados; revíselos antes de guardar.',
        },
        cnpjNotFound: {
          title: 'CNPJ no encontrado.',
          description:
            'La Receita no devolvió datos para este CNPJ. Complete los datos manualmente.',
        },
        cnpjUnavailable: {
          title: 'Consulta de CNPJ no disponible',
          description: 'No fue posible consultar la Receita ahora. Complete los datos manualmente.',
        },
        rateLimited: {
          title: 'Demasiadas consultas seguidas',
          description: 'Espere unos instantes antes de consultar otro CPF/CNPJ.',
        },
        networkError: {
          title: 'Error al consultar el CPF/CNPJ',
          description: 'No fue posible obtener los datos ahora. Complete los datos manualmente.',
        },
      },
      validation: {
        countryIdRequired: 'El país es obligatorio',
        nifRequired: 'El CPF/CNPJ es obligatorio',
        nifInvalid: 'CPF/CNPJ inválido',
        nicknameRequired: 'La razón social es obligatoria',
        nicknameMaxLength: 'La razón social debe tener como máximo 60 caracteres',
        nameRequired: 'El nombre fantasía es obligatorio',
        nameMaxLength: 'El nombre fantasía debe tener como máximo 30 caracteres',
        emailRequired: 'El correo electrónico es obligatorio',
        emailInvalid: 'Correo electrónico inválido',
        emailMaxLength: 'El correo electrónico debe tener como máximo 89 caracteres',
        zipCodeMaxLength: 'El código postal debe tener como máximo 9 caracteres',
        cellphoneMaxLength: 'El celular debe tener como máximo 15 caracteres',
        contactPhoneMaxLength: 'El teléfono de contacto debe tener como máximo 15 caracteres',
        phoneRequired: 'El teléfono es obligatorio',
        phoneMaxLength: 'El teléfono debe tener como máximo 15 caracteres',
        roleIdRequired: 'Seleccione un rol',
        planRequired: 'Seleccione un plan',
        qtdFarmsRequired: 'La cantidad de fincas es obligatoria',
        qtdFarmsInvalid: 'Cantidad inválida',
        qtdFarmsMin: 'La cantidad debe ser como mínimo 1',
        qtdUsersRequired: 'La cantidad de usuarios es obligatoria',
        qtdUsersInvalid: 'Cantidad inválida',
        qtdUsersMin: 'La cantidad debe ser como mínimo 1',
        exportXlsRequired: 'Seleccione una opción',
        addressRequired: 'La dirección es obligatoria',
        addressMaxLength: 'La dirección debe tener como máximo 120 caracteres',
        cityRequired: 'Seleccione una ciudad',
        contactMaxLength: 'El contacto debe tener como máximo 120 caracteres',
        statusRequired: 'Seleccione un estado',
        useFiscalRequired: 'Seleccione una opción',
        signatureRequired: 'Seleccione una suscripción',
        dtAccessionRequired: 'La fecha de adhesión es obligatoria',
        dueDateRequired: 'La fecha de vigencia es obligatoria',
        dueDayRequired: 'Seleccione el día de vencimiento',
        valueRequired: 'El valor es obligatorio',
        valueInvalid: 'Valor inválido',
        valueMin: 'El valor no puede ser negativo',
        generateFinancialRequired: 'Seleccione una opción',
        generateTicketRequired: 'Seleccione una opción',
        cancellationReasonRequired: 'El motivo de cancelación es obligatorio',
        centersRequired: 'Seleccione al menos un centro de costo',
        qtdIssuersRequired: 'La cantidad de emisores es obligatoria',
        qtdIssuersInvalid: 'Cantidad inválida',
        qtdIssuersMin: 'La cantidad debe ser como mínimo 1',
        qtdNfeRequired: 'La cantidad de NF-e es obligatoria',
        qtdNfeInvalid: 'Cantidad inválida',
        qtdNfeMin: 'La cantidad debe ser como mínimo 1',
        qtdCteRequired: 'La cantidad de CT-e es obligatoria',
        qtdCteInvalid: 'Cantidad inválida',
        qtdCteMin: 'La cantidad debe ser como mínimo 1',
        qtdMdfeRequired: 'La cantidad de MDF-e es obligatoria',
        qtdMdfeInvalid: 'Cantidad inválida',
        qtdMdfeMin: 'La cantidad debe ser como mínimo 1',
      },
    },
  },
  tenantParameters: {
    singularLabel: 'Parametrizaciones',
    pluralLabel: 'Parametrizacioness',
    form: {
      title: 'Parametrizaciones',
      subtitle: 'Configure los parámetros generales del tenant.',
      sections: {
        fiscais: 'Fiscales',
      },
      fields: {
        calcIcmsDesonerado: 'Cálculo y deducción de ICMS exonerado',
      },
      booleanOptions: {
        yes: 'Sí',
        no: 'No',
      },
      validation: {
        calcIcmsDesoneradoRequired: 'Seleccione una opción',
      },
      noFarmSelected: {
        title: 'Seleccione una finca',
        description:
          'Las parametrizaciones se comparten entre todas las fincas del tenant, pero el acceso exige una finca activa seleccionada.',
      },
      savedToast: 'Parametrizaciones actualizadas con éxito.',
    },
  },
  typeTitle: {
    singularLabel: 'Tipo de Título',
    pluralLabel: 'Tipo de Títulos',
    list: {
      pageTitle: 'Tipos de Título',
      pageSubtitle: 'Administre los tipos de título utilizados en los asientos financieros.',
      deletedToast: 'Tipo de título eliminado con éxito',
      table: {
        description: 'Descripción',
        type: 'Tipo',
        factor: 'Factor',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún tipo de título registrado.',
        descriptionEmpty: 'Comience agregando el primer tipo de título.',
        titleFiltered: 'Ningún tipo de título encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Tipo de Título',
      },
    },
    filter: {
      title: 'Filtrar tipos de título',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        payable: 'Pagar',
        receivable: 'Recibir',
        both: 'Ambas',
      },
    },
    form: {
      title: {
        create: 'Nuevo Tipo de Título',
        edit: 'Editar Tipo de Título',
      },
      subtitle: {
        create: 'Registre un nuevo tipo de título para uso en los asientos financieros.',
        edit: 'Actualice los datos del tipo de título.',
      },
      fields: {
        description: 'Descripción',
        type: 'Tipo',
        factor: 'Factor',
        isEnabled: 'Estado',
      },
      placeholders: {
        description: 'Ej.: Boleto, Factura, Cheque',
      },
      typeOptions: {
        payable: 'Pagar',
        receivable: 'Recibir',
        both: 'Ambas',
      },
      factorOptions: {
        add: 'Suma',
        subtract: 'Disminuye',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        typeRequired: 'El tipo es obligatorio',
        factorRequired: 'El factor es obligatorio',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, ejecución 029,
  // TASK-FE-2000) — vínculo N:N Lote×Módulo de Pastoreo, SIN edición (la API
  // no tiene PUT/PATCH, D1 del contrato de API) — la acción de fila es
  // Ver+Eliminar. Eliminación NO DESTRUCTIVA (D3/D12 del contrato de API —
  // cierra el vínculo con un registro de salida, nunca borra el historial),
  // mirror `contrato-fe-convencoes-chokepoints.md §5.1`.
  // ============================================
  batchGrazing: {
    singularLabel: 'Lote / Módulo',
    pluralLabel: 'Lotes / Módulo',
    list: {
      pageTitle: 'Lote / Módulo',
      pageSubtitle: 'Administre los vínculos entre lotes de animales y módulos de pastoreo.',
      deletedToast: 'Vínculo de Lote/Módulo cerrado con éxito',
      table: {
        code: 'Código',
        grazing: 'Módulo',
        batches: 'Lotes Vinculados',
        date: 'Fecha',
        employee: 'Responsable',
        animalQuantity: 'Cant/Animales',
        uaQuantity: 'Cant/UA',
        stockingRate: 'Tasa de Carga/UA',
      },
      actions: {
        view: 'Ver',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún vínculo de Lote/Módulo registrado.',
        descriptionEmpty: 'Comience agregando el primer vínculo.',
        cta: 'Nuevo Lote/Módulo',
      },
    },
    deleteDialog: {
      title: 'Cerrar vínculo',
      description:
        'El vínculo se cerrará y se mantendrá un registro de salida en el historial — no se elimina ningún dato',
      warningText:
        'Esta acción no es destructiva: el historial de salida permanece disponible en el registro',
      confirm: 'Cerrar vínculo',
    },
    removeBatchDialog: {
      title: 'Quitar lote del vínculo',
      description:
        'Este lote sale del vínculo, pero el historial de salida se mantiene — no se elimina ningún dato',
      warningText:
        'Esta acción no es destructiva: el historial de salida permanece disponible en el registro',
      confirm: 'Quitar lote',
    },
    form: {
      title: {
        create: 'Nuevo Lote / Módulo',
      },
      subtitle: {
        create: 'Vincule uno o más lotes a un módulo de pastoreo.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        employee: 'Responsable',
        grazing: 'Módulo',
        batches: 'Lote',
        hectares: 'Hectáreas',
        animalQuantity: 'Cant/Animales',
        uaQuantity: 'Cant/UA',
        stockingRate: 'Tasa de Carga/UA',
      },
      placeholders: {
        code: 'Generado automáticamente',
        grazing: 'Seleccione el módulo de pastoreo',
        batches: 'Seleccione uno o más lotes',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
        metricsPending: 'Calculado después de guardar',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria',
        grazingRequired: 'El módulo es obligatorio',
        batchesRequired: 'Los lotes son obligatorios',
        batchesMin: 'Seleccione al menos un lote',
      },
    },
    detail: {
      sections: {
        generalData: 'Datos Generales',
        metrics: 'Métricas',
        batchesLinked: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        grazing: 'Módulo',
        date: 'Fecha',
        employee: 'Responsable',
        hectares: 'Hectáreas',
        animalQuantity: 'Cant/Animales',
        uaQuantity: 'Cant/UA',
        stockingRate: 'Tasa de Carga/UA',
      },
      actions: {
        removeBatch: 'Quitar',
        deleteLink: 'Eliminar vínculo',
      },
      notFound: {
        title: 'Vínculo no encontrado',
        description: 'El vínculo de Lote/Módulo que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Área (BatchArea, ejecución 029,
  // TASK-FE-2100) — hermana estructural de BatchGrazing (misma anatomía,
  // cambiando Módulo por Área). "UA/Soporte" existe aquí (a diferencia de
  // Lote/Módulo) y se muestra LITERAL (cabezas/hectárea, D9 del contrato de
  // API) — tooltip de nota de unidad en `hints.uaSupportTooltip`.
  // ============================================
  batchArea: {
    singularLabel: 'Lote / Área',
    pluralLabel: 'Lotes / Área',
    list: {
      pageTitle: 'Lote / Área',
      pageSubtitle: 'Administre los vínculos entre lotes de animales y áreas.',
      deletedToast: 'Vínculo de Lote/Área cerrado con éxito',
      table: {
        code: 'Código',
        area: 'Área',
        batches: 'Lotes Vinculados',
        date: 'Fecha',
        employee: 'Responsable',
        animalQuantity: 'Cant/Animales',
        uaQuantity: 'Cant/UA',
        stockingRate: 'Tasa de Carga/UA',
      },
      actions: {
        view: 'Ver',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún vínculo de Lote/Área registrado.',
        descriptionEmpty: 'Comience agregando el primer vínculo.',
        cta: 'Nuevo Lote/Área',
      },
      filter: {
        title: 'Filtros',
        batch: 'Lote',
        batchPlaceholder: 'Seleccione el lote',
        area: 'Área',
        areaPlaceholder: 'Seleccione el área',
      },
    },
    deleteDialog: {
      title: 'Cerrar vínculo',
      description:
        'El vínculo se cerrará y se mantendrá un registro de salida en el historial — no se elimina ningún dato',
      warningText:
        'Esta acción no es destructiva: el historial de salida permanece disponible en el registro',
      confirm: 'Cerrar vínculo',
    },
    removeBatchDialog: {
      title: 'Quitar lote del vínculo',
      description:
        'Este lote sale del vínculo, pero el historial de salida se mantiene — no se elimina ningún dato',
      warningText:
        'Esta acción no es destructiva: el historial de salida permanece disponible en el registro',
      confirm: 'Quitar lote',
    },
    form: {
      title: {
        create: 'Nuevo Lote / Área',
      },
      subtitle: {
        create: 'Vincule uno o más lotes a un área.',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        employee: 'Responsable',
        area: 'Área',
        batches: 'Lote',
        hectares: 'Hectáreas',
        uaSupport: 'UA/Soporte',
        animalQuantity: 'Cant/Animales',
        uaQuantity: 'Cant/UA',
        stockingRate: 'Tasa de Carga/UA',
      },
      placeholders: {
        code: 'Generado automáticamente',
        area: 'Seleccione el área',
        batches: 'Seleccione uno o más lotes',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
        metricsPending: 'Calculado después de guardar',
        uaSupportTooltip:
          'Calculado como cabezas ÷ hectárea, no UA — mantenido por decisión del responsable.',
      },
      validation: {
        dateRequired: 'La fecha es obligatoria',
        areaRequired: 'El área es obligatoria',
        batchesRequired: 'Los lotes son obligatorios',
        batchesMin: 'Seleccione al menos un lote',
      },
    },
    detail: {
      sections: {
        generalData: 'Datos Generales',
        metrics: 'Métricas',
        batchesLinked: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        area: 'Área',
        date: 'Fecha',
        employee: 'Responsable',
        animalQuantity: 'Cant/Animales',
        totalWeight: 'Peso Total (kg)',
        averageWeight: 'Peso Promedio (kg)',
        averageUaPerBatch: 'Total UA/Lote',
        hectares: 'Hectáreas',
      },
      hints: {
        averageUaPerBatchTooltip: 'Promedio de UA por animal, agregado.',
      },
      actions: {
        removeBatch: 'Quitar',
        deleteLink: 'Eliminar vínculo',
      },
      notFound: {
        title: 'Vínculo no encontrado',
        description: 'El vínculo de Lote/Área que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Cochos (Trough, ejecución 029,
  // TASK-FE-2200) — CRUD completo (creación/edición real, la API TIENE PUT)
  // + visualización NUEVA (tarjetas). Trío de ubicación Área/Módulo
  // Pastoreo/Corral con regla XOR (client-side) y semántica de "mantener vs.
  // desvincular" del Corral (D-FE-1 del contrato de pantalla — botón
  // explícito "Quitar vínculo").
  // ============================================
  trough: {
    singularLabel: 'Comedero',
    pluralLabel: 'Comederos',
    list: {
      pageTitle: 'Comederos',
      pageSubtitle: 'Administre los comederos utilizados en la alimentación del rebaño.',
      deletedToast: 'Comedero eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        type: 'Tipo',
        location: 'Ubicación',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún comedero registrado.',
        descriptionEmpty: 'Comience agregando el primer comedero.',
        titleFiltered: 'Ningún comedero encontrado.',
        descriptionFiltered: 'Ajuste los filtros de búsqueda e intente de nuevo.',
        cta: 'Nuevo Comedero',
      },
    },
    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Busque por código, descripción, área o módulo',
    },
    typeOptions: {
      covered: 'Cubierto',
      uncovered: 'Descubierto',
    },
    activeOptions: {
      yes: 'Sí',
      no: 'No',
    },
    form: {
      title: {
        create: 'Nuevo Comedero',
        edit: 'Editar Comedero',
      },
      subtitle: {
        create: 'Registre un nuevo comedero para la alimentación del rebaño.',
        edit: 'Actualice los datos del comedero.',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descripción',
        totalArea: 'Área (Cm)',
        grazing: 'Módulo de Pastoreo',
        area: 'Área',
        feedlotCorral: 'Corral',
        active: 'Activo',
      },
      placeholders: {
        type: 'Seleccione el tipo',
        description: 'Ingrese la descripción del comedero',
        totalArea: 'Ingrese el área en cm',
        grazing: 'Seleccione el módulo de pastoreo',
        area: 'Seleccione el área',
        feedlotCorral: 'Seleccione el corral',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
        locationExclusive:
          'Área y Módulo de Pastoreo son mutuamente excluyentes — seleccionar uno limpia el otro.',
        feedlotCorralKeep: 'Deje en blanco para mantener el corral actual.',
      },
      actions: {
        removeFeedlotCorral: 'Quitar vínculo',
      },
      validation: {
        typeRequired: 'El tipo es obligatorio',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        totalAreaRequired: 'El área es obligatoria',
        totalAreaMin: 'El área debe ser mayor o igual a cero',
        activeRequired: 'El estado es obligatorio',
      },
    },
    detail: {
      sections: {
        generalData: 'Datos Generales',
        location: 'Ubicación',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descripción',
        totalArea: 'Área (Cm)',
        area: 'Área',
        grazing: 'Módulo de Pastoreo',
        feedlotCorral: 'Corral',
      },
      emptyLocation: 'Ninguna ubicación vinculada',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Comedero no encontrado',
        description: 'El comedero que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Bebedouros (DrinkingFountain, ejecución
  // 029, TASK-FE-2300) — DELTA sobre Trough (misma anatomía): etiqueta
  // "Volumen(L)" en lugar de "Área(Cm)" (misma columna física `total_area`)
  // + campo extra opcional `length`/"Largo(cm)". Ítem de menú NUEVO (ver
  // navigationTree.ts/navigationPermissions.ts/languageSidebar.ts,
  // `contrato-fe-convencoes-chokepoints.md §7`).
  // ============================================
  drinkingFountain: {
    singularLabel: 'Bebedero',
    pluralLabel: 'Bebederos',
    list: {
      pageTitle: 'Bebederos',
      pageSubtitle: 'Administre los bebederos utilizados en la alimentación del rebaño.',
      deletedToast: 'Bebedero eliminado con éxito',
      table: {
        code: 'Código',
        description: 'Descripción',
        type: 'Tipo',
        location: 'Ubicación',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún bebedero registrado.',
        descriptionEmpty: 'Comience agregando el primer bebedero.',
        titleFiltered: 'Ningún bebedero encontrado.',
        descriptionFiltered: 'Ajuste los filtros de búsqueda e intente de nuevo.',
        cta: 'Nuevo Bebedero',
      },
    },
    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Busque por código, descripción, área o módulo',
    },
    typeOptions: {
      covered: 'Cubierto',
      uncovered: 'Descubierto',
    },
    activeOptions: {
      yes: 'Sí',
      no: 'No',
    },
    form: {
      title: {
        create: 'Nuevo Bebedero',
        edit: 'Editar Bebedero',
      },
      subtitle: {
        create: 'Registre un nuevo bebedero para la alimentación del rebaño.',
        edit: 'Actualice los datos del bebedero.',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descripción',
        totalArea: 'Volumen (L)',
        length: 'Largo (cm)',
        grazing: 'Módulo de Pastoreo',
        area: 'Área',
        feedlotCorral: 'Corral',
        active: 'Activo',
      },
      placeholders: {
        type: 'Seleccione el tipo',
        description: 'Ingrese la descripción del bebedero',
        totalArea: 'Ingrese el volumen en litros',
        length: 'Ingrese el largo en cm (opcional)',
        grazing: 'Seleccione el módulo de pastoreo',
        area: 'Seleccione el área',
        feedlotCorral: 'Seleccione el corral',
      },
      hints: {
        codeGenerated: 'Generado automáticamente',
        locationExclusive:
          'Área y Módulo de Pastoreo son mutuamente excluyentes — seleccionar uno limpia el otro.',
        feedlotCorralKeep: 'Deje en blanco para mantener el corral actual.',
      },
      actions: {
        removeFeedlotCorral: 'Quitar vínculo',
      },
      validation: {
        typeRequired: 'El tipo es obligatorio',
        descriptionRequired: 'La descripción es obligatoria',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres',
        totalAreaRequired: 'El volumen es obligatorio',
        totalAreaMin: 'El volumen debe ser mayor o igual a cero',
        lengthMin: 'El largo debe ser mayor o igual a cero',
        activeRequired: 'El estado es obligatorio',
      },
    },
    detail: {
      sections: {
        generalData: 'Datos Generales',
        location: 'Ubicación',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descripción',
        totalArea: 'Volumen (L)',
        length: 'Largo (cm)',
        area: 'Área',
        grazing: 'Módulo de Pastoreo',
        feedlotCorral: 'Corral',
      },
      emptyLocation: 'Ninguna ubicación vinculada',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Bebedero no encontrado',
        description: 'El bebedero que busca no existe o fue eliminado.',
        back: 'Volver',
      },
    },
  },
};
