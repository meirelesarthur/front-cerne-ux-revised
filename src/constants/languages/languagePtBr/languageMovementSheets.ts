// src/constants/languages/languagePtBr/languageMovementSheets.ts
// Tradução PT-BR do módulo "Importação Mov. Bancários" (Financeiro).
//
// Rótulos de coluna (decisão 2 — CLM-19 CORRIGIDA): o legado trocava os
// cabeçalhos "Responsável"/"Dt.Emissão" com os dados renderizados (o
// cabeçalho "Responsável" mostrava a DATA, o cabeçalho "Dt.Emissão" mostrava
// o NOME do usuário). Aqui cada rótulo está vinculado ao campo correto —
// "Dt. Emissão" → `date`, "Responsável" → `user.name`.

import { ModuleMovementSheets } from '@/@types/language/module-movement-sheets';

export const languageMovementSheets: ModuleMovementSheets = {
  movementSheet: {
    singularLabel: 'Importação de Mov. Bancário',
    pluralLabel: 'Importações de Mov. Bancários',
    list: {
      pageTitle: 'Importação Mov. Bancários',
      pageSubtitle: 'Consulte os lotes de movimentos bancários já importados por planilha.',
      importButtonLabel: 'Importar planilha',
      table: {
        code: 'Código',
        date: 'Dt. Emissão',
        user: 'Responsável',
        createdAt: 'Importado em',
        actions: {
          viewDetail: 'Ver Detalhe',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhuma importação de movimento bancário encontrada.',
        descriptionEmpty: 'Ainda não há lotes importados para a fazenda ativa.',
        titleFiltered: 'Nenhuma importação de movimento bancário encontrada.',
        descriptionFiltered: 'Tente ajustar o período ou limpar o filtro.',
      },
    },
    filter: {
      title: 'Filtrar importações',
      startDate: 'Dt. Emissão (de)',
      endDate: 'Dt. Emissão (até)',
      dateRangeInvalid: 'A data final não pode ser anterior à data inicial.',
    },
    importModal: {
      title: 'Importar Mov. Bancários',
      subtitle: 'Baixe o modelo, preencha e envie a planilha para lançar um novo lote.',
      downloadShortcut: 'Baixar modelo',
      instructions:
        'A planilha tem 15 colunas (A-O): Conta Bancária, Tipo de Conta, Nº Título, Tipo, Proprietário Gestor, Vlr Título, Dt. Emissão, Dt. Vencimento, Dt. Baixa, Dedutível, Histórico, Fornecedor, Cliente, Categoria e Centro de Custo. Proprietário Gestor é opcional; Fornecedor é exigido só para "C. à Pagar" e Cliente só para "C. à Receber" — as demais colunas são obrigatórias em toda linha.',
      warning: {
        title: 'Importação tudo-ou-nada',
        description:
          'Se qualquer linha da planilha tiver um erro, NENHUMA linha é importada — a operação lança um título e já dá baixa nele para cada linha válida, então a validação é feita por completo antes de gravar qualquer coisa.',
      },
      fileUpload: {
        label: 'Planilha (.xls/.xlsx)',
        hint: 'Arquivo .xls ou .xlsx de até 10MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito. Envie um arquivo .xls ou .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Linhas com erro',
      },
      result: {
        importedLabel: 'Movimentos importados',
        movementSheetCodeLabel: 'Código do lote',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
      importSuccessToast: 'Movimentos bancários importados com sucesso',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
    },
    detail: {
      sections: {
        identification: 'Identificação',
      },
      fields: {
        code: 'Código',
        date: 'Dt. Emissão',
        user: 'Responsável',
      },
      notFound: {
        title: 'Importação não encontrada.',
        description: 'Não há importação de movimento bancário para o identificador informado.',
        back: 'Voltar à listagem',
      },
      invalidParamsToast: {
        title: 'Parâmetros inválidos',
        description: 'O identificador da importação é inválido para exibir o detalhe.',
      },
      noData: 'Não Possui',
      backButton: 'Voltar',
    },
  },
};
