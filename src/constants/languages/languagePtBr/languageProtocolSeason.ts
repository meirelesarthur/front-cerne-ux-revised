// src/constants/languages/languagePtBr/languageProtocolSeason.ts
// Tradução PT-BR do módulo "Protocolos/Estação" (ProtocolSeason —
// Operacional / Reprodução, F-057, execução 040, TASK-FE-1050..1059).

import { ModuleProtocolSeason } from '@/@types/language/module-protocol-season';

export const languageProtocolSeason: ModuleProtocolSeason = {
  protocolSeason: {
    singularLabel: 'Protocolo/Estação',
    pluralLabel: 'Protocolos/Estação',
    titleModule: 'Protocolos/Estação',
    list: {
      pageTitle: 'Protocolos/Estação',
      pageSubtitle: 'Gerencie os protocolos de estação cadastrados.',
      deletedToast: 'Protocolo/Estação excluído com sucesso',
      newButton: 'Novo Protocolo',
      table: {
        code: 'Código',
        name: 'Nome',
        date: 'Data',
        responsible: 'Responsável',
        breedingSeason: 'Estação de Monta',
        actions: 'Ações',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum protocolo/estação cadastrado.',
        descriptionEmpty: 'Comece cadastrando um novo protocolo de estação.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
        cta: 'Novo Protocolo',
      },
      filter: {
        title: 'Filtrar Protocolos/Estação',
        name: 'Nome',
        namePlaceholder: 'Filtrar por nome',
        responsible: 'Responsável',
        breedingSeason: 'Estação de Monta',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
      },
      deleteDialog: {
        title: 'Excluir protocolo/estação?',
        description: 'será excluído permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
      deleteBusinessErrorToast: {
        title: 'Não é possível excluir',
        description: 'Existem acasalamentos vinculados a este protocolo.',
      },
    },
    detail: {
      title: 'Protocolo/Estação',
      backButton: 'Voltar',
      editButton: 'Editar',
      sections: {
        generalData: 'Dados Gerais',
        timeline: 'Linha do Tempo',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        breedingSeason: 'Estação de Monta',
        name: 'Nome',
        description: 'Descrição',
      },
      notFound: {
        title: 'Protocolo/Estação não encontrado.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
      invalidParamsToast: {
        title: 'Protocolo/Estação',
        description: 'Parâmetros inválidos para exibir o detalhe.',
      },
    },
    form: {
      title: {
        create: 'Novo Protocolo/Estação',
        edit: 'Editar Protocolo/Estação',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        breedingSeason: 'Estação de Monta',
        name: 'Nome',
        description: 'Descrição',
      },
      validation: {
        dateRequired: 'Informe a data',
        breedingSeasonRequired: 'Informe a estação de monta',
        nameRequired: 'Informe o nome',
        itemDateRequired: 'Informe a data do item',
        itemTimeRequired: 'Informe o horário do item',
        productOrServiceRequired: 'Selecione um produto OU um serviço',
        measurementRequired: 'Informe a unidade de medida',
        quantityRequired: 'Informe uma quantidade válida',
        quantityExceedsStock: 'Quantidade maior que o saldo disponível em estoque',
        itemsMinOne: 'Adicione ao menos um item',
        itemDateBeforeDzero: 'A data não pode ser anterior à primeira aplicação (DZERO)',
      },
      items: {
        sectionTitle: 'Itens do Protocolo',
        fields: {
          identification: 'Identificação',
          date: 'Data',
          time: 'Horário',
          warehouse: 'Armazém',
          product: 'Produto',
          service: 'Serviço',
          measurement: 'Unidade de Medida',
          stock: 'Estoque',
          quantity: 'Quantidade',
        },
        addButton: 'Adicionar item',
        removeButton: 'Remover',
        removeDialog: {
          title: 'Remover item?',
          description: 'Este item será removido do protocolo.',
          confirmButton: 'Remover',
        },
      },
      timelinePreview: {
        title: 'Prévia da Linha do Tempo',
        empty: 'Adicione itens para visualizar a linha do tempo.',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
    },
    timeline: {
      weekdays: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      emptyState: {
        title: 'Sem itens na linha do tempo',
        description: 'Este protocolo ainda não possui itens registrados.',
      },
      andSeparator: ' + ',
    },
    services: {
      insemination: 'Inseminação',
      ultrasound: 'Ultrassom',
      pregnancyDiagnosis: 'Diagnóstico Gestacional',
      implantRemoval: 'Retirada de Implante',
    },
  },
};
