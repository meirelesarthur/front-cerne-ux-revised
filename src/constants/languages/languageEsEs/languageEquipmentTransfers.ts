// src/constants/languages/languageEsEs/languageEquipmentTransfers.ts
// Traducción ES-ES del módulo TRANSFERENCIA DE MÁQUINAS (Gestión de Flota,
// F-101, 97-Esteiras/005).

import { ModuleEquipmentTransfers } from '@/@types/language/module-equipment-transfers';

export const languageEquipmentTransfers: ModuleEquipmentTransfers = {
  equipmentTransfer: {
    singularLabel: 'Transferencia de Máquina',
    pluralLabel: 'Transferencias de Máquinas',
    list: {
      pageTitle: 'Transferencia de Máquinas',
      pageSubtitle: 'Transferencias de máquinas entre fincas.',
      table: {
        status: 'Estado',
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        farmOrigin: 'Finca Origen',
        farmDestination: 'Finca Destino',
        equipments: 'Máquinas',
      },
      legend: {
        title: 'Leyenda',
        open: 'Abierto',
        finished: 'Finalizado',
        canceled: 'Cancelado',
      },
      actions: {
        view: 'Ver',
        receive: 'Recibir',
        cancel: 'Cancelar',
      },
      emptyState: {
        titleEmpty: 'No se encontraron transferencias.',
        descriptionEmpty: 'Cree una nueva transferencia de máquinas para comenzar.',
        titleFiltered: 'Sin resultados para este filtro.',
        descriptionFiltered: 'Ajuste el período e intente nuevamente.',
        titleError: 'No fue posible cargar las transferencias.',
        descriptionError: 'Intente nuevamente en instantes.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
    },
    form: {
      createTitle: 'Nueva Transferencia de Máquinas',
      createSubtitle: 'Seleccione las máquinas y la finca de destino.',
      fields: {
        code: 'Código',
        responsible: 'Responsable',
        date: 'Fecha',
        farmOrigin: 'Finca Origen',
        farmDestination: 'Finca Destino',
      },
      equipments: {
        sectionTitle: 'Máquinas',
        equipment: 'Máquina',
        addItem: 'Agregar máquina',
        removeItem: 'Eliminar máquina',
        minOneRequired: 'Seleccione al menos una máquina.',
      },
      attachments: {
        sectionTitle: 'Anexos',
        name: 'Nombre',
        file: 'Archivo',
        addItem: 'Agregar anexo',
        removeItem: 'Eliminar anexo',
      },
      unsavedChangesDialog: {
        title: '¿Salir sin guardar?',
        description: 'Tiene cambios no guardados. ¿Está seguro que desea salir sin guardar?',
        confirmButton: 'Salir sin guardar',
      },
    },
    receive: {
      pageTitle: 'Recibir Transferencia',
      pageSubtitle: 'Confirme los datos de recepción de las máquinas.',
      fields: {
        receiptDate: 'Fecha de recepción',
        employee: 'Empleado responsable',
        receiptDateRequired: 'Informe la fecha de recepción.',
        employeeRequired: 'Seleccione el empleado responsable.',
      },
      submit: 'Recibir',
      successMessage: 'Transferencia recibida con éxito.',
    },
    show: {
      pageTitle: 'Detalle de la Transferencia',
      receiptBlock: {
        title: 'Recepción',
        receiptDate: 'Fecha de recepción',
        employee: 'Empleado responsable',
      },
      equipments: {
        title: 'Máquinas',
      },
      attachments: {
        title: 'Anexos',
        viewDocument: 'Ver Documento',
        empty: 'Sin anexos.',
      },
    },
    cancel: {
      dialogTitle: 'Cancelar transferencia',
      dialogDescription: '¿Está seguro que desea cancelar la transferencia',
      dialogWarning: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Cancelar transferencia',
      successMessage: 'Transferencia cancelada con éxito.',
    },
  },
};
