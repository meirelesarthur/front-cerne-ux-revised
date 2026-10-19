// src/constants/CadastrosBase/Client/options/client-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`CheckClientDependenciesAction::RESTRICT_TABLES`, shape ARRAY
// `Array<{resource, table, count}>` — as 14 tabelas de negócio com FK
// `RESTRICT` reais vinculadas a `clients.id`, incluindo `ctes` combinada
// via OR de `destinatario_id`/`remetente_id`). Mesma família de dicionário
// de `addressing-in-use-table-labels.ts`/`function-in-use-table-labels.ts`
// — canário do `InUseBlockedDialog` genérico aplicado ao módulo Clientes
// (migração do antigo `ClientInUseDialog.tsx`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const tableLabels = languageGB.clients.client.deleteBlocked.tableLabels;

  return new Map([
    ['budgets', tableLabels.budgets],
    ['charges', tableLabels.charges],
    ['ctes', tableLabels.ctes],
    ['harvest_products', tableLabels.harvestProducts],
    ['incomes', tableLabels.incomes],
    ['module_weighings', tableLabels.moduleWeighings],
    ['movement_sales', tableLabels.movementSales],
    ['movements', tableLabels.movements],
    ['nves', tableLabels.nves],
    ['orders', tableLabels.orders],
    ['sale_contracts', tableLabels.saleContracts],
    ['sales', tableLabels.sales],
    ['transfer_abc_batches', tableLabels.transferAbcBatches],
    ['transfers', tableLabels.transfers],
  ]);
};

// Fallback defensivo: só ativa se a API devolver uma chave nunca vista (nome
// cru da tabela) — mesmo racional de `addressingInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const clientInUseTableLabels = { getLabel };
