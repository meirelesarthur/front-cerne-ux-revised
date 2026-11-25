// src/config/v2/purchaseOrderPrototype.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO VISUAL da Ordem de compra (plano "Ordem de compra — protótipo
// visual para apresentação", 25/11/2026). Liga as peças que ainda NÃO têm API
// (etapas no topo, fornecedor e comprador, dados de demonstração de fazenda…)
// para apresentar o fluxo antes de construir o backend.
//
// Só liga junto com os dados fictícios — `yarn dev` com `VITE_DEV_MOCKS=true`
// ou o build de demonstração (`VITE_DEMO_MODE=true`) — e pode ser desligada com
// `VITE_PURCHASE_ORDER_PROTOTYPE=false`. Sem mocks (front oficial), é `false`:
// nada do protótipo aparece. NÃO portar para o front oficial enquanto a API
// não existir (ver docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md).
//
// A expressão repete a de `mocks/dev-api` (`DEV_MOCKS`) para não importar o
// módulo de mocks aqui (evita dependência circular).
// -----------------------------------------------------------------------------

import { DEMO_MODE } from '@/config/demoMode';

const MOCKS_ON = (import.meta.env.DEV && import.meta.env.VITE_DEV_MOCKS === 'true') || DEMO_MODE;

export const PURCHASE_ORDER_PROTOTYPE =
  MOCKS_ON && import.meta.env.VITE_PURCHASE_ORDER_PROTOTYPE !== 'false';
