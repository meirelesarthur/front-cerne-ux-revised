// src/constants/languages/languagePtBr/languageHarvestProduct.ts
// Tradução PT-BR do módulo "Colheita de Frutas" (HarvestProduct — Operacional
// / Agricultura, F-040, execução 040, TASK-FE-1092..1101).

import { ModuleHarvestProduct } from '@/@types/language/module-harvest-product';

export const languageHarvestProduct: ModuleHarvestProduct = {
  singularLabel: 'Colheita de Frutas',
  pluralLabel: 'Colheita de Frutas',
  titleModule: 'Colheita de Frutas',
  createTitle: 'Nova Colheita',
  editTitle: 'Editar Colheita',
  list: {
    table: {
      code: 'Código',
      date: 'Data',
      client: 'Cliente',
      area: 'Área',
      product: 'Produto',
      boxesCount: 'Caixas',
      boxTooltipLabel: 'Caixa {n} - {amount} Kg',
      totalWeight: 'Peso Total (Kg)',
      actions: 'Ações',
    },
    actions: {
      view: 'Ver',
      edit: 'Editar',
      delete: 'Excluir',
    },
    newButton: 'Nova Colheita',
    emptyState: {
      titleEmpty: 'Nenhuma colheita cadastrada.',
      descriptionEmpty: 'Comece cadastrando uma nova colheita de frutas.',
      titleFiltered: 'Nenhum registro encontrado.',
      descriptionFiltered: 'Tente ajustar os filtros.',
      cta: 'Nova Colheita',
    },
    deleteDialog: {
      title: 'Excluir colheita?',
      warning: 'Esta ação não pode ser desfeita.',
    },
  },
  filter: {
    title: 'Filtrar Colheita de Frutas',
    area: 'Área',
    client: 'Cliente',
    dateStart: 'Data Inicial',
    dateEnd: 'Data Final',
    clearAllFilters: 'Limpar filtros',
    applyFilters: 'Aplicar filtros',
  },
  form: {
    code: 'Código',
    codeHelper: 'Gerado automaticamente ao salvar',
    date: 'Data',
    area: 'Área',
    client: 'Cliente',
    product: 'Produto',
    plate: 'Placa',
    city: 'Cidade',
    driverName: 'Nome do Motorista',
    driverNif: 'CPF/CNPJ do Motorista',
    boxesSectionTitle: 'Caixas',
    boxAmount: 'Peso (Kg)',
    addBoxButton: 'Adicionar Caixa',
    removeBoxButton: 'Remover',
    lookupErrorRetry: 'Não foi possível carregar as opções. Tentar novamente.',
    lookupNoResults: 'Nenhum resultado para o termo buscado.',
    lookupTypeToSearch: 'Digite ao menos 3 caracteres para buscar.',
  },
  validation: {
    dateRequired: 'Informe a data',
    areaRequired: 'Informe a área',
    clientRequired: 'Informe o cliente',
    productRequired: 'Informe o produto',
    boxAmountRequired: 'Informe um peso válido',
    boxesMinOne: 'Adicione ao menos uma caixa antes de salvar.',
  },
  toast: {
    createSuccess: 'Registro criado com sucesso.',
    updateSuccess: 'Registro atualizado com sucesso.',
    deleteSuccess: 'Registro deletado com sucesso.',
    deleteError: 'Não foi possível excluir o registro.',
  },
  detail: {
    title: 'Colheita de Frutas',
    backButton: 'Voltar',
    editButton: 'Editar',
    sections: {
      generalData: 'Dados Gerais',
      boxes: 'Caixas',
    },
    table: {
      amount: 'Peso (Kg)',
    },
    notFound: {
      title: 'Colheita não encontrada.',
      description: 'O registro pode ter sido excluído ou o link está incorreto.',
    },
    invalidParamsToast: {
      title: 'Colheita de Frutas',
      description: 'Parâmetros inválidos para exibir o detalhe.',
    },
  },
};
