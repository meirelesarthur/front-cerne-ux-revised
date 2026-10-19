// src/constants/languages/languagePtBr/languageEvolutions.ts
// Tradução PT-BR do módulo de EVOLUÇÃO/REBANHO (Operacional > Pecuária >
// Transferências / Relatórios > Pecuária). Namespace `evolutions` — LIVRE
// (spa-contract-evolucao-rebanho.md §1).

import { ModuleEvolutions } from '@/@types/language/module-evolutions';

export const languageEvolutions: ModuleEvolutions = {
  evolution: {
    singularLabel: 'Evolução/Rebanho',
    pluralLabel: 'Evoluções/Rebanho',
    list: {
      pageTitle: 'Evolução/Rebanho',
      pageSubtitle: 'Acompanhe as mudanças de categoria dos animais do rebanho.',
      table: {
        animal: 'Animal',
        birthDate: 'Data de Nascimento',
        date: 'Data da Evolução',
        categoryOld: 'Categoria Anterior',
        categoryNext: 'Próxima Categoria',
      },
      empty: {
        title: 'Nenhuma evolução registrada.',
        description:
          'As evoluções são geradas automaticamente pelo processo diário do sistema, sem cadastro manual.',
      },
      emptyFiltered: {
        title: 'Nenhuma evolução encontrada.',
        description: 'Tente ajustar os filtros.',
      },
      error: {
        title: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
      report: 'Relatório',
    },
    filter: {
      title: 'Filtrar evoluções',
      animal: 'Animal',
      startDate: 'Data inicial',
      endDate: 'Data final',
    },
    report: {
      pageTitle: 'Relatório de Evolução de Rebanho',
      pageSubtitle: 'Exporte o relatório de evolução de categoria dos animais em PDF ou Excel.',
      filter: {
        startDate: 'Data inicial',
        endDate: 'Data final',
        format: 'Formato',
      },
      format: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      downloadButton: 'Gerar relatório',
      toasts: {
        success: 'Relatório gerado com sucesso.',
        genericError: 'Não foi possível gerar o relatório.',
      },
      hint: {
        datesRequired: 'Informe a data inicial e a data final para gerar o relatório.',
      },
    },
  },
};
