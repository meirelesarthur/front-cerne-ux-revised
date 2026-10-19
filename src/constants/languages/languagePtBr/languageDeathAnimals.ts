// src/constants/languages/languagePtBr/languageDeathAnimals.ts
// Tradução PT-BR do módulo OPERACIONAL — Mortes (DeathAnimal) — TASK-DA-FE-01/02.
// Mirror `languageFeedlotSectors`, com os campos próprios desta feature.

import { ModuleDeathAnimals } from '@/@types/language/module-death-animals';

export const languageDeathAnimals: ModuleDeathAnimals = {
  deathAnimal: {
    singularLabel: 'Morte',
    pluralLabel: 'Mortes',
    list: {
      pageTitle: 'Mortes',
      pageSubtitle: 'Registro de mortes de animais do rebanho.',
      deletedToast: 'Morte removida com sucesso',
      table: {
        code: 'Código',
        animal: 'Animal',
        animalEmpty: 'Sem animal',
        cause: 'Causa',
        date: 'Data',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma morte registrada.',
        descriptionEmpty: 'Comece registrando a primeira morte.',
        titleEmptyNoCreate: 'Nenhuma morte registrada.',
        descriptionEmptyNoCreate: 'Você não tem permissão para registrar uma nova morte.',
        titleFiltered: 'Nenhuma morte encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Morte',
      },
    },
    filter: {
      title: 'Filtrar mortes',
      animalIdentification: 'Identificação do Animal',
      animalIdentificationPlaceholder: 'Buscar por identificação',
      cause: 'Causa',
      causePlaceholder: 'Selecione a causa',
      startDate: 'Data inicial',
      endDate: 'Data final',
    },
    detail: {
      generalData: { title: 'Dados Gerais' },
      fields: {
        code: 'Código',
        date: 'Data',
        userName: 'Funcionário Responsável',
        batch: 'Lote',
        batchEmpty: 'Sem lote',
        animal: 'Animal',
        animalEmpty: 'Sem animal',
        cause: 'Causa',
        note: 'Observação',
        noteEmpty: 'Sem observação',
      },
      actions: { edit: 'Editar', back: 'Voltar' },
      notFound: {
        title: 'Morte não encontrada.',
        description: 'Verifique o link acessado ou volte para a listagem.',
        back: 'Voltar para a listagem',
      },
    },
    form: {
      title: { create: 'Nova Morte', edit: 'Editar Morte' },
      fields: {
        photo: 'Foto',
        code: 'Código',
        date: 'Data',
        userName: 'Funcionário Responsável',
        batch: 'Lote',
        animal: 'Animal',
        cause: 'Causa',
        note: 'Observação',
      },
      placeholders: {
        batch: 'Selecione o lote',
        animal: 'Selecione o animal',
        cause: 'Selecione a causa',
      },
      hints: {
        codeGeneratedOnSave: 'Gerado automaticamente',
        photoAccepted: 'Formatos aceitos: JPEG, PNG, GIF.',
        photoMaxSize: 'Tamanho máximo: 2MB.',
      },
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar imagem',
        removeLabel: 'Remover imagem',
        errorType: 'Tipo de arquivo não aceito.',
        errorSize: 'Arquivo excede o tamanho máximo.',
      },
      validation: {
        dateRequired: 'A data é obrigatória.',
        batchRequired: 'O lote é obrigatório.',
        animalRequired: 'O animal é obrigatório.',
        causeRequired: 'A causa é obrigatória.',
      },
      dateWarning: { title: 'Data da morte' },
    },
  },
};
