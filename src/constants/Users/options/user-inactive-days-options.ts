// src/constants/Users/options/user-inactive-days-options.ts
// Fábrica de opções do filtro `inactive_days` de User (contrato §3.5/Doc
// Bruta legada) — presets fixos em dias. `value: number | undefined` — a
// ASSINATURA de `getLabel`/`getOption` continua aceitando `undefined`
// (ausência de filtro, sem enviar `inactive_days` na querystring), mesmo
// racional de `type`/`is_enabled` opcionais de Marker. Mirror do padrão
// canônico `(languageGB) => Map`.
//
// CORREÇÃO (lote 3b, Execução 027 — achado do lote 2): os rótulos eram o
// número puro ('1', '7', '15', ...), mas o legado sempre escreve por
// extenso ("Mais de 1 dia", "Mais de 1 semana", ...) — fonte real:
// ../agro365/resources/views/users/index.blade.php:59-72 (os 7 presets
// numéricos batem 1:1 com os valores já usados aqui, nenhuma lacuna). Os
// VALORES numéricos não mudam, só o label — via `languageGB.users.user
// .filter.inactiveDaysOptions`.
//
// CORREÇÃO (Execução 030-C, runtime bug): o preset "Todos" tinha
// `value: undefined` DENTRO de `options()` — item sem `value` na collection
// do Chakra UI v3/zag-js estoura `[zag-js] No value found for item
// {"label":"Todos"}` ao abrir o Select (zag-js exige value definido em TODO
// item da collection, undefined não é chave válida). `options()` agora só
// devolve os 7 presets REAIS (1..365); "Todos" deixa de ser um item
// selecionável na lista e passa a ser representado só pelo placeholder
// (`filterText.inactiveDaysAll`, já usado em FilterSideUsuario.tsx) — MESMO
// mecanismo já em produção para `is_active`/`online`/`tenant_status` no
// mesmo arquivo (nenhum dos três tem item "Todos" na collection; o
// ClearTrigger do `<Select>` + placeholder já cobrem "sem filtro"). `getLabel`/
// `getOption` continuam aceitando `undefined` na assinatura — não há
// nenhuma chamada real com `undefined` hoje (só com presets definidos em
// `toInternalValues`), preservado por compatibilidade de tipo com o campo
// opcional `UserFilterForm.inactive_days`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const presets = [1, 7, 15, 30, 90, 180, 365] as const;

const labels = (languageGB: LanguageDate): Map<number | undefined, string> => {
  const text = languageGB.users.user.filter;
  return new Map([
    [undefined, text.inactiveDaysAll],
    [1, text.inactiveDaysOptions.oneDay],
    [7, text.inactiveDaysOptions.oneWeek],
    [15, text.inactiveDaysOptions.oneFortnight],
    [30, text.inactiveDaysOptions.oneMonth],
    [90, text.inactiveDaysOptions.oneQuarter],
    [180, text.inactiveDaysOptions.oneSemester],
    [365, text.inactiveDaysOptions.oneYear],
  ]);
};

const getLabel = (value: number | undefined, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: number | undefined,
  languageGB: LanguageDate
): Option<number | undefined> => ({
  label: getLabel(value, languageGB),
  value,
});

// Só os presets REAIS entram na collection do Select — "Todos" NÃO é mais
// um item (ver CORREÇÃO acima); permanece representado pelo placeholder.
const options = (languageGB: LanguageDate): Option<number | undefined>[] =>
  presets.map((value) => ({ label: getLabel(value, languageGB), value }));

export const userInactiveDaysOptions = { getLabel, getOption, options };
