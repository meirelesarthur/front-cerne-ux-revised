// src/@types/v2/BreedingMating/pregnancyDiagnosis/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do sub-módulo "Diagnóstico de Gestação" (PregnancyDiagnosis — aninhado
// em Acasalamento, F-016, 97-Esteiras/001, Tarefa 01). Rotas aninhadas
// `/breeding-matings/{breeding_mating_uuid}/pregnancy-diagnoses[/{uuid}]`
// (contrato de API §6.2). `uuid` sempre, `id` nunca.
//
// `diagnosis_pregnancy_id == 1 → "Prenhe"` é convenção de dado do SERVIDOR
// (GAP-BM-01) — o front NUNCA compara `id`/`value == 1`; a semântica "prenhe"
// chega via `cascade_rules` (`PregnancyDiagnosisCascadeRules`, ver contexto do
// formulário). `birth_forecast_display` é distinto de `animals.birth_forecast`
// persistido (OQD-PD-002) — o front exibe o `_display`, nunca recalcula.
//
// NÃO existe modo editar nesta sub-árvore (comprovado, `->except(['edit',
// 'update'])` no legado) — por isso não há `UpdatePregnancyDiagnosisRequest`
// nesta fatia; não é omissão, é fidelidade (contrato de tela §2, item "Fora").
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { AnimalOptionRef, EntityOptionRef } from '@/@types/v2/BreedingMating';

// ============================================
// LISTAGEM — `EP-PD-01` `GET .../pregnancy-diagnoses`
// ============================================

export interface PregnancyDiagnosisListItem {
  uuid: string;
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  responsible_name: string;
  /** `date + 280` dias, calculado no SERVIDOR para toda linha (OQD-PD-002) —
   *  distinto de `animals.birth_forecast` persistido; o front nunca recalcula. */
  birth_forecast_display: string;
  /** `true` só no último diagnóstico do Acasalamento pai (CLM-PD-024). */
  can_delete: boolean;
}

