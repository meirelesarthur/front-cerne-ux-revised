// src/constants/languages/languagePtBr/languageCausaMortePerda.ts
// Tradução PT-BR do módulo de CAUSA MORTE/PERDA (Cadastros Base / Pecuária).

import { ModuleDeathLosses } from '@/@types/language/module-death-losses';

export const languageCausaMortePerda: ModuleDeathLosses = {
  deathLoss: {
    singularLabel: 'Causa de Morte/Perda',
    list: {
      pageTitle: 'Causa Morte/Perda',
      pageSubtitle: 'Administre as causas de morte e perda vinculadas às espécies cadastradas.',
      deletedToast: 'Causa de morte/perda excluída com sucesso',
      table: {
        description: 'Descrição',
        cause: 'Causa',
        specie: 'Espécie',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma causa de morte/perda cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira causa de morte/perda.',
        titleEmptyNoCreate: 'Nenhuma causa de morte/perda disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há causas de morte/perda cadastradas. Entre em contato com o administrador da plataforma.',
        cta: 'Nova Causa de Morte/Perda',
      },
      deleteConfirm: {
        title: 'Excluir causa de morte/perda',
        description: 'Tem certeza que deseja excluir a causa de morte/perda',
        warning:
          'Esta ação não pode ser desfeita. Uma causa de morte/perda com registros vinculados não pode ser excluída; nesse caso, desative-a.',
      },
    },
    form: {
      title: {
        create: 'Nova Causa de Morte/Perda',
        edit: 'Editar Causa de Morte/Perda',
      },
      subtitle: {
        create: 'Cadastre uma nova causa de morte/perda vinculada a uma espécie.',
        edit: 'Atualize os dados da causa de morte/perda.',
      },
      fields: {
        description: 'Descrição',
        cause: 'Causa',
        isEnabled: 'Ativo',
        specie: 'Espécie',
        causeOptions: {
          death: 'Morte',
          loss: 'Perda',
        },
      },
      placeholders: {
        description: 'Ex.: Raiva',
        cause: 'Selecione a causa',
        specie: 'Buscar por descrição',
      },
      hints: {
        specieRequired: 'A espécie é obrigatória.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 191 caracteres',
        specieRequired: 'Selecione uma espécie',
        causeRequired: 'Selecione uma causa',
      },
    },
  },
};
