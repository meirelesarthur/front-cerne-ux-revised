// src/pages/Operacional/Marcacao/useCascadesMarking.ts
// -----------------------------------------------------------------------------
// Cascata de seleção do form de Marcação — TASK-MC-FE-04. Observa
// `harvest_uuid` + `date` e resolve `week_vintage_uuid` (hidden) + a cor
// sugerida pela safra para aquela semana.
//
// FIX de homologação (achado do dono): o legado (`_forms.blade.php`)
// exibe uma tabelinha READONLY com `number_week`/`start_date`/`end_date`
// da semana resolvida, além de gravar o hidden. Este hook agora também
// expõe `weekInfo` (o objeto `WeekVintage` inteiro — `uuid`/`number_week`/
// `start_date`/`end_date`/`color`, confirmado em `@/@types/v2/Harvests`)
// para a tela renderizar o bloco equivalente; `undefined` enquanto a
// semana não está resolvida (harvest+date ausentes, query pendente, ou
// 404 — nesse caso o efeito de erro abaixo já limpa e avisa, sem tabela).
//
// LACUNA da arquitetura resolvida por leitura direta do `api_root`: o
// roteiro (`ARCHITECTURE-MARCACAO-FE.md`) assumia um endpoint dedicado
// `GET /harvest-week`, que NÃO existe no fork (confirmado em
// `routes/api.php`). O mecanismo real é `GET /harvests/{uuid}/weeks/
// current?date=` (`HarvestController::currentWeek`), já consumido por
// `useHarvestCurrentWeek` em `pages/CadastrosBase/Safra/useHarvests.tsx` —
// REAPROVEITADO aqui (decisão do Executor: mesmo racional documentado em
// `listHarvestOptions`, não duplicar uma query já existente e testada).
//
// Erro explícito (404 = nenhuma semana cobre a data, `ARCHITECTURE-
// MARCACAO-FE.md`: mirror `erro_cor_safra` do legado) — limpa
// `harvest_uuid`/`week_vintage_uuid` e mostra toast, NUNCA falha silenciosa
// (`get_spa_ux_fidelity_pattern §3`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useHarvestCurrentWeek } from '@/pages/CadastrosBase/Safra/useHarvests';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { MarkingForm } from '@/@types/v2/Marcacao/marking';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface UseCascadesMarkingProps {
  watch: UseFormWatch<MarkingForm>;
  setValue: UseFormSetValue<MarkingForm>;
}

export function useCascadesMarking({ watch, setValue }: UseCascadesMarkingProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.marcacao.marking;

  const harvestOption = watch('harvest_uuid');
  const date = watch('date');

  const harvestUuid = harvestOption?.value;
  const hasBothInputs = !!harvestUuid && !!date;

  // Só habilita a query quando os DOIS insumos existem — `useHarvestCurrentWeek`
  // (compartilhado com Safra) só valida `harvestId`, não `date`.
  const currentWeekQuery = useHarvestCurrentWeek({
    harvestId: hasBothInputs ? harvestUuid : undefined,
    date: date ?? '',
  });

  // Sucesso — popula `week_vintage_uuid` (hidden).
  useEffect(() => {
    if (!hasBothInputs) return;
    if (currentWeekQuery.isSuccess && currentWeekQuery.data) {
      setValue('week_vintage_uuid', currentWeekQuery.data.uuid, { shouldDirty: true });
    }
  }, [currentWeekQuery.isSuccess, currentWeekQuery.data, hasBothInputs]);

  // Erro (404 — nenhuma semana cobre a data) — limpa `harvest_uuid` +
  // `week_vintage_uuid` e avisa explicitamente, mirror `erro_cor_safra`.
  useEffect(() => {
    if (!hasBothInputs) return;
    if (currentWeekQuery.isError) {
      setValue('week_vintage_uuid', null, { shouldDirty: true });
      setValue('harvest_uuid', null, { shouldDirty: true });
      toaster.error({
        title: text.singularLabel,
        description: text.form.cascade.errorToast,
        duration: 7000,
      });
    }
  }, [currentWeekQuery.isError, hasBothInputs]);

  /** Troca de Safra ou Data — a semana anterior pode não ser válida mais
   *  (o próprio `useHarvestCurrentWeek` reconsulta pela nova combinação;
   *  aqui só limpamos o hidden até a resposta chegar, evitando enviar uma
   *  `week_vintage_uuid` obsoleta se o usuário submeter no meio do trocar). */
  function handleHarvestOrDateChange() {
    setValue('week_vintage_uuid', null, { shouldDirty: true });
  }

  const isWeekResolved = hasBothInputs && currentWeekQuery.isSuccess && !!currentWeekQuery.data;

  return {
    /** Cor sugerida pela safra para a semana resolvida (livre, servidor) —
     *  SUGESTÃO visual apenas, nunca sobrescreve a escolha do usuário em
     *  `color` (catálogo fechado de 16 hex). */
    suggestedColor: isWeekResolved ? currentWeekQuery.data?.color : undefined,
    /** Semana resolvida (`number_week`/`start_date`/`end_date`/`color`) —
     *  mirror da tabelinha `.weeks` do legado, renderizada READONLY na
     *  tela só quando definida (semana resolvida com sucesso). */
    weekInfo: isWeekResolved ? currentWeekQuery.data : undefined,
    isResolvingWeek: hasBothInputs && currentWeekQuery.isPending,
    handleHarvestOrDateChange,
  };
}
