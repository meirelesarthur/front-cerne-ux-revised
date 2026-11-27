// src/pages/CadastrosBase/TiposServico/serviceTypeParams.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — regras PURAS dos parâmetros do Tipo de serviço
// (o antigo cadastro de Operações). Sem React e sem API, para testar fácil.
//
// O Tipo de serviço guarda tudo o que o Apontamento pede (uso, exige safra, cultura, lote e
// área utilizada, lançamentos obrigatórios, gera produção, ocorrência, assinatura, aviso,
// fotos e tamanho do texto) e o "Gera execução". Tabela completa em
// docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md.
// -----------------------------------------------------------------------------

export type ServiceTypeUse = 'agricultura' | 'pecuaria' | 'ambos';

export const SERVICE_TYPE_USES: ServiceTypeUse[] = ['agricultura', 'pecuaria', 'ambos'];

export interface ServiceTypeParams {
  use: ServiceTypeUse;
  /** Safra obrigatória (só agricultura). */
  requires_harvest: boolean;
  /** Cultura obrigatória (só agricultura). */
  requires_cultivation: boolean;
  /** Lote obrigatório (só pecuária). */
  requires_batch: boolean;
  /** Área utilizada obrigatória (só agricultura); senão o campo some. */
  requires_used_area: boolean;
  /** Lançamentos obrigatórios: ao menos um item em cada grupo marcado. */
  required_labor: boolean;
  required_machines: boolean;
  required_inputs: boolean;
  /** Mostra o grupo Produção no Apontamento. */
  generates_production: boolean;
  /** Ocorrência com diagnóstico (ou ação corretiva) obrigatória. */
  requires_occurrence: boolean;
  /** Assinatura do responsável no app. */
  requires_signature: boolean;
  /** Avisa alguém ao concluir. */
  notify_on_finish: boolean;
  /** Quantidade mínima de fotos. */
  min_photos: number;
  /** Tamanho da descrição, em caracteres (0 = sem limite). */
  text_min: number;
  text_max: number;
  /** Sim: o serviço comprado por Ordem de compra deste tipo gera a execução ao ser recebido. */
  generates_execution: boolean;
}

export const DEFAULT_SERVICE_TYPE_PARAMS: ServiceTypeParams = {
  use: 'ambos',
  requires_harvest: false,
  requires_cultivation: false,
  requires_batch: false,
  requires_used_area: false,
  required_labor: false,
  required_machines: false,
  required_inputs: false,
  generates_production: false,
  requires_occurrence: false,
  requires_signature: false,
  notify_on_finish: false,
  min_photos: 0,
  text_min: 0,
  text_max: 0,
  generates_execution: true,
};

/** Parâmetros que só fazem sentido para um dos usos. */
export type UseDependentField =
  | 'requires_harvest'
  | 'requires_cultivation'
  | 'requires_used_area'
  | 'requires_batch';

/** Agricultura: safra, cultura e área utilizada. Pecuária: lote. Ambos: tudo. */
export function fieldAppliesToUse(field: UseDependentField, use: ServiceTypeUse): boolean {
  if (field === 'requires_batch') return use !== 'agricultura';
  return use !== 'pecuaria';
}

/** Desliga o que não se aplica ao uso (usado ao trocar o Uso e antes de salvar). */
export function normalizeParamsForUse(params: ServiceTypeParams): ServiceTypeParams {
  const next = { ...params };
  (['requires_harvest', 'requires_cultivation', 'requires_used_area', 'requires_batch'] as const).forEach((field) => {
    if (!fieldAppliesToUse(field, next.use)) next[field] = false;
  });
  return next;
}

export type ServiceTypeParamsError = 'textMaxLessThanMin' | 'minPhotosNegative' | 'textNegative';

/** Regras de tela: texto máximo >= mínimo (quando há máximo), fotos e textos nunca negativos. */
export function validateServiceTypeParams(params: ServiceTypeParams): ServiceTypeParamsError[] {
  const errors: ServiceTypeParamsError[] = [];
  if (params.min_photos < 0) errors.push('minPhotosNegative');
  if (params.text_min < 0 || params.text_max < 0) errors.push('textNegative');
  if (params.text_max > 0 && params.text_max < params.text_min) errors.push('textMaxLessThanMin');
  return errors;
}

export type AppointmentPreviewKey =
  | 'harvest'
  | 'cultivation'
  | 'batch'
  | 'usedArea'
  | 'labor'
  | 'machines'
  | 'inputs'
  | 'production'
  | 'occurrence'
  | 'signature'
  | 'photos'
  | 'text'
  | 'notify';

export interface AppointmentPreviewItem {
  key: AppointmentPreviewKey;
  /** Fotos: quantidade mínima. */
  count?: number;
  /** Texto: mínimo e máximo de caracteres (0 = sem limite). */
  min?: number;
  max?: number;
}

/**
 * "Como fica o Apontamento": o que será obrigatório (ou aparecerá) com estes parâmetros.
 * Considera o uso: o que não se aplica a ele não entra.
 */
export function appointmentPreview(params: ServiceTypeParams): AppointmentPreviewItem[] {
  const p = normalizeParamsForUse(params);
  const items: AppointmentPreviewItem[] = [];
  if (p.requires_harvest) items.push({ key: 'harvest' });
  if (p.requires_cultivation) items.push({ key: 'cultivation' });
  if (p.requires_batch) items.push({ key: 'batch' });
  if (p.requires_used_area) items.push({ key: 'usedArea' });
  if (p.required_labor) items.push({ key: 'labor' });
  if (p.required_machines) items.push({ key: 'machines' });
  if (p.required_inputs) items.push({ key: 'inputs' });
  if (p.generates_production) items.push({ key: 'production' });
  if (p.requires_occurrence) items.push({ key: 'occurrence' });
  if (p.requires_signature) items.push({ key: 'signature' });
  if (p.min_photos > 0) items.push({ key: 'photos', count: p.min_photos });
  if (p.text_min > 0 || p.text_max > 0) items.push({ key: 'text', min: p.text_min, max: p.text_max });
  if (p.notify_on_finish) items.push({ key: 'notify' });
  return items;
}
