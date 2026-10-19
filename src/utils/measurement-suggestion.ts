// src/utils/measurement-suggestion.ts
// -----------------------------------------------------------------------------
// Sugestão de `measurement_uuid` a partir do texto CRÚ da unidade extraída de
// um XML de NFe (`item.um`, fuzzy/exato contra a sigla de `Measurement.name`).
// EXTRAÍDO de `CreateOrUpdateInvoice.tsx` (TASK-FE-653/GAP-BE-630, DF-13) —
// TASK-FE-668 (DF-25, execução 034) reaproveita a MESMA função no prefill do
// Modal "Criar Produto a partir do XML" (`CreateProductFromXmlModal.tsx`),
// que precisa da MESMA heurística fora do handler original — módulo
// compartilhado em vez de duplicar a lógica (decisão registrada no
// task-packet: "NÃO inventar 2ª heurística").
//
// SEM auto-resolução server-side (o legado também nunca resolve `um` contra
// `Measurement`, só exibe a string para o usuário confirmar). Nunca força
// quando não casa — devolve `null`, campo continua exigindo escolha manual.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { MeasurementOption } from '@/@types/v2/Measurements';

export function suggestMeasurementOption(
  um: string,
  options: MeasurementOption[]
): Option<string> | null {
  const normalized = um.trim().toUpperCase();
  if (!normalized || options.length === 0) return null;

  const exactByName = options.find((option) => option.name.trim().toUpperCase() === normalized);
  if (exactByName) return { label: exactByName.description, value: exactByName.uuid };

  const fuzzyByDescription = options.find((option) => {
    const description = option.description.trim().toUpperCase();
    return description === normalized || description.startsWith(normalized);
  });
  return fuzzyByDescription
    ? { label: fuzzyByDescription.description, value: fuzzyByDescription.uuid }
    : null;
}
