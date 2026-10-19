// src/constants/cadastrosBase/provider/options/pix-type-options.ts
// Fábrica de opções do enum `pix_type` (`App\Enums\PixType`, 0-3) — mesmo
// padrão canônico de `provider-type-options.ts`
// (get_pwa_constants_and_mappers_pattern §3.2), TASK-PR-FE-04.
//
// `getOption` aceita `null`/`undefined` (campo `sometimes|nullable`, aba
// "Conta" nunca obriga preenchimento) — devolve `null` em vez de lançar,
// para uso direto em `fillForm` sem `data.pix_type != null ? ... : null`
// espalhado pela tela.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { pixType, PixType } from '../pix-type';

const labels = (languageGB: LanguageDate): Map<PixType, string> =>
  new Map([
    [pixType.cpfCnpj, languageGB.providers.provider.pixTypeOptions.cpfCnpj],
    [pixType.email, languageGB.providers.provider.pixTypeOptions.email],
    [pixType.phone, languageGB.providers.provider.pixTypeOptions.phone],
    [pixType.random, languageGB.providers.provider.pixTypeOptions.random],
  ]);

const getLabel = (value: PixType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

// Aceita `number` cru (não só o literal `PixType`) — `ProviderDetail.pix_type`
// vem da API como `number | null` (Resource não devolve o backed enum
// tipado), e o TS não estreita automaticamente para a union 0|1|2|3.
const getOption = (
  value: number | null | undefined,
  languageGB: LanguageDate
): Option<PixType> | null =>
  value == null ? null : { label: getLabel(value as PixType, languageGB), value: value as PixType };

const options = (languageGB: LanguageDate): Option<PixType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const pixTypeOptions = { getLabel, getOption, options };
