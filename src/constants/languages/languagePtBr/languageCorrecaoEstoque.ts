// src/constants/languages/languagePtBr/languageCorrecaoEstoque.ts
// Tradução PT-BR do módulo de CORREÇÃO DE ESTOQUE (Administrativo — Estoque).
//
// Textos do aviso de importação e do diálogo de exclusão reforçado
// REDIGIDOS DO ZERO para esta feature (TASK-FE-COR-01, Roteiro passo 3/9) —
// NÃO copiam a redação de "exclusão segura"/"substitui todo o plano de
// contas" de `languagePlanAccounts.ts` (comportamento de negócio distinto:
// a importação de Correção de Estoque é sempre ADITIVA, nunca substitui/
// exclui correções existentes; a exclusão reverte saldo e recalcula custo
// médio de TODA a fazenda, impacto financeiro real).

import { ModuleCorrecaoEstoque } from '@/@types/language/module-correcao-estoque';

export const languageCorrecaoEstoque: ModuleCorrecaoEstoque = {
  stockCorrection: {
    singularLabel: 'Correção de Estoque',
    pluralLabel: 'Correções de Estoque',
    list: {
      pageTitle: 'Correção de Estoque',
      pageSubtitle: 'Consulte e importe correções manuais de estoque por planilha.',
      table: {
        code: 'Código',
        date: 'Data',
        user: 'Responsável',
        createdAt: 'Cadastrado em',
        actions: {
          viewDetail: 'Ver Detalhe',
          delete: 'Excluir',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhuma correção de estoque encontrada.',
        descriptionEmpty: 'Ainda não há correções importadas para a fazenda ativa.',
        titleFiltered: 'Nenhuma correção de estoque encontrada.',
        descriptionFiltered: 'Tente ajustar o período ou limpar o filtro.',
      },
      deletedToast: 'Correção de estoque excluída com sucesso',
      deleteDialog: {
        description: 'Tem certeza que deseja excluir a correção de estoque',
        warning:
          'Esta exclusão reverte o efeito desta correção no saldo de estoque e recalcula o custo médio de todos os produtos da fazenda. É uma operação sem volta e pode impactar relatórios financeiros já emitidos.',
      },
    },
    filter: {
      title: 'Filtrar correções de estoque',
      startDate: 'Data de cadastro (de)',
      endDate: 'Data de cadastro (até)',
      dateRangeInvalid: 'A data final não pode ser anterior à data inicial.',
    },
    importModal: {
      menuButtonLabel: 'Importar planilha',
      title: 'Importar Correção de Estoque',
      subtitle: 'Baixe o modelo, preencha e envie a planilha para lançar uma nova correção.',
      downloadShortcut: 'Baixar modelo',
      instructions:
        'A planilha tem 5 colunas: Armazém, Produto, Lote, Qtde. Total e Novo Custo Médio. Lote e Novo Custo Médio são opcionais em cada linha — as demais colunas são obrigatórias.',
      warning: {
        title: 'Recálculo de custo médio da fazenda',
        description:
          'A importação recalcula o custo médio de todo o estoque da fazenda ativa e pode levar alguns segundos em catálogos grandes de produtos. Esta correção é sempre um registro NOVO — não substitui nem exclui nenhuma correção já existente.',
      },
      fileUpload: {
        label: 'Planilha (.xlsx)',
        hint: 'Arquivo .xlsx de até 10MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito. Envie um arquivo .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Linhas com erro',
      },
      result: {
        codeLabel: 'Código gerado',
        rowsProcessedLabel: 'Linhas processadas',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
      importSuccessToast: 'Correção de estoque importada com sucesso',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
    },
    detail: {
      sections: {
        identification: 'Identificação',
        items: 'Itens Corrigidos',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        user: 'Responsável',
        product: 'Produto',
        warehouse: 'Armazém',
        lot: 'Lote',
        quantity: 'Quantidade Corrigida',
        differenceQuantity: 'Diferença',
        averageCost: 'Custo Médio',
        averageCostValue: 'Valor',
      },
      table: {
        product: 'Produto',
        warehouse: 'Armazém',
        lot: 'Lote',
        quantity: 'Quantidade Corrigida',
        differenceQuantity: 'Diferença',
        averageCost: 'Custo Médio',
        averageCostValue: 'Valor',
      },
      itemsEmpty: {
        title: 'Nenhum item encontrado.',
        description: 'Esta correção não possui itens registrados.',
      },
      notFound: {
        title: 'Correção não encontrada.',
        description: 'Não há correção de estoque para o identificador informado.',
        back: 'Voltar à listagem',
      },
      invalidParamsToast: {
        title: 'Parâmetros inválidos',
        description: 'O identificador da correção é inválido para exibir o detalhe.',
      },
      noData: 'Não Possui',
      backButton: 'Voltar',
    },
  },
};
