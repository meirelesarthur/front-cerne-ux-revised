// src/constants/languages/languagePtBr/languageCategoryMatrix.ts
// Tradução PT-BR do módulo de ESTÁGIO REPRODUTIVO (CategoryMatrix — Cadastros
// Base > Pecuária). Nomenclatura de negócio ("Estágio Reprodutivo") em toda a
// UI — `CategoryMatrix`/`categorymatrix` só aparece em nomes técnicos.

import { ModuleCategoryMatrix } from '@/@types/language/module-category-matrix';

export const languageCategoryMatrix: ModuleCategoryMatrix = {
  categoryMatrix: {
    singularLabel: 'Estágio Reprodutivo',
    list: {
      pageTitle: 'Estágio Reprodutivo',
      pageSubtitle: 'Administre os estágios reprodutivos utilizados no cadastro de animais.',
      deletedToast: 'Estágio reprodutivo removido com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        specie: 'Espécie',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum estágio reprodutivo cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro estágio reprodutivo.',
        titleFiltered: 'Nenhum estágio reprodutivo encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Estágio Reprodutivo',
      },
    },
    filter: {
      title: 'Filtrar estágios reprodutivos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      specie: 'Espécie',
      speciePlaceholder: 'Buscar por espécie',
    },
    form: {
      title: {
        create: 'Novo Estágio Reprodutivo',
        edit: 'Editar Estágio Reprodutivo',
      },
      subtitle: {
        create: 'Cadastre um novo estágio reprodutivo para uso no cadastro de animais.',
        edit: 'Atualize os dados do estágio reprodutivo.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
        specie: 'Espécie',
      },
      placeholders: {
        description: 'Ex.: Novilha',
        specie: 'Buscar por espécie',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        specieRequired: 'A espécie é obrigatória',
      },
    },
  },
};
