// src/pages/Relatorios/Agricultura/OcorrenciasTalhoes/useOcorrenciasTalhoesProductionCycleCascade.ts
// -----------------------------------------------------------------------------
// Cascata "Ciclo de Produção" (JS-only) do relatório "Ocorrências Talhões"
// (F-232, Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015). Mirror
// ESTRUTURAL de
// `Relatorios/Agricultura/PrevisaoAreaReceita/usePrevisaoAreaReceitaProductionCycleCascade.ts`,
// MAS SEM query de rede adicional (risco 2/SURF-03, contrato de tela §4): o
// endpoint `options` desta feature já retorna `areas[]` aninhadas dentro de
// cada `production_cycle` — a cascata é 100% derivação local (`find()`) do
// array já carregado pelo `useQuery` de `options` da tela, recebido aqui
// como parâmetro (`productionCycles`), NUNCA resolvido por um hook de query
// próprio (diferente do precedente, que usa `getProductionCycleByUuid`).
//
// Selecionar um Ciclo de Produção autopreenche Áreas/Data Início/Data Fim
// (`C11`/SURF-03); editar manualmente qualquer um desses 3 campos reseta o
// Ciclo de Produção para vazio (a tela chama `handleManualFieldChange()` nos
// `onChange` de `area_uuids`/`start_date`/`end_date`).
//
// `production_cycle_uuid` É ENVIADO normalmente no payload de download da
// tela (risco 3, diverge de `PrevisaoAreaReceita`) — esta cascata só cuida do
// autofill client-side, nunca decide o que vai no `buildParams()`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  AppropriationOccurrenceProductionCycleRef,
  AppropriationOccurrenceReportFilterForm,
} from '@/@types/v2/Relatorios/Agricultura/appropriationOccurrenceReport';

import type { UseFormSetValue } from 'react-hook-form';

interface UseOcorrenciasTalhoesProductionCycleCascadeProps {
  setValue: UseFormSetValue<AppropriationOccurrenceReportFilterForm>;
  /** Array já carregado pelo `useQuery` de `options` da tela — SEM query
   *  própria aqui dentro (risco 2). */
  productionCycles: AppropriationOccurrenceProductionCycleRef[];
}

export function useOcorrenciasTalhoesProductionCycleCascade({
  setValue,
  productionCycles,
}: UseOcorrenciasTalhoesProductionCycleCascadeProps) {
  // Chamado no `onChange` do `Select` de Ciclo de Produção (o próprio
  // `Controller` já cuida de `production_cycle_uuid` via `field.onChange`) —
  // `find()` síncrono no array já carregado, SEM chamada de rede.
  function handleProductionCycleSelect(option: Option<string> | null) {
    if (!option) return;

    const cycle = productionCycles.find((item) => item.uuid === option.value);
    if (!cycle) return;

    setValue(
      'area_uuids',
      cycle.areas.map((area) => ({ label: area.description, value: area.uuid })),
      { shouldDirty: true }
    );
    setValue('start_date', cycle.start_date, { shouldDirty: true });
    setValue('end_date', cycle.end_date, { shouldDirty: true });
  }

  /** A tela chama isto nos `onChange` de `area_uuids`/`start_date`/`end_date`
   *  — editar manualmente um desses campos reseta o Ciclo de Produção para
   *  vazio (mirror `PrevisaoAreaReceita`, "desfazer o autofill"). */
  function handleManualFieldChange() {
    setValue('production_cycle_uuid', null, { shouldDirty: true });
  }

  return { handleProductionCycleSelect, handleManualFieldChange };
}
