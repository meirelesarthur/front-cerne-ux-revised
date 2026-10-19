// src/constants/Grazing/options/control-productivity-options.ts
// -----------------------------------------------------------------------------
// Options factory do campo booleano de negócio `control_productivity`
// (Grazing) — mirror do padrão `getLabel`/`getOption`/`options` de
// `@/constants/pecuaria/categoryAnimal/options/gender-options.ts`, mensagens
// derivadas de `languageGB`, nunca hardcoded.
//
// NÃO reaproveita a fábrica global `@/constants/options/boolean.ts`
// (Sim/Não genérico de `defaltStrings`) — `control_productivity` é um campo
// de NEGÓCIO com semântica própria (Grazing-FrontEnd-contrato.md §3: "NÃO
// reaproveita a fábrica global de `is_enabled` — semântica diferente"),
// textos vivem em `baseRegistrations.grazing.controlProductivityOptions`.
//
// Consumida por `TASK-GZ-FE-02` (Select do formulário) e por esta Tarefa
// (Badge da coluna `control_productivity` na listagem).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.baseRegistrations.grazing.controlProductivityOptions;
  return new Map<boolean, string>([
    [true, text.yes],
    [false, text.no],
  ]);
};

const getLabel = (controlProductivity: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(controlProductivity)!;

const getOption = (controlProductivity: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(controlProductivity, languageGB),
  value: controlProductivity,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const controlProductivityOptions = {
  getLabel,
  getOption,
  options,
};
