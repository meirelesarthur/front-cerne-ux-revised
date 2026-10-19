// src/constants/rastreabilidade/traceability-config/default-values.ts
// -----------------------------------------------------------------------------
// `traceabilityConfigFormDefaultValues` — defaults do formulário de
// Configuração (TraceabilityConfig, F-067, TASK-TR-FE-09), 11 campos reais do
// RHF (`TraceabilityConfigForm`, TASK-TR-FE-01) — `farm_id` NÃO é campo
// (resolvido no servidor via `FarmContext`, ver divergência documentada em
// `@types/v2/Rastreabilidade/traceability-config/index.d.ts`); `image`/
// `remove_image` (logo) ficam FORA do RHF, tratados por estado local do
// componente de upload (mirror `traceability/default-values.ts`).
// -----------------------------------------------------------------------------

import type { TraceabilityConfigForm } from '@/@types/v2/Rastreabilidade/traceability-config';

export const traceabilityConfigFormDefaultValues: TraceabilityConfigForm = {
  proprietary_uuid: null,
  name: '',
  cpf_cnpj: '',
  address: '',
  number: '',
  district: '',
  city_uuid: null,
  phone: '',
  email: '',
  whatsapp_fone: '',
  whatsapp_texto: '',
};

export default traceabilityConfigFormDefaultValues;
