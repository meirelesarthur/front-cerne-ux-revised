// src/constants/languages/languagePtBr/languageFindAnimal.ts
// Tradução PT-BR do módulo "Localizar Animal" (FindAnimal — Operacional >
// Pecuária > Manejo, F-042, TASK-FA-FE-01).
//
// Valores pt-BR = strings LITERAIS do legado (contrato de tela §7) — não
// "melhorados", para que fidelidade (Regra de Ouro) e Lei 10 (i18n) coexistam.
// Micro-correção já aprovada pelo dono (manifesto FID-G3F §4): o rótulo
// legado "Último Sêmem" tem erro de grafia — usamos "Último Sêmen".

import { ModuleFindAnimal } from '@/@types/language/module-find-animal';

export const languageFindAnimal: ModuleFindAnimal = {
  findAnimal: {
    singularLabel: 'Localizar Animal',
    pluralLabel: 'Localizar Animal',
    pageTitle: 'Localizar Animal',
    filter: {
      animalLabel: 'Animal',
      animalPlaceholder: 'Selecione o animal',
      submit: 'Filtrar',
    },
    panels: {
      animal: 'Animal',
      reproductive: 'Reprodutivo',
      batch: 'Lote',
      grazing: 'Módulo',
      area: 'Área',
      mother: 'Mãe',
    },
    fields: {
      identification: 'Identificação',
      category: 'Categoria',
      age: 'Idade',
      weight: 'Peso Atual',
      father: 'Id Pai',
      categoryMatrix: 'Estágio Reprodutivo',
      reproductiveStatus: 'Status Reprodutivo',
      lastSemen: 'Último Sêmen',
      currentBatches: 'Lote Atual',
      code: 'Código',
      quantityAnimal: 'Qnt. Animais',
      employeeName: 'Responsável',
      description: 'Descrição',
      fodder: 'Forragem',
      totalArea: 'Área Total',
      recreationArea: 'Área de Lazer',
      productiveArea: 'Área Produtiva',
      unproductiveArea: 'Área Improdutiva',
    },
    emptyState: {
      noAnimalSelected: 'Nenhum animal selecionado.',
      noBatchLinked: 'Animal não está vinculado a nenhum lote!',
    },
    placeholders: {
      notInformed: 'Não Informado',
      dash: '--',
    },
    transfer: {
      label: 'Transferir para Lote',
      placeholder: 'Selecione',
      submit: 'Salvar',
      successToast: 'Animal transferido de lote com sucesso.',
      validation: {
        batchRequired: 'Selecione um lote para transferência.',
      },
    },
    error: {
      message: 'Não foi possível carregar as informações do animal.',
      notFound: 'Animal não encontrado.',
      retry: 'Tentar novamente',
    },
  },
};
