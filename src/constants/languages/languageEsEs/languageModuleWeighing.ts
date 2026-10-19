// src/constants/languages/languageEsEs/languageModuleWeighing.ts
// Tradução ES-ES do módulo PESAGEM RODOVIÁRIA (ModuleWeighing — Operacional,
// execução 044, F-045, TASK-MWG-FE-01). Mirror EXATO da estrutura de
// `languagePtBr/languageModuleWeighing.ts` — ver aquele arquivo para o
// racional completo.

import { ModuleModuleWeighing } from '@/@types/language/module-module-weighing';

export const languageModuleWeighing: ModuleModuleWeighing = {
  moduleWeighing: {
    singularLabel: 'Pesaje Vial',
    pluralLabel: 'Pesajes Viales',
    titleModule: 'Pesaje Vial',
    common: {
      table: {
        actions: 'Acciones',
      },
      toast: {
        deleteSuccess: 'Pesaje vial eliminado con éxito.',
      },
      deleteDialog: {
        title: 'Confirmar eliminación',
        descriptionTemplate:
          'El pesaje vial {code} será eliminado permanentemente. Esta acción no se puede deshacer.',
      },
      buttons: {
        new: 'Nuevo Pesaje',
        save: 'Guardar',
        cancel: 'Cancelar',
      },
      status: {
        preCadastro: 'Prerregistro',
        pesagemInicial: 'Pesaje Inicial',
        classificacao: 'Clasificación',
        pesagemFinal: 'Pesaje Final',
        finalizado: 'Finalizado',
      },
      type: {
        vendaSaida: 'Venta/Salida',
        compraEntrada: 'Compra/Entrada',
        avulsa: 'Suelta',
        entradaColheita: 'Entrada de Cosecha',
        entradaTerceiros: 'Entrada de Terceros',
      },
      category: {
        externa: 'Externa',
        interna: 'Interna',
      },
    },
    list: {
      pageTitle: 'Pesaje Vial',
      pageSubtitle: 'Gestione los pesajes viales de la finca.',
      reportButton: 'Informe',
      table: {
        status: 'Estado',
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        warehouse: 'Almacén',
        product: 'Producto',
        type: 'Tipo',
        category: 'Categoría',
      },
      actions: {
        edit: 'Editar',
        nextStep: 'Siguiente Etapa',
        finalize: 'Finalizar',
        issueNfe: 'Emitir Factura',
        issueTransfer: 'Emitir Remito',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún pesaje vial registrado.',
        descriptionEmpty: 'Comience agregando el primer pesaje.',
        titleFiltered: 'Ningún registro encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros.',
      },
      filter: {
        title: 'Filtrar pesajes',
        responsible: 'Responsable',
        equipment: 'Equipo',
        warehouse: 'Almacén',
        product: 'Producto',
        provider: 'Proveedor',
      },
      deleteDialog: {
        title: 'Confirmar eliminación',
        descriptionTemplate:
          'El pesaje {code} será eliminado permanentemente. Esta acción no se puede deshacer.',
      },
      error: {
        message: 'No se pudieron cargar los datos.',
        retry: 'Intentar de nuevo',
      },
      legend: {
        label: 'Leyenda',
      },
    },
    create: {
      title: {
        create: 'Nuevo Pesaje Vial',
        edit: 'Editar Pesaje Vial',
      },
      fields: {
        code: 'Código',
        date: 'Fecha',
        product: 'Producto',
        measurement: 'Medida',
        area: 'Área',
        warehouse: 'Almacén',
        equipment: 'Equipo/Vehículo',
        provider: 'Conductor',
        providerBuy: 'Proveedor',
        client: 'Cliente',
        farmTo: 'Finca de destino',
        employee: 'Responsable',
        hasClassification: '¿Clasificar por calidad?',
        discountTable: 'Tabla de descuento',
        providerLot: 'Lote del proveedor',
        expirationDate: 'Vencimiento',
        note: 'Observación',
        type: 'Tipo',
        category: 'Categoría',
      },
      hints: {
        codeGeneratedOnSave: 'Generado automáticamente',
      },
      validation: {
        requiredField: 'Campo obligatorio.',
        clientRequired:
          'El cliente es obligatorio para Venta/Salida o Entrada de Terceros externa.',
        providerBuyRequired: 'El proveedor es obligatorio para Compra/Entrada externa.',
        farmToRequired: 'La finca de destino es obligatoria para pesaje interno.',
        expirationDateRequired: 'El vencimiento es obligatorio para productos con control de lote.',
      },
      toasts: {
        createdSuccess: 'Pesaje vial creado con éxito.',
        updatedSuccess: 'Pesaje vial actualizado con éxito.',
      },
      duplicateLotWarning: 'Este lote ya fue usado en otro pesaje reciente.',
    },
    wizard: {
      stepCounter: {
        label: 'Etapa',
        of: 'de',
      },
      footer: {
        back: 'Atrás',
        next: 'Siguiente',
      },
      fields: {
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        netWeightPreview: 'Peso Neto (previsto)',
        warehouse: 'Almacén',
      },
      stepTitles: {
        tare: 'Tara del Vehículo',
        gross: 'Peso Total',
      },
      validation: {
        requiredField: 'Campo obligatorio.',
        weightRange: 'Ingrese un peso válido (mayor que cero).',
        netWeightNegative: 'El peso neto no puede ser negativo.',
      },
      toasts: {
        advancedSuccess: 'Etapa registrada con éxito.',
      },
    },
    classification: {
      discountTable: 'Tabla de descuento',
      keys: {
        impureza: 'Impureza',
        umidade: 'Humedad',
        quebrado: 'Quebrado',
        esverdeado: 'Verdoso',
        avariado: 'Dañado',
        taxaRecepcao: 'Tasa de Recepción',
      },
      percentLabel: '%',
      appliedLabel: 'Aplicar',
      appliedManualLabel: 'Descuento aplicado (%)',
      discountPreviewTitle: 'Vista previa del descuento',
      discountPreviewTotal: 'Descuento total (previsto)',
      validation: {
        percentRange: 'El porcentaje debe estar entre 0 y 100.',
      },
    },
    finish: {
      title: 'Finalizar Pesaje Vial',
      summary: {
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        discount: 'Descuento de Clasificación',
        netWeight: 'Peso Neto',
      },
      dfeList: {
        title: 'DFe elegibles para vincular',
        emptyUnavailable: 'Lista de DFe no disponible en este momento.',
        number: 'Número',
        issuer: 'Emisor',
        issueDate: 'Fecha de emisión',
        select: 'Seleccionar',
      },
      confirmButton: 'Confirmar Finalización',
      toasts: {
        finalizedSuccess: 'Pesaje vial finalizado con éxito.',
      },
    },
    report: {
      pageTitle: 'Informe de Pesaje Vial',
      pageSubtitle: 'Genere el informe de los pesajes viales de la finca.',
      filters: {
        startDate: 'Fecha inicial',
        endDate: 'Fecha final',
        type: 'Tipo',
        category: 'Categoría',
        warehouse: 'Almacén',
        product: 'Producto',
        client: 'Cliente',
      },
      exportPdfButton: 'Descargar PDF',
      exportXlsxButton: 'Descargar Excel',
      toasts: {
        success: 'Informe generado con éxito.',
        generateError: 'No se pudo generar el informe.',
      },
      validation: {
        startDateRequired: 'La fecha inicial es obligatoria.',
        endDateRequired: 'La fecha final es obligatoria.',
        endDateBeforeStart: 'La fecha final debe ser igual o posterior a la fecha inicial.',
      },
      columns: {
        grossOrNetLabel: 'Peso Bruto',
      },
    },
    detail: {
      printButton: 'Imprimir',
      fields: {
        code: 'Código',
        date: 'Fecha',
        product: 'Producto',
        grossWeight: 'Peso Bruto',
        tareWeight: 'Tara',
        netWeight: 'Peso Neto',
        measurement: 'Medida',
        discount: 'Descuento de Clasificación',
        averageCost: 'Costo Promedio',
        total: 'Total',
      },
      history: {
        title: 'Historial',
        datetime: 'Fecha/Hora',
        status: 'Estado',
        inputType: 'Origen',
        inputTypeAuto: 'Automático',
        inputTypeManual: 'Manual',
      },
      notFound: {
        title: 'Pesaje no encontrado',
        description: 'El pesaje solicitado no existe o usted no tiene permiso para verlo.',
        backAction: 'Volver',
      },
    },
    dialogs: {
      warehouse: {},
      product: {},
      equipment: {},
      provider: {},
      client: {},
    },
    scaleConnection: {
      connecting: 'Conectando a la balanza...',
      connected: 'Balanza conectada',
      disconnected: 'Balanza desconectada',
      payloadError: 'No se pudo leer el peso de la balanza. Escríbalo manualmente.',
      captureButton: 'Capturar peso',
    },
    scaleTutorial: {
      title: 'Cómo conectar la balanza',
      helpButton: 'Ayuda con la balanza',
      instructions:
        'Descargue e instale el conector de la balanza en la computadora conectada a la ' +
        'balanza física. Con el conector en ejecución, haga clic en "Capturar peso" en esta ' +
        'pantalla para leer el valor automáticamente. Si la balanza no conecta, aún puede ' +
        'escribir el peso manualmente.',
      statusLabel: 'Estado de la conexión',
      downloadButton: 'Descargar conector',
    },
  },
};
