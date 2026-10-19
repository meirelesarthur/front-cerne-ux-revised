// src/constants/languages/languagePtBr/languageDocumentManagements.ts
// Tradução pt-BR do módulo "Documentos" (DocumentManagement — Administrativo /
// Gestão Documentos, Tarefas 12/13). Módulo IRMÃO de `documentTypes` (mesmo
// grupo de menu). Ver `@/@types/language/module-base-registrations` para o
// contrato completo (`documentManagements`).

import type { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

export const languageDocumentManagements: ModuleBaseRegistrations['documentManagements'] = {
  singularLabel: 'Documento',
  pluralLabel: 'Documentos',

  list: {
    pageTitle: 'Documentos',
    pageSubtitle: 'Administre os documentos e certidões da fazenda.',
    deletedToast: 'Documento removido com sucesso',
    table: {
      code: 'Código',
      description: 'Descrição',
      documentType: 'Tipo de Documento',
      validity: 'Validade',
      alertDays: 'Dias de Alerta',
      actions: 'Ações',
    },
    actions: {
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Excluir',
    },
    emptyState: {
      titleEmpty: 'Nenhum documento cadastrado.',
      descriptionEmpty: 'Comece adicionando o primeiro documento.',
      titleEmptyNoCreate: 'Nenhum documento cadastrado.',
      descriptionEmptyNoCreate: 'Nenhum documento foi cadastrado ainda.',
      titleFiltered: 'Nenhum documento encontrado.',
      descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
      cta: 'Novo Documento',
    },
    error: {
      message: 'Não foi possível carregar a lista de Documentos.',
      retry: 'Tentar novamente',
    },
    deleteConfirm: {
      title: 'Excluir documento',
      description:
        'Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
    },
  },

  filter: {
    title: 'Filtrar Documentos',
    documentType: 'Tipo de Documento',
    documentTypeAll: 'Todos',
    startDate: 'Validade de',
    endDate: 'Validade até',
    dateRangeInvalid: 'A data final deve ser maior ou igual à data inicial',
  },

  form: {
    title: {
      create: 'Novo Documento',
      edit: 'Editar Documento',
      view: 'Visualizar Documento',
    },
    subtitle: {
      create: 'Cadastre um novo documento.',
      edit: 'Edite os dados do documento selecionado.',
    },
    fields: {
      code: 'Código',
      documentType: 'Tipo de Documento',
      description: 'Descrição',
      validity: 'Validade',
      alertDays: 'Dias de Alerta',
      observation: 'Observação',
      attachmentName: 'Descrição do Anexo',
      attachmentFile: 'Arquivo',
    },
    placeholders: {
      documentType: 'Selecione o Tipo de Documento',
    },
    hints: {
      codeGenerated: 'Gerado automaticamente ao salvar',
    },
    sections: {
      attachments: 'Anexos',
    },
    validation: {
      documentTypeRequired: 'Tipo de Documento é obrigatório',
      descriptionRequired: 'Descrição é obrigatória',
      descriptionMaxLength: 'Descrição deve ter no máximo 100 caracteres',
      observationMaxLength: 'Observação deve ter no máximo 200 caracteres',
      attachmentNameMaxLength: 'Descrição do Anexo deve ter no máximo 255 caracteres',
    },
    toasts: {
      createSuccess: 'Documento criado com sucesso.',
      updateSuccess: 'Documento atualizado com sucesso.',
    },
  },

  attachmentRow: {
    addButton: '+ Adicionar item',
    removeButton: 'Remover',
    emptyLabel: 'Nenhum anexo adicionado',
    defaultName: 'Não Informado',
    dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
    dropzoneDragging: 'Solte o arquivo aqui',
    changeLabel: 'Trocar arquivo',
    clearFileLabel: 'Limpar seleção',
    replaceLabel: 'Substituir arquivo',
    existingFileLabel: 'Anexo atual',
    errorType: 'Formato não aceito.',
    errorSize: 'Arquivo excede o tamanho máximo de 10 MB.',
  },
};
