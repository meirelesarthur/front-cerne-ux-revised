// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/diagnostico-gestacao-form-mapper.ts
// -----------------------------------------------------------------------------
// Mapper puro (sem JSX/hooks) do formulário de CRIAÇÃO de Diagnóstico de
// Gestação — PregnancyDiagnosis (F-016, 97-Esteiras/001, TASK-BM-FE-08,
// contrato de tela §6.6). Mirror estrutural de
// `../acasalamento-form-mapper.ts` (mesma convenção de defaults/payload),
// mas sem round-trip de edição — esta sub-árvore NÃO tem modo editar
// (`->except(['edit','update'])` no legado, contrato de tela §2).
//
// `calculateGestationDays` é CONVENIÊNCIA de UI (regra 11 da Tarefa): o
// front pré-calcula "Tempo de Gestação" a partir de `last_protocol_date` só
// para preencher o campo antes do usuário salvar — o SERVIDOR é a
// autoridade real do valor persistido; o front nunca tenta reproduzir a
// regra dele, só envia o que está no campo.
//
// ⛔ Nenhuma função aqui compara `diagnosis.value`/`id` com um literal
// numérico fixo para decidir a semântica de gestação — ela sai SEMPRE de
// `cascade_rules` (GAP-BM-01), aplicada em `AnimalDiagnosisCard.tsx`, nunca
// neste mapper.
// -----------------------------------------------------------------------------

import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { Option } from '@/@types/option';
import type { AnimalOptionRef, EntityOptionRef } from '@/@types/v2/BreedingMating';
import type {
  CreatePregnancyDiagnosisAnimalPayload,
  CreatePregnancyDiagnosisRequest,
  PregnancyDiagnosisAnimalCardFormValue,
  PregnancyDiagnosisBatchFillFormValue,
  PregnancyDiagnosisForm,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

// ============================================
// Mapas de opção — mirror `acasalamento-form-mapper.ts`
// ============================================

export function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

export function mapAnimalOptionRefToOption(ref: AnimalOptionRef): Option<string> {
  return { label: ref.code, value: ref.uuid };
}

// ============================================
// Defaults (modo criação — único modo desta sub-árvore)
// ============================================

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDefaultDiagnosticoGestacaoFormValues(
  nextCode = '',
  responsibleName = ''
): PregnancyDiagnosisForm {
  return {
    code: nextCode,
    date: todayIsoDate(),
    responsible_name: responsibleName,
    animals: [],
  };
}

export function buildDefaultBatchFillFormValues(): PregnancyDiagnosisBatchFillFormValue {
  return {
    animals: [],
    inseminator: null,
    technique: null,
    diagnosis: null,
    resync: false,
    batch: null,
    observation: null,
  };
}

// ============================================
// Cascata "Tempo de Gestação" (CV-05) — conveniência de UI, servidor é
// autoridade (regra 11 da Tarefa). `null` quando não há
// `last_protocol_date` para calcular (Natural sem protocolo, por exemplo) —
// o campo continua habilitado para preenchimento manual.
// ============================================

export function calculateGestationDays(
  headerDate: string,
  lastProtocolDate: string | null
): number | null {
  if (!headerDate || !lastProtocolDate) return null;

  const diff = differenceInCalendarDays(parseISO(headerDate), parseISO(lastProtocolDate));
  return diff >= 0 ? diff : null;
}

// ============================================
// `Aplicar` do Preenchimento em Lote (regra 6 da Tarefa) — client-side, um
// card por animal selecionado, mesmos valores do bloco. `bull` sempre
// nasce `null` (o card sempre inicia com Touro desabilitado, regra 7); a
// cascata de `gestation_days`/elegibilidade roda no próprio
// `AnimalDiagnosisCard` (efeito no `diagnosis`), inclusive na montagem.
// ============================================

export function buildAnimalCardFromBatchFill(
  animal: Option<string>,
  batchFill: PregnancyDiagnosisBatchFillFormValue
): PregnancyDiagnosisAnimalCardFormValue {
  return {
    animal,
    inseminator: batchFill.inseminator,
    technique: batchFill.technique,
    diagnosis: batchFill.diagnosis,
    resync: batchFill.resync,
    batch: batchFill.batch,
    observation: batchFill.observation,
    gestation_days: null,
    bull: null,
  };
}

// ============================================
// Payload wire-level (`EP-PD-03`)
// ============================================

function mapAnimalCardToPayload(
  row: PregnancyDiagnosisAnimalCardFormValue
): CreatePregnancyDiagnosisAnimalPayload {
  return {
    animal_uuid: row.animal!.value,
    provider_uuid: row.inseminator!.value,
    diagnostic_technique_uuid: row.technique!.value,
    diagnosis_pregnancy_uuid: row.diagnosis!.value,
    batch_uuid: row.batch?.value ?? null,
    resync: row.resync,
    note: row.observation?.trim() ? row.observation.trim() : null,
    gestation_days: row.gestation_days ?? null,
    bull_uuid: row.bull?.value ?? null,
  };
}

export function mapFormValuesToCreatePayload(
  data: PregnancyDiagnosisForm
): CreatePregnancyDiagnosisRequest {
  return {
    date: data.date,
    animals: data.animals.map(mapAnimalCardToPayload),
  };
}

// ============================================
// 422 do servidor mapeado por campo (get_pwa_form_query_pattern —
// "erro-422-por-campo", MANDATORY). Mirror `mapServerFieldToFormField` de
// `acasalamento-form-mapper.ts`/`CreateOrUpdateAcasalamento.tsx`.
// ============================================

const ANIMAL_FIELD_MAP: Record<string, string> = {
  animal_uuid: 'animal',
  provider_uuid: 'inseminator',
  diagnostic_technique_uuid: 'technique',
  diagnosis_pregnancy_uuid: 'diagnosis',
  batch_uuid: 'batch',
  resync: 'resync',
  note: 'observation',
  gestation_days: 'gestation_days',
  bull_uuid: 'bull',
};

export function mapServerFieldToFormField(field: string): string | null {
  if (field === 'date') return 'date';

  const animalMatch = field.match(/^animals\.(\d+)\.(\w+)$/);
  if (animalMatch) {
    const mappedField = ANIMAL_FIELD_MAP[animalMatch[2]];
    return mappedField ? `animals.${animalMatch[1]}.${mappedField}` : null;
  }

  return null;
}
