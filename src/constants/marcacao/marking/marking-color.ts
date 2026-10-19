// src/constants/marcacao/marking/marking-color.ts
// -----------------------------------------------------------------------------
// Catálogo estático das 16 cores do campo `markings.color` — LACUNA da
// arquitetura (`ARCHITECTURE-MARCACAO-FE.md`, `EVD-MODEL-COLORS`) resolvida
// por leitura DIRETA da fonte real, conforme instruído: `TASK-MC-01` (API)
// JÁ MATERIALIZOU `App\Enums\MarkingColorEnum` nesta sessão — os 16 hex/label
// abaixo são copiados EXATAMENTE dele (que por sua vez é mirror confirmado de
// `App\Marking::colors()` legado, `agro365/app/Marking.php:96-122`). NENHUM
// valor foi fabricado.
//
// Case preservado EXATO do backend (3 valores em maiúsculas: `#FF99FF`/
// `#FF69B4`/`#FBE7A1`/`#00008B`/`#003366` — 5, não 3, conferir enum real).
// `MarkingRequest::rules()` valida `color` via `Rule::enum(MarkingColorEnum)`
// — o front NUNCA deve normalizar o case ao montar o payload.
//
// `labelKey` referencia uma chave de `languageGB.marcacao.marking.colors.*`
// (mirror `get_pwa_constants_and_mappers_pattern §3.2` — nenhum label
// hardcoded fora da tradução).
// -----------------------------------------------------------------------------

export const markingColorCatalog = [
  { hex: '#ffee58', labelKey: 'amarelo' },
  { hex: '#81d4fa', labelKey: 'azulClaro' },
  { hex: '#e0e0e0', labelKey: 'branco' },
  { hex: '#a1887f', labelKey: 'marrom' },
  { hex: '#212121', labelKey: 'preto' },
  { hex: '#ec407a', labelKey: 'rosa' },
  { hex: '#8e24aa', labelKey: 'roxo' },
  { hex: '#4caf50', labelKey: 'verde' },
  { hex: '#d32f2f', labelKey: 'vermelho' },
  { hex: '#FF99FF', labelKey: 'rosaClaro' },
  { hex: '#FF69B4', labelKey: 'rosaPink' },
  { hex: '#FBE7A1', labelKey: 'palha' },
  { hex: '#00008B', labelKey: 'azulEscuro' },
  { hex: '#003366', labelKey: 'azulMarinho' },
  { hex: '#f75900', labelKey: 'laranja' },
  { hex: '#0072c0', labelKey: 'azulRoyal' },
] as const satisfies ReadonlyArray<{ hex: string; labelKey: string }>;

export type MarkingColorLabelKey = (typeof markingColorCatalog)[number]['labelKey'];
