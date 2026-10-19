// src/constants/languages/languagePtBr/languageRainfalls.ts
// Tradução PT-BR do módulo OPERACIONAL — Pluviometria (Rainfall) — execução
// 041, TASK-FE-041-PLV-01..05. Mirror `languageDeathAnimals`, com os campos
// próprios desta feature. Labels PT-BR mirror texto legado: "Pluviometria"
// (módulo), "mm de Chuva" (campo).

import { ModuleRainfalls } from '@/@types/language/module-rainfalls';

export const languageRainfalls: ModuleRainfalls = {
  rainfall: {
    singularLabel: 'Pluviometria',
    pluralLabel: 'Pluviometrias',
    list: {
      pageTitle: 'Pluviometria',
      pageSubtitle: 'Registro de pluviometria por área.',
      deletedToast: 'Registro de pluviometria removido com sucesso',
      table: {
        date: 'Data',
        user: 'Responsável',
        areas: 'Áreas',
        areasEmpty: 'Sem áreas',
        amount: 'mm de Chuva',
        actions: 'Ações',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
        import: 'Importar',
        new: 'Novo',
      },
      emptyState: {
        titleEmpty: 'Nenhuma pluviometria cadastrada.',
        descriptionEmpty: 'Comece registrando o primeiro índice pluviométrico.',
        titleEmptyNoCreate: 'Nenhuma pluviometria cadastrada.',
        descriptionEmptyNoCreate: 'Você não tem permissão para registrar uma nova pluviometria.',
        titleFiltered: 'Nenhuma pluviometria encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo registro',
      },
    },
    filter: {
      title: 'Filtrar pluviometria',
      startDate: 'Data inicial',
      endDate: 'Data final',
    },
    detail: {
      generalData: { title: 'Dados Gerais' },
      fields: {
        date: 'Data',
        user: 'Responsável',
        amount: 'mm de Chuva',
        areas: 'Áreas',
        areasEmpty: 'Sem áreas',
      },
      actions: { edit: 'Editar', back: 'Voltar' },
      notFound: {
        title: 'Pluviometria não encontrada.',
        description: 'Verifique o link acessado ou volte para a listagem.',
        back: 'Voltar para a listagem',
      },
    },
    form: {
      title: { create: 'Nova Pluviometria', edit: 'Editar Pluviometria' },
      fields: {
        date: 'Data',
        amount: 'mm de Chuva',
        areas: 'Áreas',
        user: 'Responsável',
      },
      areasPicker: {
        searchPlaceholder: 'Buscar área',
        selectedCountLabel: 'Áreas selecionadas',
        selectAllLabel: 'Marcar todas',
        deselectAllLabel: 'Desmarcar todas',
        emptyLabel: 'Nenhuma área encontrada.',
        errorLabel: 'Erro ao carregar as áreas.',
        retryLabel: 'Tentar novamente',
      },
      validation: {
        dateRequired: 'A data é obrigatória.',
        amountRequired: 'O índice de mm de chuva é obrigatório.',
        amountRange: 'Informe um valor entre 0 e 9999,9.',
        areasRequired: 'Selecione ao menos uma área.',
      },
    },
    import: {
      title: 'Importar pluviometria',
      subtitle: 'Baixe o modelo, preencha e envie a planilha preenchida.',
      downloadShortcut: 'Baixar modelo',
      instructions: 'Preencha a planilha seguindo o modelo, sem alterar a estrutura das abas.',
      warning: {
        title: 'Atenção',
        description:
          'Se qualquer linha ou área da planilha for inválida, nenhum registro é importado (a importação é tudo ou nada).',
      },
      fileUpload: {
        label: 'Arquivo',
        hint: 'Formatos aceitos: XLS, XLSX. Tamanho máximo: 10MB.',
        dropzoneTitle: 'Arraste a planilha ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte a planilha aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito.',
        errorSizeMessage: 'Arquivo excede o tamanho máximo.',
      },
      rowErrors: { title: 'Erros na planilha', rowPrefix: 'Linha {row}:' },
      result: { created: 'Registros importados' },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
      importSuccessToast: 'Importação de pluviometria concluída com sucesso.',
      downloadTemplateError: 'Não foi possível baixar o modelo.',
    },
  },
};
