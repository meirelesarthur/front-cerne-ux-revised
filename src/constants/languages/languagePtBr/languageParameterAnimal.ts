// src/constants/languages/languagePtBr/languageParameterAnimal.ts
// Tradução PT-BR do módulo de PARÂMETROS ANIMAIS (Cadastros Base / Pecuária).
// Fundação da regeneração das telas (TASK-FE-1074) — mirror `languageCausaMortePerda`.
// Rótulos de campo fiéis ao contrato v1.1 §2 ("Área de Alimentação (cm³)",
// "Consumo de Água (L)", "Consumo de MS (Kg)", "Peso Médio (Kg)").

import { ModuleParameterAnimals } from '@/@types/language/module-parameter-animals';

export const languageParameterAnimal: ModuleParameterAnimals = {
  parameterAnimal: {
    singularLabel: 'Parâmetro Animal',
    pluralLabel: 'Parâmetros Animais',
    list: {
      pageTitle: 'Parâmetros Animais',
      pageSubtitle: 'Administre os parâmetros nutricionais de referência por categoria de animal.',
      deletedToast: 'Parâmetro animal excluído com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        category: 'Categoria',
        employee: 'Encarregado',
        averageWeight: 'Peso Médio',
      },
      actions: {
        edit: 'Editar parâmetro animal',
        delete: 'Excluir parâmetro animal',
      },
      emptyState: {
        titleEmpty: 'Nenhum parâmetro animal cadastrado.',
        titleFiltered: 'Nenhum resultado encontrado.',
        titleEmptyNoCreate: 'Nenhum parâmetro animal disponível.',
        descriptionEmpty: 'Comece adicionando o primeiro parâmetro animal.',
        descriptionFiltered: 'Tente ajustar ou remover os filtros atuais.',
        descriptionEmptyNoCreate:
          'Ainda não há parâmetros animais cadastrados. Entre em contato com o administrador da plataforma.',
        cta: 'Novo Parâmetro Animal',
      },
      deleteConfirm: {
        title: 'Excluir parâmetro animal',
        description: 'Tem certeza que deseja excluir o parâmetro animal',
        warning: 'Esta exclusão é definitiva e não pode ser desfeita.',
      },
    },
    filter: {
      title: 'Filtrar Parâmetros Animais',
      description: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Novo Parâmetro Animal',
        edit: 'Editar Parâmetro Animal',
      },
      subtitle: {
        create: 'Cadastre um novo parâmetro nutricional de referência.',
        edit: 'Atualize os dados do parâmetro animal.',
      },
      fields: {
        code: 'Código',
        description: 'Descrição',
        employee: 'Responsável',
        specie: 'Espécie',
        category: 'Categoria',
        feedingArea: 'Área de Alimentação (cm³)',
        waterConsumption: 'Consumo de Água (L)',
        msConsumption: 'Consumo de MS (Kg)',
        averageWeight: 'Peso Médio (Kg)',
      },
      placeholders: {
        description: 'Ex.: Bezerros de recria',
        employee: 'Buscar por nome',
        specie: 'Selecione a espécie',
        category: 'Buscar por descrição',
        feedingArea: '0,00',
        waterConsumption: '0,00',
        msConsumption: '0,00',
        averageWeight: '0,00',
      },
      hints: {
        specieRequired: 'Selecione a espécie para habilitar a Categoria.',
      },
      warnings: {
        categoryClearedBySpecieChange:
          'A categoria selecionada foi removida porque não pertence à nova espécie.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 255 caracteres',
        employeeRequired: 'Selecione um responsável',
        specieRequired: 'Selecione uma espécie',
        categoryRequired: 'Selecione uma categoria',
        feedingAreaRequired: 'A área de alimentação é obrigatória',
        waterConsumptionRequired: 'O consumo de água é obrigatório',
        msConsumptionRequired: 'O consumo de MS é obrigatório',
        averageWeightRequired: 'O peso médio é obrigatório',
      },
    },
  },
};
