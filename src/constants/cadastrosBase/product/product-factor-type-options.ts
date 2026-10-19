// src/constants/cadastrosBase/product/product-factor-type-options.ts
// Fábrica de opções do enum `factor_type` (`App\Enums\FactorTypeEnum` —
// `M`=Multiplica/`D`=Divide) do trio `second_measurement_uuid`/`factor_type`/
// `factor` de Produtos (Aba 2, "Estoque e Financeiro", TASK-FE-504). Padrão
// canônico `(languageGB) => Map` + `options`, mirror
// `constants/cadastrosBase/account/account-status.ts` (`accountCnabOptions`)
// — Select via fábrica derivada da tradução, nunca lista literal.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const factorTypeLabels = (languageGB: LanguageDate): Map<'M' | 'D', string> =>
  new Map([
    ['M', languageGB.products.product.form.fields.factorTypeMultiply],
    ['D', languageGB.products.product.form.fields.factorTypeDivide],
  ]);

const factorTypeOptions = (languageGB: LanguageDate): Option<'M' | 'D'>[] =>
  Array.from(factorTypeLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const productFactorTypeOptions = { options: factorTypeOptions };
