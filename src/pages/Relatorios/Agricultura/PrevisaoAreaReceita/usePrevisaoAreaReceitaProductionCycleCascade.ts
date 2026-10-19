// src/pages/Relatorios/Agricultura/PrevisaoAreaReceita/usePrevisaoAreaReceitaProductionCycleCascade.ts
// -----------------------------------------------------------------------------
// Cascata "Ciclo de Produção" (JS-only) do relatório "Prev. Área/Receita"
// (F-280, TASK-MFA-FE-02, esteira 075) — mirror técnico direto de
// `pages/Operacional/Marcacao/useCascadesMarking.ts`.
//
// Selecionar um Ciclo de Produção autopreenche Área/Dt. Início/Dt. Fim
// (`CL-11`, contrato de tela §5); editar esses campos manualmente reseta o
// Ciclo de Produção para vazio (a tela chama `handleManualFieldChange()` nos
// `onChange` de `areas`/`start_date`/`end_date`).
//
// ZERO endpoint novo — reusa `getProductionCycleByUuid` (já migrado, módulo
// Ciclo de Produção) via `useQuery` condicional (`enabled: !!uuid`) +
// `useEffect` SÓ para consumir `isSuccess`/`data` do hook (nunca `reset()`/
// `setValue()` fora de um efeito guardado pelo resultado da query).
//
// `production_cycle` NUNCA entra em `buildParams()` da tela — é 100%
// client-side (`CL-10`), resolvido inteiramente aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getProductionCycleByUuid } from '@/services/v2/ProductionCycles/production-cycle-service';

import type { MarkingForecastAreaReportFilterForm } from '@/@types/v2/Relatorios/Agricultura/markingForecastAreaReport';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface UsePrevisaoAreaReceitaProductionCycleCascadeProps {
  watch: UseFormWatch<MarkingForecastAreaReportFilterForm>;
  setValue: UseFormSetValue<MarkingForecastAreaReportFilterForm>;
}

export function usePrevisaoAreaReceitaProductionCycleCascade({
  watch,
  setValue,
}: UsePrevisaoAreaReceitaProductionCycleCascadeProps) {
  const productionCycleUuid = watch('production_cycle')?.value;

  const cycleQuery = useQuery({
    queryKey: [queryKey.productionCycles.productionCycle, productionCycleUuid],
    queryFn: () => getProductionCycleByUuid(productionCycleUuid!),
    enabled: !!productionCycleUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Sucesso — popula Área/Dt. Início/Dt. Fim a partir do ciclo escolhido
  // (`CL-11`). Roda só quando o resultado da query muda, nunca a cada render.
  useEffect(() => {
    if (!productionCycleUuid) return;
    if (cycleQuery.isSuccess && cycleQuery.data) {
      const cycle = cycleQuery.data.data;
      setValue(
        'areas',
        (cycle.areas ?? []).map((area) => ({ label: area.description, value: area.uuid })),
        { shouldDirty: true }
      );
      setValue('start_date', cycle.start_date, { shouldDirty: true });
      setValue('end_date', cycle.end_date, { shouldDirty: true });
    }
  }, [cycleQuery.isSuccess, cycleQuery.data, productionCycleUuid]);

  /** A tela chama isto nos `onChange` de `areas`/`start_date`/`end_date` —
   *  editar manualmente um desses campos reseta o Ciclo de Produção para
   *  vazio (mirror `CL-11`, "desfazer o autofill"). */
  function handleManualFieldChange() {
    setValue('production_cycle', null, { shouldDirty: true });
  }

  return {
    handleManualFieldChange,
    isResolvingCycle: !!productionCycleUuid && cycleQuery.isPending,
  };
}
