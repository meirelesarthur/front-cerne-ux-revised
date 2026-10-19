// src/constants/harvestProduct/default-values.ts
// -----------------------------------------------------------------------------
// Valores padrão do formulário "Colheita de Frutas" (HarvestProduct —
// Operacional / Agricultura, F-040, execução 040, TASK-FE-1093). Todos os 10
// campos de negócio com valor nulo/vazio explícito — `boxes: []`, a UI de
// grid (TASK-FE-1098) decide o mínimo de 1 linha inicial na tela, não aqui.
// -----------------------------------------------------------------------------

import type { HarvestProductForm } from '@/@types/v2/HarvestProduct';

export function harvestProductFormDefaultValues(): HarvestProductForm {
  return {
    code: '',
    date: '',
    areaUuid: null,
    clientUuid: null,
    productUuid: null,
    plate: '',
    cityUuid: null,
    driverName: '',
    driverNif: '',
    boxes: [],
  };
}
