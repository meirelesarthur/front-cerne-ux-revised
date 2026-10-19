// src/constants/languages/languagePtBr/languageFunctions.ts
// Tradução PT-BR do módulo de FUNÇÕES (Administrativo / Gestão Pessoal).

import { ModuleFunctions } from '@/@types/language/module-functions';

export const languageFunctions: ModuleFunctions = {
  function: {
    singularLabel: 'Função',
    pluralLabel: 'Funções',
    list: {
      pageTitle: 'Funções',
      pageSubtitle: 'Gerencie o catálogo de funções (cargo vinculado a um código CBO oficial).',
      deletedToast: 'Função excluída com sucesso',
      table: {
        name: 'Nome',
        cbo: 'CBO',
        baseSalary: 'Salário Base',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma função cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira função.',
        titleFiltered: 'Nenhuma função encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Função',
      },
      error: {
        message: 'Não foi possível carregar as funções.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar funções',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      cbo: 'CBO',
      cboAll: 'Todos',
    },
    form: {
      title: { create: 'Nova Função', edit: 'Editar Função' },
      subtitle: {
        create: 'Cadastre uma nova função (cargo vinculado a um código CBO oficial).',
        edit: 'Atualize os dados da função.',
      },
      fields: {
        name: 'Nome',
        cbo: 'CBO',
        baseSalary: 'Salário Base',
        monthlyHours: 'Carga Horária Mensal',
        vlTimeProductive: 'Valor Hora Produtiva',
        isEnabled: 'Ativo',
        description: 'Descrição',
      },
      placeholders: {
        name: 'Ex.: Vaqueiro',
        cbo: 'Busque por código ou descrição',
        description: 'Ex.: Responsável pelo manejo do rebanho leiteiro',
      },
      // Calculado no servidor (DA-FN-08) — em modo criação, antes do primeiro
      // save, não há valor a exibir.
      vlTimeProductiveEmpty: '—',
      validation: {
        nameMaxLength: 'O nome deve ter no máximo 120 caracteres',
        baseSalaryMin: 'O salário base não pode ser negativo',
        monthlyHoursInteger: 'A carga horária mensal deve ser um número inteiro',
        monthlyHoursMin: 'A carga horária mensal deve ser de pelo menos 1',
        descriptionMaxLength: 'A descrição deve ter no máximo 191 caracteres',
      },
    },
  },
};
