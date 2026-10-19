// src/constants/languages/languagePtBr/languageFinancialBudgetPlanning.ts
// Tradução PT-BR da feature "Prev. Orçamentária" (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-02). Composto dentro de
// `languageFinancial.ts` (chave `financial.budgetPlanning`, mirror
// `expense`/`mercadoPago`/`ofxImport`/`financialFreeze`) — ver
// `@/@types/language/module-financial/budget-planning.d.ts` para o tipo.

import type { BudgetPlanningLanguage } from '@/@types/language/module-financial/budget-planning';

export const languageFinancialBudgetPlanning: BudgetPlanningLanguage = {
  singularLabel: 'Previsão Orçamentária',
  pluralLabel: 'Previsões Orçamentárias',
  titleModule: 'Prev. Orçamentária',
  createTitle: 'Nova Previsão Orçamentária',
  editTitle: 'Editar Previsão Orçamentária',
  viewTitle: 'Visualizar Previsão Orçamentária',

  list: {
    table: {
      code: 'Código',
      date: 'Data',
      year: 'Ano',
      responsavel: 'Responsável',
      actions: 'Ações',
    },
    emptyState: {
      title: 'Nenhuma previsão orçamentária encontrada.',
    },
    error: {
      message: 'Não foi possível carregar as previsões orçamentárias.',
      retry: 'Tentar novamente',
    },
    filter: {
      yearLabel: 'Ano',
      filterButton: 'Filtrar',
      clearButton: 'Limpar',
    },
  },

  form: {
    fields: {
      dateLabel: 'Data',
      yearLabel: 'Ano',
      codePlaceholder: 'Gerado automaticamente',
      authorLabel: 'Responsável',
    },
    grid: {
      categoryColumn: 'Categoria',
      lastYearValueColumn: 'Valor Ano Anterior',
      totalYearColumn: 'Total Ano',
      totalMonthRow: 'Total',
      totalGeneral: 'Total Geral',
      emptyEligible: 'Nenhuma categoria elegível encontrada para a grade.',
      error: {
        message: 'Não foi possível carregar as categorias elegíveis para a grade.',
        retry: 'Tentar novamente',
      },
    },
    validation: {
      dateRequired: 'A data é obrigatória.',
      yearRequired: 'O ano é obrigatório.',
      categoriesRequired: 'Informe ao menos 1 valor na grade.',
    },
  },

  import: {
    menuLabel: 'Importar',
    title: 'Importar Previsão Orçamentária',
    subtitle: 'Envie uma planilha (.xlsx) com a grade mensal de categorias já preenchida.',
    yearLabel: 'Ano',
    yearRequired: 'O ano é obrigatório.',
    fileRequired: 'Selecione um arquivo .xlsx.',
    downloadShortcut: 'Baixar modelo',
    downloadTemplateError: 'Não foi possível baixar o modelo.',
    fileUpload: {
      label: 'Arquivo (.xlsx)',
      hint: 'Envie a planilha preenchida (.xlsx, até 10MB).',
      dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
      dropzoneDraggingTitle: 'Solte o arquivo aqui',
      changeLabel: 'Trocar arquivo',
      removeLabel: 'Remover arquivo',
      errorTypeMessage: 'Tipo de arquivo não aceito (use .xlsx).',
      errorSizeMessage: 'Arquivo excede o tamanho máximo (10MB).',
    },
    rowErrors: {
      title: 'Corrija as linhas abaixo e tente novamente:',
    },
    cancelButton: 'Cancelar',
    submitButton: 'Importar',
    success: 'Previsão orçamentária importada com sucesso.',
  },

  predictedReport: {
    title: 'Previsto × Realizado Anual',
    subtitle:
      'Gere o relatório comparando os valores previstos e os realizados no ano selecionado.',
    menuLabel: 'Relatório Previsto × Realizado',
    yearLabel: 'Ano',
    yearRequired: 'O ano é obrigatório.',
    typeLabel: 'Formato',
    typeRequired: 'O formato é obrigatório.',
    typePdf: 'PDF',
    typeXlsx: 'Excel',
    farmLabel: 'Fazenda',
    submitButton: 'Gerar relatório',
    success: 'Relatório gerado com sucesso.',
    genericError: 'Não foi possível gerar o relatório.',
  },

  actions: {
    view: 'Visualizar',
    edit: 'Editar',
    delete: 'Excluir',
    export: 'Exportar',
  },

  toasts: {
    createSuccess: 'Previsão orçamentária criada com sucesso.',
    updateSuccess: 'Previsão orçamentária atualizada com sucesso.',
    deleteSuccess: 'Previsão orçamentária excluída com sucesso.',
  },
};
