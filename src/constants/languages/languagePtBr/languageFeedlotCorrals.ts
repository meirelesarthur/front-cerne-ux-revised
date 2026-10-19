// src/constants/languages/languagePtBr/languageFeedlotCorrals.ts
// Tradução PT-BR do módulo OPERACIONAL — tela standalone de Currais
// (FeedlotCorral, F-035, lote 043, TASK-043-CUR-T01 — fundação). Mirror
// estrutural `languageFeedlotSectors`. Reusa `feedlotMap.feedlotMap.corral/
// .status/.batches` para os 13 campos do CRUD cru + situação + lotes — este
// namespace só cobre listagem/filtro/wizard (casca+setor) + rótulo por valor
// dos 5 enums.

import { ModuleFeedlotCorrals } from '@/@types/language/module-feedlot-corrals';

export const languageFeedlotCorrals: ModuleFeedlotCorrals = {
  feedlotCorral: {
    singularLabel: 'Curral',
    pluralLabel: 'Currais',
    list: {
      pageTitle: 'Currais',
      pageSubtitle: 'Cadastro dos currais de confinamento.',
      deletedToast: 'Curral removido com sucesso',
      table: {
        identification: 'Identificação',
        name: 'Nome',
        feedlotSector: 'Setor',
        installationType: 'Instalação',
        areaTotal: 'Área Total',
        floor: 'Piso',
        shading: 'Sombreamento',
        trough: 'Cocho',
        drinkingFountain: 'Bebedouro',
        status: 'Situação',
        capacity: 'Capacidade',
        animalsCount: 'Animais',
        createdAt: 'Criado em',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        changeStatus: 'Alterar Situação',
        history: 'Histórico',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum curral cadastrado.',
        descriptionEmpty: 'Comece adicionando seu primeiro curral.',
        titleEmptyNoCreate: 'Nenhum curral cadastrado.',
        descriptionEmptyNoCreate: 'Você não tem permissão para cadastrar um novo curral.',
        titleFiltered: 'Nenhum curral encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Curral',
      },
      changeStatusDetachConfirm: {
        title: 'Remover lotes do curral',
        description:
          'Este curral está ocupado com {count} animal(is) vinculado(s) a lote(s). Ao alterar a situação, os lotes serão desvinculados e as datas/dieta serão apagadas. Deseja continuar?',
      },
    },
    filter: {
      title: 'Filtrar currais',
      name: 'Nome',
      namePlaceholder: 'Buscar por nome',
      feedlotSector: 'Setor',
      feedlotSectorPlaceholder: 'Buscar por setor',
      status: 'Situação',
      statusAll: 'Todas',
    },
    detail: {
      generalData: { title: 'Dados Gerais' },
      fields: {
        identification: 'Identificação',
        name: 'Nome',
        feedlotSector: 'Setor',
        installationType: 'Instalação',
        status: 'Situação',
        width: 'Largura',
        length: 'Comprimento',
        areaTotal: 'Área Total',
        capacity: 'Capacidade',
        coverage: 'Cobertura',
        floor: 'Piso',
        shading: 'Sombreamento',
        trough: 'Cocho',
        drinkingFountain: 'Bebedouro',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      actions: { edit: 'Editar' },
      notFound: {
        title: 'Curral não encontrado.',
        description: 'O curral que você está procurando não existe ou foi removido.',
        back: 'Voltar para a listagem',
      },
    },
    history: {
      table: {
        corral: 'Curral',
        beforeStatus: 'Situação Anterior',
        afterStatus: 'Situação Nova',
        note: 'Observação',
        createdAt: 'Data/Hora',
        user: 'Usuário',
      },
      emptyState: {
        title: 'Nenhum histórico registrado.',
        description: 'Ainda não há mudanças de situação registradas para este curral.',
      },
      error: {
        message: 'Não foi possível carregar o histórico deste curral.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: { create: 'Novo Curral', edit: 'Editar Curral' },
      fields: { feedlotSector: 'Setor' },
      placeholders: { feedlotSector: 'Selecione o setor' },
      hints: { identificationGenerated: 'Gerado automaticamente' },
      validation: { feedlotSectorRequired: 'O setor é obrigatório.' },
    },
    wizard: {
      step1: 'Identificação e Situação',
      step2: 'Dimensões e Estrutura',
      step3: 'Lotes',
      stepErrors: 'Preencha os campos obrigatórios desta etapa antes de continuar.',
      submit: {
        situationPermissionDenied:
          'Você não tem permissão para atualizar a situação deste curral (requer acesso ao Mapa de Confinamento ou aos Currais).',
        partialSaveTitle: 'Curral salvo parcialmente',
        partialSaveBatchesDescription:
          'O curral foi salvo, mas os lotes não foram vinculados. Abra o cadastro novamente para tentar de novo.',
        partialSaveSituationDescription:
          'O curral foi salvo, mas a situação não foi atualizada. Abra o cadastro novamente para tentar de novo.',
      },
      lots: {
        heading: 'Lotes do Curral',
        description: 'Vincule os lotes que ocuparão este curral.',
        blockedHeading: 'Lotes bloqueados',
        blockedDescription:
          'A situação atual do curral não permite incluir ou alterar lotes nesta etapa.',
        statusBlockedTooltip: 'Indisponível para a situação atual do curral.',
        addBlockedTitle: 'Selecione um lote',
        addBlockedDescription: 'Selecione o lote da linha atual antes de adicionar outra.',
        removeConfirmTitle: 'Remover lote',
        removeConfirmDescription: 'Tem certeza que deseja remover esta linha de lote',
        summaryCount: 'Lotes selecionados: {count}',
        summaryTotalAnimals: 'Animais vinculados: {total}',
        batchModal: {
          titleCreate: 'Novo Lote',
          titleEdit: 'Editar Lote',
          fields: {
            date: 'Data',
            parameterWeight: 'Peso',
            specie: 'Espécie',
            categories: 'Categorias',
            description: 'Descrição',
          },
          cancelButton: 'Cancelar',
          submitButton: 'Salvar',
          createdToast: 'Lote criado com sucesso',
          updatedToast: 'Lote atualizado com sucesso',
        },
      },
    },
    enums: {
      installationType: { cover: 'Coberto', uncovered: 'Descoberto' },
      status: {
        available: 'Vazio',
        reserved: 'Vazio Sanitário',
        occupied: 'Ocupado',
        maintenance: 'Manutenção',
        cleaning: 'Limpeza',
        sanitaryHold: 'Enfermaria',
        closed: 'Interditado',
      },
      coverage: {
        open: 'Aberto',
        partiallyCovered: 'Cobertura Parcial',
        fullyCovered: 'Cobertura Total',
        metalShed: 'Galpão Metálico',
        insulatedShed: 'Galpão com Isolamento',
        thermoacousticRoof: 'Telha Termoacústica',
        fiberCementRoof: 'Fibrocimento',
        clayTileRoof: 'Cerâmica',
        tensionedFabricRoof: 'Lona Tensionada',
        shadeNet: 'Sombrite',
      },
      floor: {
        compactedDirt: 'Terra Batida',
        concreteFloor: 'Concreto',
        groovedConcrete: 'Concreto Ranhurado',
        gravelFloor: 'Cascalho/Brita',
        stoneFloor: 'Pedra',
        sandFloor: 'Areia',
        rubberFlooring: 'Borracha',
        deepBedding: 'Cama Seca',
        slattedFloor: 'Piso Ripado',
      },
      shading: { natural: 'Natural', artificial: 'Artificial', none: 'Não Possui' },
    },
  },
};
