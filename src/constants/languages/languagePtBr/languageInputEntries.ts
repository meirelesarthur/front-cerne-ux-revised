// src/constants/languages/languagePtBr/languageInputEntries.ts
// Tradução PT-BR do módulo "Entrada de Insumos" (InputEntry) — domínio
// próprio, esteira 037 (TASK-IE-FE-03).

import { ModuleInputEntries } from '@/@types/language/module-input-entries';

export const languageInputEntries: ModuleInputEntries = {
  inputEntry: {
    singularLabel: 'Entrada de Insumo',
    pluralLabel: 'Entradas de Insumos',

    list: {
      pageTitle: 'Entrada de Insumos',
      pageSubtitle: 'Gerencie as entradas de insumos e a geração de estoque.',
      deletedToast: 'Entrada de insumo removida com sucesso',
      table: {
        code: 'Código',
        date: 'Data',
        farm: 'Fazenda',
        proprietary: 'Proprietário',
        user: 'Responsável',
        totalAmount: 'Vl. Total',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma entrada de insumo cadastrada.',
        descriptionEmpty: 'Comece adicionando sua primeira entrada de insumo.',
        titleFiltered: 'Nenhuma entrada de insumo encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Entrada de Insumo',
      },
    },

    filter: {
      title: 'Filtrar entradas de insumos',
      proprietary: 'Proprietário',
      startDate: 'Data de',
      endDate: 'Data até',
    },

    form: {
      title: {
        create: 'Nova Entrada de Insumo',
        edit: 'Editar Entrada de Insumo',
      },
      subtitle: {
        create: 'Cadastre uma nova entrada de insumo.',
        edit: 'Atualize os dados da entrada de insumo.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        responsible: 'Responsável',
        farm: 'Fazenda',
        harvest: 'Safra',
        proprietary: 'Proprietário',
        note: 'Observações',

        product: 'Produto',
        measurement: 'Un. Medida',
        quantity: 'Qtd',
        unitValue: 'Vl. Unit',
        totalValue: 'V. Total(R$)',
        generateStock: 'Gera estoque?',
        warehouse: 'Armazém',
        appropriationType: 'Tipo Apropriação',
        providerLot: 'Lt. Fornecedor',
        shelfLife: 'Validade',
        // F-084 item 3 — label real do legado é "Classificação" (campo
        // `cultivation` interno mantido, mirror `Cultivation-contrato.md`).
        cultivation: 'Classificação',
        category: 'Categoria Financeira',
        center: 'Centro de Custo',
        area: 'Área',
        batch: 'Lote (Rebanho)',

        automaticWriteoff: 'Baixa automática',
        account: 'Conta Bancária',
        movementDate: 'Data do Movimento',
        accountBalancePreview: 'Saldo na data',
      },
      placeholders: {
        harvest: 'Busque uma safra',
        proprietary: 'Busque um proprietário',
        product: 'Busque um produto',
        measurement: 'Busque uma unidade de medida',
        warehouse: 'Busque um armazém',
        appropriationType: 'Selecione o tipo de apropriação',
        cultivation: 'Busque um cultivo',
        category: 'Busque uma categoria financeira',
        center: 'Busque um centro de custo',
        area: 'Busque uma área',
        batch: 'Busque um lote',
        account: 'Busque uma conta bancária',
      },
      appropriationTypeOptions: {
        agriculture: 'Agricultura',
        livestock: 'Pecuária',
      },
      sections: {
        items: 'Itens',
        automaticWriteoff: 'Baixa Automática',
      },
      itemRow: {
        addButton: 'Adicionar Item',
        removeButton: 'Remover item',
        emptyLabel: 'Nenhum item adicionado ainda.',
      },
      hints: {
        insufficientBalanceWarning: 'A conta bancária não possui saldo suficiente.',
        productLockedWhenSaved: 'Para trocar o produto, remova o item e adicione outro',
      },
      validation: {
        dateRequired: 'Data é obrigatória',
        dateFuture: 'Data não pode ser futura',
        itemsRequired: 'Adicione ao menos um item',
        productRequired: 'Produto é obrigatório',
        measurementRequired: 'Unidade de medida é obrigatória',
        quantityRequired: 'Quantidade é obrigatória',
        quantityMin: 'Quantidade deve ser maior que 0',
        unitValueRequired: 'Valor unitário é obrigatório',
        warehouseRequiredWhenGenerateStock: 'Armazém é obrigatório quando "Gera estoque?" for Sim',
        appropriationTypeMaxLength: 'Tipo de apropriação deve ter no máximo 10 caracteres',
        providerLotMaxLength: 'Lote do fornecedor deve ter no máximo 15 caracteres',
        providerLotRequiredWhenHasLot: 'Lote do fornecedor é obrigatório para produtos com lote',
        shelfLifeRequiredWhenHasLot: 'Validade é obrigatória para produtos com lote',
        categoryRequired: 'Categoria financeira é obrigatória',
        centerRequired: 'Centro de custo é obrigatório',
        accountRequiredWhenAutomaticWriteoff:
          'Conta bancária é obrigatória quando a baixa automática está habilitada',
        movementDateRequiredWhenAutomaticWriteoff:
          'Data do movimento é obrigatória quando a baixa automática está habilitada',
      },
      errors: {
        invalidFields: 'Verifique os campos destacados antes de salvar.',
      },
    },

    detail: {
      invalidParamsToast: {
        title: 'Entrada de insumo inválida',
        description: 'O identificador informado não é válido.',
      },
      deleteButton: 'Excluir',
      notInformed: 'Não informado',
      notFound: {
        title: 'Entrada de insumo não encontrada',
        description: 'A entrada de insumo solicitada não existe ou foi removida.',
        back: 'Voltar à listagem',
      },
      sections: {
        generalData: 'Dados Gerais',
      },
      movement: {
        code: 'Código do Movimento',
        value: 'Valor do Movimento',
        date: 'Data do Movimento',
        account: 'Conta Bancária',
        empty: 'Nenhuma baixa automática registrada para esta entrada.',
      },
    },
  },
};
