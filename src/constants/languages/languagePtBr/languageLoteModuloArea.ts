// src/constants/languages/languagePtBr/languageLoteModuloArea.ts
// Tradução PT-BR do módulo "Lote/Módulo/Área" (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070).

import { ModuleLoteModuloArea } from '@/@types/language/module-lote-modulo-area';

export const languageLoteModuloArea: ModuleLoteModuloArea = {
  loteModuloArea: {
    batchModuleAreaTransfer: {
      singularLabel: 'Lote/Módulo/Área',
      pluralLabel: 'Lote/Módulo/Área',
      list: {
        pageTitle: 'Lote/Módulo/Área',
        table: {
          code: 'Código',
          description: 'Descrição',
          animalsCount: 'Qtd. Animais',
          currentLink: 'Vínculo Atual',
          actions: 'Ações',
          noCurrentLink: '—',
        },
        filter: {
          batch: 'Lote',
          batchPlaceholder: 'Selecione',
        },
        actions: {
          filter: 'Filtrar',
          clearFilter: 'Limpar filtro',
          edit: 'Editar/Transferir',
        },
        error: {
          message: 'Não foi possível carregar as transferências de Lote/Módulo/Área.',
          retry: 'Tentar novamente',
        },
        emptyState: {
          titleEmpty: 'Nenhum lote encontrado.',
          descriptionEmpty: 'Ajuste o filtro ou aguarde novos lotes ativos.',
        },
      },
      form: {
        title: 'Transferir Lote',
        fields: {
          code: 'Código',
          date: 'Data',
          user: 'Responsável',
          batch: 'Lote',
          qtd: 'Qtd. Animais',
          area: 'Vínculo Atual',
          areaDestination: 'Área',
          grazingDestination: 'Módulo',
          corralDestination: 'Curral',
        },
        saveButton: 'Salvar',
        cancelButton: 'Cancelar',
        successToast: 'Transferência realizada com sucesso',
        validation: {
          destinationRequired: 'Selecione Área, Módulo ou Curral de destino',
        },
        error: {
          message: 'Não foi possível carregar os dados desta transferência.',
        },
      },
      cascade: {
        dateInvalidForArea: 'Data inválida para a Área selecionada.',
        dateInvalidForGrazing: 'Data inválida para o Módulo selecionado.',
        dateInvalidForCorral: 'Data inválida para o Curral selecionado.',
        dateInvalidGeneric: 'Data inválida para esta transferência.',
      },
    },
  },
};
