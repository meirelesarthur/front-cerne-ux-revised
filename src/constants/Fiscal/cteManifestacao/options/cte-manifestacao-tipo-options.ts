// src/constants/fiscal/cteManifestacao/options/cte-manifestacao-tipo-options.ts
// Options/labels do campo `tipo` (mirror `App\Enums\CteManifestaTipo`) —
// fábrica canônica `(languageGB) => Map` (get_pwa_constants_and_mappers_pattern
// §3.2), mirror `cte-estado-options.ts`. i18n via `languageGB` — nunca o
// `tipo_label` PT-BR fixo devolvido pelo backend (mirror do padrão já usado
// para `estado`/`estadoOptions` de CT-e).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CteManifestacaoTipo } from '@/@types/v2/Fiscal/cteManifestacao';

const labels = (languageGB: LanguageDate): Map<CteManifestacaoTipo, string> =>
  new Map([
    [0, languageGB.cteManifestacoes.cteManifestacao.tipoOptions.pendente],
    [1, languageGB.cteManifestacoes.cteManifestacao.tipoOptions.desacordo],
  ]);

const getLabel = (value: CteManifestacaoTipo, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const options = (languageGB: LanguageDate): Option<CteManifestacaoTipo>[] =>
  Array.from(labels(languageGB), ([value, label]) => ({ label, value }));

export const cteManifestacaoTipoOptions = { getLabel, options };

export default cteManifestacaoTipoOptions;
