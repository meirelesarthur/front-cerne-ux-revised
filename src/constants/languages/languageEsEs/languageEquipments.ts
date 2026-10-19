// src/constants/languages/languageEsEs/languageEquipments.ts
// Traducción es-ES del módulo "Inventario" (Equipment — Registros Base /
// Bienes-Activos, execução 026, TASK-FE-1002). Rótulos fieles al legado
// (`trad.inventario`/`trad.iv_inventario`). Ver
// `@/@types/language/module-equipments` para el contrato completo.

import { ModuleEquipments } from '@/@types/language/module-equipments';

export const languageEquipments: ModuleEquipments = {
  equipment: {
    singularLabel: 'Inventario',
    pluralLabel: 'Inventario',

    list: {
      pageTitle: 'Inventario',
      pageSubtitle: 'Gestione los bienes y activos físicos de la finca.',
      table: {
        code: 'Código',
        description: 'Descripción',
        family: 'Familia',
        proprietary: 'Propietario',
        status: 'Estado',
        statusActive: 'Activo',
        statusInactive: 'Inactivo',
        vlAcquisition: 'Valor de Adquisición',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún elemento registrado',
        descriptionEmpty: 'Registre el primer elemento del Inventario.',
        titleEmptyNoCreate: 'Ningún elemento registrado',
        descriptionEmptyNoCreate: 'Todavía no se ha registrado ningún elemento.',
        titleFiltered: 'No se encontraron resultados',
        descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
        cta: 'Agregar elemento',
      },
      noFarmSelected: {
        title: 'Seleccione una finca',
        description: 'Seleccione una finca activa para ver el Inventario.',
      },
      deleteConfirm: {
        title: 'Eliminar elemento del Inventario',
        description:
          '¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
      },
      toasts: {
        deleteSuccess: 'Elemento eliminado con éxito.',
      },
    },

    filter: {
      title: 'Filtrar Inventario',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descripción',
      family: 'Familia de Bienes',
      familyAll: 'Todas',
      proprietary: 'Propietario',
      proprietaryAll: 'Todos',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      apply: 'Filtrar',
      clear: 'Limpiar filtros',
    },

    form: {
      title: {
        create: 'Nuevo Elemento de Inventario',
        edit: 'Editar Elemento de Inventario',
      },
      subtitle: {
        create: 'Registre un nuevo bien/activo en la finca.',
        edit: 'Edite los datos del bien/activo seleccionado.',
      },
      tabs: {
        identification: 'Identificación',
        financialDepreciation: 'Financiero/Depreciación',
        fiscalVehicle: 'Fiscal/Vehículo',
        costCenterApportionment: 'Prorrateo',
        attachments: 'Anexos',
      },
      // Aditivo (corrección E2E del dev, ejecución 026) — botones Volver/Siguiente.
      footer: {
        back: 'Volver',
        next: 'Siguiente',
      },
      fields: {
        family: 'Familia de Bienes',
        description: 'Descripción',
        specification: 'Especificación',
        model: 'Modelo',
        patrimony: 'Patrimonio',
        product: 'Producto',
        status: 'Estado',
        statusActive: 'Activo',
        statusInactive: 'Inactivo',
        image: 'Imagen',
        code: 'Código',
        features: 'Recursos',
        featureFuelSupply: 'Abastecimiento',
        featureMaintenance: 'Mantenimiento',
        featureBatch: 'Lote',
        featureAppropriation: 'Apunte',
        equipmentType: 'Tipo de Equipo',
        equipmentTypeOwn: 'Propio',
        equipmentTypeOutsourced: 'Tercerizado',

        vlTimeProductive: 'Valor Hora/Km Productivo',
        provider: 'Proveedor',
        dtAcquisition: 'Fecha de Adquisición',
        vlAcquisition: 'Valor de Adquisición',
        hourMeter: 'Horómetro/Km',
        yearMod: 'Año/Modelo',
        hasDepreciation: 'Tiene Depreciación',
        hasDepreciationYes: 'Sí',
        hasDepreciationNo: 'No',
        lifeBens: 'Vida Útil (años)',
        depreciationType: 'Tipo de Depreciación',
        depreciationTypeWithResidual: 'Con Valor Residual',
        depreciationTypeWithoutResidual: 'Sin Valor Residual',
        residual: 'Residual (%)',
        vlResidual: 'Valor Residual',
        vlDepreciate: 'Valor a Depreciar',
        depreciation: 'Depreciación (%)',

        useFiscal: 'Usa Datos Fiscales',
        useFiscalYes: 'Sí',
        useFiscalNo: 'No',
        chassi: 'Chasis',
        renavam: 'Renavam',
        serie: 'Serie',
        plate: 'Placa',
        color: 'Color',
        uf: 'Provincia',
        brand: 'Marca',
        rntrc: 'RNTRC',
        type: 'Tipo de Vehículo',
        bodyType: 'Tipo de Carrocería',
        wheelType: 'Tipo de Rodado',
        tara: 'Tara',
        capacity: 'Capacidad',
        ownerType: 'Tipo de Propietario',
        ownerTypePhysical: 'Persona Física',
        ownerTypeLegal: 'Persona Jurídica',
        ownerDocument: 'CPF/CNPJ del Propietario',
        ownerName: 'Nombre del Propietario',
        ownerIe: 'IE del Propietario',
        ownerUf: 'Provincia del Propietario',
        ownerTp: 'Tipo (TAC)',

        costCenter: 'Centro de Costo',
        percentage: 'Porcentaje (%)',

        attachmentName: 'Descripción del Anexo',
        attachmentFile: 'Archivo',
      },
      placeholders: {
        family: 'Seleccione la Familia de Bienes',
        product: 'Busque un producto',
        provider: 'Busque un proveedor',
        uf: 'Seleccione la provincia',
        ownerUf: 'Seleccione la provincia',
        costCenter: 'Busque un centro de costo',
      },
      // Aditivo (TASK-FE-1007) — códigos fijos del legado (agro365
      // `app/Equipment.php::opTypes/opBodyTypes/opWheelTypes/opOwnerTypes`,
      // rótulos 1:1 de `lang/es/trad.php`).
      fiscalCatalogs: {
        type: {
          '02': 'Ciclomoto',
          '03': 'Motoneta',
          '04': 'Motocicleta',
          '05': 'Triciclo',
          '06': 'Automóvil',
          '07': 'Minibús',
          '08': 'Autobús',
          '10': 'Remolque',
          '11': 'Semirremolque',
          '13': 'Camioneta',
          '14': 'Camión',
          '17': 'Camión Tractor',
          '18': 'Tractor Ruedas',
          '19': 'Tractor Esteras',
          '20': 'Tractor Mixto',
          '21': 'Cuadriciclo',
          '22': 'ESP / Autobús',
          '23': 'Furgoneta',
          '24': 'Carga/Cam',
          '25': 'Utilitario',
        },
        bodyType: {
          '00': 'No Se Aplica',
          '01': 'Abierto',
          '02': 'Cerrado/De Caja',
          '03': 'Granelero',
          '04': 'Portacontenedor',
        },
        wheelType: {
          '01': 'Truck',
          '02': 'Semi-Pesado',
          '03': 'Tractocamiones',
          '04': 'Van',
          '05': 'Utilitario',
          '06': 'Otro',
        },
        ownerTp: {
          0: 'TAC Adjunto',
          1: 'TAC Independiente',
          2: 'Otro',
        },
      },
      // Corrección (TASK-FE-1005) — bloque ausente en la entrega original de
      // TASK-FE-1002, mirror exacto de familyEquipments.form.image.
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar imagen',
        removeLabel: 'Eliminar imagen',
        errorType: 'Formato no aceptado. Suba un archivo JPEG, PNG, JPG, GIF o SVG.',
        errorSize: 'El archivo excede el tamaño máximo de 2 MB.',
      },
      hints: {
        codeGeneratedByServer: 'Generado automáticamente al guardar',
        equipmentTypeLockedByFamily:
          'Disponible solo para Máquinas, Implementos, Equipos Agrícolas o Vehículos',
        frozenByDepreciation: 'Bloqueado — ya existe depreciación registrada para este elemento',
        fiscalBlockDisabled: 'Habilite "Usa Datos Fiscales" para editar este bloque',
      },
      sections: {
        costCenterApportionmentSum: 'La suma de los porcentajes debe ser 100%',
      },
      costCenterRow: {
        addButton: '+ Agregar Centro de Costo',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún centro de costo agregado',
      },
      attachmentRow: {
        addButton: '+ Agregar elemento',
        removeButton: 'Eliminar',
        emptyLabel: 'Ningún anexo agregado',
        defaultName: 'No Informado',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDragging: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        clearFileLabel: 'Limpiar selección',
        replaceLabel: 'Sustituir archivo',
        existingFileLabel: 'Anexo actual',
        errorType: 'Formato no aceptado.',
        errorSize: 'El archivo supera el tamaño máximo de 10 MB.',
      },
      validation: {
        familyRequired: 'La Familia de Bienes es obligatoria',
        descriptionRequired: 'La Descripción es obligatoria',
        descriptionMaxLength: 'La Descripción debe tener como máximo 60 caracteres',
        specificationMaxLength: 'La Especificación debe tener como máximo 200 caracteres',
        modelMaxLength: 'El Modelo debe tener como máximo 30 caracteres',
        patrimonyMaxLength: 'El Patrimonio debe tener como máximo 40 caracteres',
        statusRequired: 'El Estado es obligatorio',
        vlTimeProductiveRequired: 'El Valor Hora/Km Productivo es obligatorio',
        vlAcquisitionRequired: 'El Valor de Adquisición es obligatorio',
        hasDepreciationRequired: 'Tiene Depreciación es obligatorio',
        yearModRequired: 'Año/Modelo es obligatorio',
        depreciationTypeRequired: 'El Tipo de Depreciación es obligatorio',
        residualRequiredWithResidualType:
          'Residual (%) es obligatorio cuando el tipo es "Con Valor Residual"',
        lifeBensRequiredWithDepreciation:
          'La Vida Útil (años) es obligatoria cuando Tiene Depreciación',
        dtAcquisitionRequiredWithDepreciation:
          'La Fecha de Adquisición es obligatoria cuando Tiene Depreciación',
        chassiMaxLength: 'El Chasis debe tener como máximo 17 caracteres',
        renavamMaxLength: 'El Renavam debe tener como máximo 11 caracteres',
        serieMaxLength: 'La Serie debe tener como máximo 40 caracteres',
        plateMaxLength: 'La Placa debe tener como máximo 10 caracteres',
        plateRequiredWithFiscal: 'La Placa es obligatoria cuando "Usa Datos Fiscales" está activo',
        typeRequiredWithFiscal:
          'El Tipo de Vehículo es obligatorio cuando "Usa Datos Fiscales" está activo',
        bodyTypeRequiredWithFiscal:
          'El Tipo de Carrocería es obligatorio cuando "Usa Datos Fiscales" está activo',
        wheelTypeRequiredWithFiscal:
          'El Tipo de Rodado es obligatorio cuando "Usa Datos Fiscales" está activo',
        taraRequiredWithFiscal: 'La Tara es obligatoria cuando "Usa Datos Fiscales" está activo',
        capacityRequiredWithFiscal:
          'La Capacidad es obligatoria cuando "Usa Datos Fiscales" está activo',
        ownerTypeRequiredWithFiscal:
          'El Tipo de Propietario es obligatorio cuando "Usa Datos Fiscales" está activo',
        ownerDocumentRequiredWithFiscal:
          'El CPF/CNPJ del Propietario es obligatorio cuando "Usa Datos Fiscales" está activo',
        ownerNameRequiredWithFiscal:
          'El Nombre del Propietario es obligatorio cuando "Usa Datos Fiscales" está activo',
        ownerIeRequiredWithFiscal:
          'La IE del Propietario es obligatoria cuando "Usa Datos Fiscales" está activo',
        ownerUfRequiredWithFiscal:
          'La Provincia del Propietario es obligatoria cuando "Usa Datos Fiscales" está activo',
        ownerTpRequiredWithFiscal:
          'El Tipo (TAC) es obligatorio cuando "Usa Datos Fiscales" está activo',
        colorMaxLength: 'El Color debe tener como máximo 10 caracteres',
        rntrcMaxLength: 'El RNTRC debe tener como máximo 12 caracteres',
        ownerNameMaxLength: 'El Nombre del Propietario debe tener como máximo 100 caracteres',
        ownerIeMaxLength: 'La IE del Propietario debe tener como máximo 12 caracteres',
        costCenterPercentageRequired:
          'El Porcentaje es obligatorio para cada Centro de Costo agregado',
        costCenterPercentageSum100:
          'La suma de los porcentajes de prorrateo debe ser exactamente 100%',
        attachmentNameMaxLength: 'La Descripción del Anexo debe tener como máximo 100 caracteres',
      },
      toasts: {
        createSuccess: 'Elemento de Inventario creado con éxito.',
        updateSuccess: 'Elemento de Inventario actualizado con éxito.',
      },
      errors: {
        frozenByDepreciationRejected:
          'No es posible modificar campos financieros — ya existe depreciación registrada para este elemento.',
      },
    },

    // Detalle (TASK-FE-1010) — aditivo.
    detail: {
      notFound: {
        title: 'Registro no encontrado',
        description: 'El elemento de Inventario solicitado no existe o ha sido removido.',
        back: 'Volver',
      },
      actions: {
        edit: 'Editar',
      },
      sections: {
        identification: 'Identificación',
        financialDepreciation: 'Financiero/Depreciación',
        depreciationData: 'Datos de Depreciación',
        fiscalVehicle: 'Fiscal/Vehículo',
        costCenterApportionment: 'Centros de Costo Vinculados',
        attachments: 'Anexos',
      },
      noData: '—',
      attachments: {
        download: 'Descargar archivo',
        unavailable: 'Archivo no disponible',
      },
      apportionment: {
        total: 'Total:',
      },
    },

    // Import/exportación de planilla (TASK-FE-1012) — aditivo.
    excel: {
      downloadTemplate: 'Descargar modelo',
      export: 'Exportar',
      downloadTemplateError: 'No fue posible descargar el modelo. Intente nuevamente.',
      exportError: 'No fue posible exportar los datos. Intente nuevamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Inventario',
        subtitle:
          'Descargue el modelo, complete y envíe la planilla para registrar elementos en lote.',
        instructions:
          'La columna Descripción y la columna Familia de Bienes (buscada por la descripción) son obligatorias en cada línea. Seleccione la Familia, el indicador de Depreciación, el Tipo de Depreciación y el Propietario a partir de los dropdowns validados (pestañas auxiliares de la planilla).',
        warning: {
          title: 'La importación solo crea elementos nuevos',
          description:
            'Cada línea de la planilla genera un nuevo elemento de Inventario — la importación no localiza ni actualiza elementos ya registrados, aunque la descripción sea igual.',
        },
        downloadShortcut: 'Descargar modelo',
        fileUpload: {
          label: 'Planilla completada',
          hint: 'Envíe el archivo .xlsx completado a partir del modelo descargado.',
          dropzoneTitle: 'Arrastre la planilla o haga clic para seleccionar',
          dropzoneDraggingTitle: 'Suelte la planilla aquí',
          changeLabel: 'Cambiar archivo',
          removeLabel: 'Eliminar archivo',
          errorTypeMessage: 'Formato no aceptado. Envíe un archivo .xlsx.',
          errorSizeMessage: 'El archivo supera el tamaño máximo de 10MB.',
        },
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        importSuccessToast: 'Importación del Inventario concluida con éxito.',
        result: {
          created: 'Creados',
        },
        rowErrors: {
          title: 'Algunas líneas no pudieron ser importadas — corríjalas y envíe nuevamente',
        },
        closeButton: 'Cerrar',
      },
    },
  },
};
