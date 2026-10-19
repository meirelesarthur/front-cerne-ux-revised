// src/constants/languages/languagePtBr/languageEquipmentTransfers.ts
// Tradução PT-BR do módulo TRANSFERÊNCIA DE MÁQUINAS (Gestão de Frota,
// F-101, 97-Esteiras/005). Título canônico "Transferência de Máquinas"
// (CL-34, menuData.ts:380 do ux_root / navigationTree.ts do fork).

import { ModuleEquipmentTransfers } from '@/@types/language/module-equipment-transfers';

export const languageEquipmentTransfers: ModuleEquipmentTransfers = {
  equipmentTransfer: {
    singularLabel: 'Transferência de Máquina',
    pluralLabel: 'Transferências de Máquinas',
    list: {
      pageTitle: 'Transferência de Máquinas',
      pageSubtitle: 'Transferências de máquinas entre fazendas.',
      table: {
        status: 'Status',
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        farmOrigin: 'Fazenda Origem',
        farmDestination: 'Fazenda Destino',
        equipments: 'Máquinas',
      },
      legend: {
        title: 'Legenda',
        open: 'Em Aberto',
        finished: 'Finalizado',
        canceled: 'Cancelado',
      },
      actions: {
        view: 'Ver',
        receive: 'Receber',
        cancel: 'Cancelar',
      },
      emptyState: {
        titleEmpty: 'Nenhuma transferência encontrada.',
        descriptionEmpty: 'Crie uma nova transferência de máquinas para começar.',
        titleFiltered: 'Nenhum resultado para este filtro.',
        descriptionFiltered: 'Ajuste o período e tente novamente.',
        titleError: 'Não foi possível carregar as transferências.',
        descriptionError: 'Tente novamente em instantes.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      startDate: 'Data inicial',
      endDate: 'Data final',
    },
    form: {
      createTitle: 'Nova Transferência de Máquinas',
      createSubtitle: 'Selecione as máquinas e a fazenda de destino.',
      fields: {
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        farmOrigin: 'Fazenda Origem',
        farmDestination: 'Fazenda Destino',
      },
      equipments: {
        sectionTitle: 'Máquinas',
        equipment: 'Máquina',
        addItem: 'Adicionar máquina',
        removeItem: 'Remover máquina',
        minOneRequired: 'Selecione ao menos uma máquina.',
      },
      attachments: {
        sectionTitle: 'Anexos',
        name: 'Nome',
        file: 'Arquivo',
        addItem: 'Adicionar anexo',
        removeItem: 'Remover anexo',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Você tem alterações não salvas. Deseja realmente sair sem salvar?',
        confirmButton: 'Sair sem salvar',
      },
    },
    receive: {
      pageTitle: 'Receber Transferência',
      pageSubtitle: 'Confirme os dados do recebimento das máquinas.',
      fields: {
        receiptDate: 'Data do recebimento',
        employee: 'Funcionário responsável',
        receiptDateRequired: 'Informe a data do recebimento.',
        employeeRequired: 'Selecione o funcionário responsável.',
      },
      submit: 'Receber',
      successMessage: 'Transferência recebida com sucesso.',
    },
    show: {
      pageTitle: 'Detalhe da Transferência',
      receiptBlock: {
        title: 'Recebimento',
        receiptDate: 'Data do recebimento',
        employee: 'Funcionário responsável',
      },
      equipments: {
        title: 'Máquinas',
      },
      attachments: {
        title: 'Anexos',
        viewDocument: 'Ver Documento',
        empty: 'Nenhum anexo.',
      },
    },
    cancel: {
      dialogTitle: 'Cancelar transferência',
      dialogDescription: 'Tem certeza que deseja cancelar a transferência',
      dialogWarning: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Cancelar transferência',
      successMessage: 'Transferência cancelada com sucesso.',
    },
  },
};
