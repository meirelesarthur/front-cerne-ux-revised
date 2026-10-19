// src/constants/languages/languagePtBr/languageDocument.ts
// Tradução PT-BR do módulo COMPARTILHADO de Documentos Anexos (Document —
// Financeiro, esteira 036, TASK-FE-036-337/338). Namespace ISOLADO —
// consumido por Contas a Receber E Contas a Pagar (Tarefa 339).

import { ModuleDocument } from '@/@types/language/module-document';

export const languageDocument: ModuleDocument = {
  panel: {
    title: 'Documentos Anexos',

    list: {
      columns: {
        description: 'Descrição',
        date: 'Data',
      },
      downloadLabel: 'Baixar',
      removeAction: 'Remover',
      removeConfirmTitle: 'Remover documento',
      removeConfirmDescription:
        'Remover este documento deste título? Ele pode estar vinculado a outros títulos e continuar disponível neles.',
      removedToast: 'Documento removido deste título.',
      emptyState: {
        title: 'Nenhum documento anexado',
        description: 'Este título ainda não possui nenhum documento anexado.',
      },
    },

    upload: {
      sectionTitle: 'Adicionar Documento',
      fields: {
        description: 'Descrição',
        date: 'Data do Documento',
      },
      placeholders: {
        description: 'Descreva o documento',
      },
      submitButton: 'Adicionar Documento',
      uploadedToast: 'Documento adicionado com sucesso.',
      fileUpload: {
        label: 'Arquivo (PDF)',
        hint: 'Somente PDF, até 2MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Apenas arquivos PDF são aceitos.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo de 2MB.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória.',
        descriptionMaxLength: 'A descrição deve ter no máximo 50 caracteres.',
      },
    },
  },
};
