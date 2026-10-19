// src/validations/schemas/SaleContracts/sale-contract-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único de Contratos de Venda
// (Operacional / Agricultura, esteira 036, TASK-FE-036-203). Fábrica
// `(languageGB) => yupResolver(...)`, mirror mecânico de
// `contractSchemaResolver` (`src/validations/schemas/Contracts/contract-schema.ts`).
//
// Localização: `src/validations/schemas/SaleContracts/`, NUNCA em `pages/`.
//
// Mensagens 100% via `languageGB.saleContracts.saleContract.form.validation.*`,
// zero string literal.
//
// -- Correção de vazamento de `typeError` em inglês (mesmo fix já aplicado em
//    `contract-schema.ts`) -----------------------------------------------
// Sem `.nullable()`, o Yup dispara o `typeError` padrão em inglês ANTES do
// `.required()` mesmo com `transform()` já convertendo `''`/`null` para
// `null` — o `isType()` interno do Yup só aceita `null` como válido quando o
// schema está marcado `.nullable()`. Aplicado nos 4 campos numéricos
// (`quantity`/`bag_weight`/`price`/`funrural`): `.transform()` (cobre também
// `Number.isNaN`) + `.nullable()` + `.typeError()` reaproveitando a MESMA
// chave `*Required` (campo obrigatório não precisa de mensagem de tipo
// separada da de obrigatoriedade).
//
// -- `vl_funrural` NÃO entra neste schema — é campo local do bloco de
//    cálculo (`SaleContractCalculationFields`, TASK-FE-036-204), nunca parte
//    do `SaleContractPayload`/schema de submit (contrato §5.1). A regra de
//    "não pode exceder o total" é um guard de UX em tempo real dentro do
//    próprio componente de cálculo, não uma validação de submit do Yup.
//
// ⚠️ CÓDIGO-INCOMPLETO / suposição a confirmar (`GAP-036-201`, camada API —
// no momento desta implementação o Gap está `[AVALIADO]` mas sem a caixa de
// decisão marcada no arquivo): `delivery_place`/`payment_method` usam
// `max 191` (Opção A, recomendada pelo Arquiteto de API e default assumido
// pelo Arquiteto de Front — contrato de tela §3/TASK-FE-036-203). Se a
// decisão real registrada pelo dev tiver sido a Opção B (`max 250`), ajustar
// a constante abaixo e as 2 mensagens de erro correspondentes
// (`deliveryPlaceMaxLength`/`paymentMethodMaxLength` em
// `languageSaleContracts.ts`, os 3 idiomas).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

/** Ver nota "CÓDIGO-INCOMPLETO" de cabeçalho — default Opção A (191). */
export const SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH = 191;

export const saleContractSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.saleContracts.saleContract.form.validation;

  return yup.object({
    client_uuid: yup.mixed<Option<string> | null>().required(messages.clientRequired),
    product_uuid: yup.mixed<Option<string> | null>().required(messages.productRequired),
    harvest_uuid: yup.mixed<Option<string> | null>().required(messages.harvestRequired),
    number: yup.string().trim().required(messages.numberRequired).max(20, messages.numberMaxLength),
    date: yup.string().nullable().required(messages.dateRequired),
    quantity: yup
      .number()
      .typeError(messages.quantityRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.quantityRequired)
      .min(0.01, messages.quantityMin),
    bag_weight: yup
      .number()
      .typeError(messages.bagWeightRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.bagWeightRequired)
      .min(0, messages.bagWeightMin),
    price: yup
      .number()
      .typeError(messages.priceRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.priceRequired)
      .min(0.01, messages.priceMin),
    funrural: yup
      .number()
      .typeError(messages.funruralRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.funruralRequired)
      .min(0, messages.funruralMin),
    coin: yup.mixed<Option<string> | null>().required(messages.coinRequired),
    delivery_place: yup
      .string()
      .trim()
      .required(messages.deliveryPlaceRequired)
      .max(SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH, messages.deliveryPlaceMaxLength),
    payment_method: yup
      .string()
      .trim()
      .required(messages.paymentMethodRequired)
      .max(SALE_CONTRACT_TEXT_FIELD_MAX_LENGTH, messages.paymentMethodMaxLength),
    delivery_start_date: yup.string().nullable().required(messages.deliveryStartDateRequired),
    delivery_end_date: yup
      .string()
      .nullable()
      .required(messages.deliveryEndDateRequired)
      // Testador recebe `(value, context)` — usar o 2º argumento em vez de
      // `this` (yup 0.32 faz `test.call(ctx, value, ctx)`, mas ler via
      // parâmetro evita o `this` solto que o lint (`no-invalid-this`,
      // preset `google`) rejeita fora de método de classe/objeto).
      .test('delivery-end-after-start', messages.deliveryEndDateBeforeStart, (value, context) => {
        const deliveryStartDate = context.parent?.delivery_start_date;
        if (!value || !deliveryStartDate) return true;
        return value >= deliveryStartDate;
      }),
    payment_date: yup.string().nullable().required(messages.paymentDateRequired),
    note: yup.string().nullable().max(250, messages.noteMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const saleContractSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleContractSchema(languageGB));

export default saleContractSchemaResolver;
