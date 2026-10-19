// src/constants/cadastrosBase/authorizer/rule-value-options.ts
// Opções do campo `rules[].value` do formulário de Autorizador
// (RequestAuthorizer — Cadastros Base / Pessoas). Fix cirúrgico (Lote 06 /
// esteira 089, ajuste F-141, pedido do dono): o legado
// (`agro365 RequestPurchase::types()`) oferece este campo como SELECT
// fechado, não texto livre — REUSA o enum canônico
// `requestPurchaseTypeOptions` (`@/constants/RequestPurchases/options/
// request-purchase-type-options`, já mirror 1:1 do backend, 11 valores) e
// acrescenta a opção `'all'` ("Todos"), exclusiva desta regra condicional
// (não existe em `RequestPurchaseType`).
//
// O valor SALVO/ENVIADO no payload continua sendo o CÓDIGO string cru
// ('all' | 'P' | 'S' | ...) — nunca um objeto `{label,value}` (a extração
// acontece no `onChange` do Select da própria tela, mesmo padrão já usado
// no campo-irmão `apply_on`).

import { requestPurchaseTypeOptions } from '@/constants/RequestPurchases/options/request-purchase-type-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const AUTHORIZER_RULE_VALUE_ALL = 'all' as const;

const options = (languageGB: LanguageDate): Option<string>[] => [
  {
    value: AUTHORIZER_RULE_VALUE_ALL,
    label: languageGB.requestAuthorizers.requestAuthorizer.form.rules.valueOptions.all,
  },
  ...requestPurchaseTypeOptions.options(languageGB),
];

export const authorizerRuleValueOptions = { options };
