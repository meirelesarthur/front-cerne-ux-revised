// src/constants/languages/languagePtBr/languageContracts.ts
// Tradução pt-BR do módulo "Gestão de Contratos" (Contract — Financeiro,
// esteira 97-Esteiras/023, TASK-CTR-FE-02). Ver
// `@/@types/language/module-contracts` para o contrato completo.

import { ModuleContracts } from '@/@types/language/module-contracts';

export const languageContracts: ModuleContracts = {
  contract: {
    singularLabel: 'Contrato',
    pluralLabel: 'Contratos',
    titleModule: 'Contratos',

    list: {
      pageTitle: 'Contratos',
      pageSubtitle: 'Gerencie os contratos da fazenda.',
      table: {
        code: 'Código',
        number: 'Número',
        provider: 'Fornecedor',
        employee: 'Responsável',
        date: 'Data',
        expirationDate: 'Data de Vencimento',
        installments: 'Parcelas',
        quantity: 'Quantidade',
        amount: 'Valor',
        actions: {
          edit: 'Editar',
          delete: 'Excluir',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhum contrato cadastrado',
        titleFiltered: 'Nenhum contrato encontrado',
        descriptionEmpty: 'Cadastre o primeiro Contrato.',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
        cta: 'Novo Contrato',
      },
      deletedToast: 'Contrato excluído com sucesso.',
    },

    filter: {
      title: 'Filtrar Contratos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por número',
      provider: 'Fornecedor',
      employee: 'Responsável',
    },

    form: {
      title: {
        create: 'Novo Contrato',
        edit: 'Editar Contrato',
      },
      subtitle: {
        create: 'Cadastre um novo contrato.',
        edit: 'Atualize os dados do contrato.',
      },
      fields: {
        provider: 'Fornecedor',
        employee: 'Responsável',
        number: 'Número',
        date: 'Data',
        expirationDate: 'Data de Vencimento',
        installments: 'Parcelas',
        quantity: 'Quantidade',
        unitValueSc: 'Valor Unitário (sc)',
        amount: 'Valor',
      },
      placeholders: {
        provider: 'Busque um fornecedor',
        employee: 'Busque um responsável',
        number: 'Número do contrato',
      },
      validation: {
        providerRequired: 'Fornecedor é obrigatório',
        employeeRequired: 'Responsável é obrigatório',
        numberRequired: 'Número é obrigatório',
        numberMaxLength: 'Número deve ter no máximo 50 caracteres',
        dateRequired: 'Data é obrigatória',
        expirationDateRequired: 'Data de Vencimento é obrigatória',
        installmentsRequired: 'Parcelas é obrigatório',
        installmentsMin: 'Parcelas deve ser maior que zero',
        quantityRequired: 'Quantidade é obrigatória',
        quantityMin: 'Quantidade deve ser maior que zero',
        unitValueScRequired: 'Valor Unitário (sc) é obrigatório',
        unitValueScMin: 'Valor Unitário (sc) deve ser maior que zero',
        itemsMinOne: 'Adicione ao menos um item',
        itemWarehouseRequired: 'Armazém é obrigatório',
        itemProductRequired: 'Produto é obrigatório',
        itemQuantityRequired: 'Quantidade é obrigatória',
        itemQuantityMin: 'Quantidade deve ser maior que zero',
      },
      itemsSection: {
        title: 'Insumos',
        addButton: '+ Adicionar Insumo',
        emptyState: 'Nenhum insumo adicionado',
        fields: {
          warehouse: 'Armazém',
          product: 'Produto',
          quantity: 'Quantidade',
        },
        removeButton: 'Remover',
      },
    },
  },
};
