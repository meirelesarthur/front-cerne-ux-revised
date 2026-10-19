// src/constants/languages/languagePtBr/languageBirthAnimals.ts
// Tradução PT-BR do módulo de NASCIMENTOS (Operacional > Pecuária).
// Namespace `birthAnimals` — LIVRE (frontend-contract-nascimentos.md §1).

import { ModuleBirthAnimals } from '@/@types/language/module-birth-animals';

export const languageBirthAnimals: ModuleBirthAnimals = {
  birthAnimal: {
    singularLabel: 'Nascimento',
    pluralLabel: 'Nascimentos',
    list: {
      pageTitle: 'Nascimentos',
      pageSubtitle: 'Gerencie os nascimentos (bezerros) da fazenda.',
      deletedToast: 'Nascimento excluído com sucesso.',
      table: {
        code: 'Código',
        mother: 'Mãe',
        fatherText: 'ID Pai/Sêmen',
        newborn: 'Bezerro',
        breed: 'Raça',
        weight: 'Peso',
        date: 'Data',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
        editDisabledTooltip: 'Este nascimento já tem desmame vinculado e não pode ser editado.',
        deleteDisabledTooltip: 'Este nascimento já tem desmame vinculado e não pode ser excluído.',
      },
      emptyState: {
        titleEmpty: 'Nenhum nascimento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro nascimento.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar nascimentos',
      identification: 'Identificação (mãe ou bezerro)',
      breed: 'Raça',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    deleteDialog: {
      title: 'Confirmar exclusão',
      descriptionTemplate:
        'O nascimento {code} será excluído permanentemente. Esta ação não pode ser desfeita.',
    },
    banners: {
      weaningLocked:
        'Este nascimento já tem desmame vinculado — edição e exclusão indisponíveis nesta tela.',
    },
    detail: {
      pageTitleTemplate: 'Nascimento {code}',
      notFound: {
        title: 'Nascimento não encontrado.',
        description: 'O nascimento solicitado não existe ou foi removido.',
        back: 'Voltar para a listagem',
      },
      sections: {
        header: 'Cabeçalho',
        identifications: 'Identificações',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        mother: 'Mãe',
        fatherText: 'ID Pai/Sêmen',
        fatherAnimal: 'Pai (resolvido)',
        newborn: 'Bezerro',
        breed: 'Raça',
        category: 'Categoria',
        specie: 'Espécie',
        birthNote: 'Observação de Nascimento',
        batch: 'Lote',
        transferBatch: 'Lote (transferência)',
        weight: 'Peso',
        furDescription: 'Pelagem',
        note: 'Observação',
        photo: 'Foto',
      },
      identificationsTable: {
        type: 'Tipo de Identificação',
        identification: 'Identificação',
        empty: 'Nenhuma identificação cadastrada.',
      },
      backButton: 'Voltar',
    },
    form: {
      title: {
        create: 'Novo Nascimento',
        edit: 'Editar Nascimento',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        specie: 'Espécie',
        category: 'Categoria',
        breed: 'Raça',
        birthNote: 'Observação de Nascimento',
        weight: 'Peso',
        mother: 'Mãe',
        fatherText: 'Pai/Sêmen',
        batch: 'Lote (filtro Mãe)',
        transferBatch: 'Lote (transferência)',
        furDescription: 'Pelagem',
        note: 'Observação',
        photo: 'Foto',
      },
      placeholders: {
        specie: 'Selecione a espécie',
        category: 'Selecione a categoria',
        breed: 'Selecione a raça',
        birthNote: 'Selecione a observação de nascimento',
        mother: 'Busque a mãe pela identificação',
        fatherText: 'Digite a identificação do pai ou sêmen',
        batch: 'Selecione o lote',
        transferBatch: 'Selecione o lote de transferência',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado ao salvar',
        specieRequired: 'Selecione a espécie primeiro',
      },
      image: {
        dropzoneTitle: 'Arraste uma foto ou clique para selecionar',
        dropzoneDragging: 'Solte a foto aqui',
        changeLabel: 'Trocar foto',
        removeLabel: 'Remover',
        errorType: 'Formato de arquivo não suportado.',
        errorSize: 'Arquivo maior que o limite permitido.',
      },
      identifications: {
        sectionTitle: 'Identificações do bezerro',
        sectionHint: 'Adicione ao menos uma identificação para o bezerro.',
        emptyTitle: 'Nenhuma identificação adicionada.',
        addRowLabel: 'Adicionar identificação',
        removeRowLabel: 'Remover identificação',
        typeLabel: 'Tipo de Identificação',
        typePlaceholder: 'Selecione o tipo',
        valueLabel: 'Identificação',
        valuePlaceholder: 'Digite a identificação',
        duplicateWarningTitle: 'Identificação já cadastrada',
        duplicateWarningDescription:
          'A identificação "{{identification}}" já está em uso por outro registro.',
      },
      batchDateWarning: {
        title: 'Aviso de consistência de data',
      },
    },
    excel: {
      headerButtonLabel: 'Importar/Exportar',
      downloadTemplate: 'Baixar modelo',
      downloadTemplateError: 'Não foi possível baixar o modelo.',
      import: {
        title: 'Importar Nascimentos',
        subtitle: 'Importe nascimentos em lote a partir de uma planilha .xlsx.',
        instructions:
          'Baixe o modelo, preencha os dados dos nascimentos e envie o arquivo preenchido abaixo.',
        downloadShortcut: 'Baixar modelo',
        warning: {
          title: 'Atenção antes de importar',
          description:
            'Se qualquer linha da planilha for inválida, nenhum nascimento será importado — corrija os erros indicados e envie novamente.',
        },
        fileUpload: {
          label: 'Arquivo da planilha',
          hint: 'Formato .xlsx, até 10MB.',
          dropzoneTitle: 'Arraste a planilha ou clique para selecionar',
          dropzoneDraggingTitle: 'Solte a planilha aqui',
          changeLabel: 'Trocar arquivo',
          removeLabel: 'Remover arquivo',
          errorTypeMessage: 'Formato de arquivo não aceito. Envie um arquivo .xlsx.',
          errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
        },
        rowErrors: {
          title: 'Não foi possível importar a planilha',
        },
        result: {
          created: 'Nascimentos importados',
        },
        importSuccessToast: 'Nascimentos importados com sucesso.',
        noPermission: 'Você não tem permissão para importar nascimentos.',
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        closeButton: 'Fechar',
      },
    },
  },
};