export interface PregnancyDiagnosisApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PregnancyDiagnosesListEnvelope {
  success: boolean;
  message: string;
  data: PregnancyDiagnosisListItem[];
  errors: Record<string, string[]> | null;
  meta: PregnancyDiagnosisApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface PregnancyDiagnosisFilterForm {
  start_date: string | null;
  end_date: string | null;
  responsible: Option<string> | null;
}

export interface PregnancyDiagnosisFilterRequest {
  start_date?: string;
  end_date?: string;
  user_uuid?: string;
}

// ============================================
// BLOCO READONLY "Acasalamento" (contexto do formulário e visualização)
// ============================================

export interface PregnancyDiagnosisBreedingMatingBlock {
  uuid: string;
  code: string;
  date: string;
  responsible_name: string;
  type_label: string;
  launch_type_label: string;
  breeding_season: EntityOptionRef | null;
  bull_seed_season: EntityOptionRef | null;
  protocol: EntityOptionRef | null;
  breeding_batch: EntityOptionRef | null;
}

// ============================================
// LINHA DE ANIMAL — leitura (`EP-PD-04`) e escrita (`EP-PD-03`)
// ============================================

export interface PregnancyDiagnosisAnimalLine {
  uuid?: string;
  animal: AnimalOptionRef;
  /** "Inseminador" — `provider_id` do legado. */
  inseminator: EntityOptionRef;
  technique: EntityOptionRef;
  /** "DG" — resultado do diagnóstico (`diagnosis_pregnancy_id`, catálogo). */
  diagnosis: EntityOptionRef;
  batch: EntityOptionRef | null;
  resync: boolean;
  /** Máx. 190 (migration `note`, contrato de tela §6.6). */
  observation: string | null;
  gestation_days: number | null;
  bull: EntityOptionRef | null;
}

export interface PregnancyDiagnosisData {
  uuid: string;
  code: string;
  date: string;
  responsible_name: string;
  animals: PregnancyDiagnosisAnimalLine[];
}

// ============================================
// CONTEXTO DO FORMULÁRIO — `EP-PD-02`
// `cascade_rules` é AUTORIDADE (contrato de tela §5.5) — o front nunca infere
// "Prenhe" por comparação de `id`/`value`.
// ============================================

export interface PregnancyDiagnosisCascadeRules {
  /** uuids de `diagnosis_pregnancy` cujo resultado é "Prenhe" — habilita
   *  Tempo de Gestação e Touro no card (GAP-BM-01, nunca `=== 1` no front). */
  pregnant_diagnosis_pregnancy_uuids: string[];
  /** uuids de `diagnosis_pregnancy` NÃO-prenhe elegíveis para Ressincronização. */
  resync_eligible_diagnosis_pregnancy_uuids: string[];
}

export interface PregnancyDiagnosisBatchFillEnabled {
  /** `Ressincronização` só existe no Preenchimento em Lote quando
   *  `launch_type != 2` (regra 5 da Tarefa, K5 do manifesto FID-G3F). */
  resync: boolean;
}

export interface PregnancyDiagnosisFormContextLookups {
  providers: EntityOptionRef[];
  diagnostic_techniques: EntityOptionRef[];
  diagnoses: EntityOptionRef[];
  batches: EntityOptionRef[];
  bulls: EntityOptionRef[];
}

export interface PregnancyDiagnosisFormContext {
  next_code: string;
  /** `true` → título muda para "… - Acompanhamento"; elegíveis excluem os
   *  já diagnosticados como não-prenhe (CLM-PD-009). */
  follow_up: boolean;
  last_protocol_date: string | null;
  /** Origem depende de `type`/`launch_type` do Acasalamento pai (CLM-PD-010):
   *  Natural → vacas; Simplificado → todos; IATF/FIV → só a última fase. */
  eligible_animals: AnimalOptionRef[];
  breeding_mating: PregnancyDiagnosisBreedingMatingBlock;
  lookups: PregnancyDiagnosisFormContextLookups;
  cascade_rules: PregnancyDiagnosisCascadeRules;
  batch_fill_enabled: PregnancyDiagnosisBatchFillEnabled;
}

// ============================================
// REACT HOOK FORM (criação, Tarefa 08)
// ============================================

export interface PregnancyDiagnosisAnimalCardFormValue {
  /** Readonly no card — origem: `eligible_animals`/`BatchFillSection`. */
  animal: Option<string> | null;
  inseminator: Option<string> | null;
  technique: Option<string> | null;
  diagnosis: Option<string> | null;
  resync: boolean;
  batch: Option<string> | null;
  /** Máx. 190. */
  observation: string | null;
  gestation_days: number | null;
  /** Inicia desabilitado — habilita quando `diagnosis` está em
   *  `cascade_rules.pregnant_diagnosis_pregnancy_uuids` (contrato de tela §6.6). */
  bull: Option<string> | null;
}

export interface PregnancyDiagnosisBatchFillFormValue {
  animals: Option<string>[];
  inseminator: Option<string> | null;
  technique: Option<string> | null;
  diagnosis: Option<string> | null;
  resync: boolean;
  batch: Option<string> | null;
  observation: string | null;
}

export interface PregnancyDiagnosisForm {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  responsible_name: string;
  animals: PregnancyDiagnosisAnimalCardFormValue[];
}

// ============================================
// REQUEST TYPES (payload wire-level — `EP-PD-03`)
// ============================================

export interface CreatePregnancyDiagnosisAnimalPayload {
  animal_uuid: string;
  provider_uuid: string;
  diagnostic_technique_uuid: string;
  diagnosis_pregnancy_uuid: string;
  batch_uuid: string | null;
  resync: boolean;
  note: string | null;
  gestation_days: number | null;
  bull_uuid: string | null;
}

export interface CreatePregnancyDiagnosisRequest {
  /** 'YYYY-MM-DD'. */
  date: string;
  animals: CreatePregnancyDiagnosisAnimalPayload[];
}
