// src/validations/schemas/OpeningBalance/opening-balance-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de ESTOQUE INICIAL (OpeningBalance),
// Zonas 1-3 (TASK-FE-1043, execução 026). Composição via
// `fieldValidationSchema(languageGB)` (mirror `product-schema.ts`/
// `provider-schema.ts`) — NUNCA string literal; mensagens genéricas vêm de
// `languageGB.defaltStrings.validations.*` (via `v.option()`), mensagens
// específicas da entidade vêm de
// `languageGB.openingBalances.openingBalance.form.validation.*`.
//
// LOCALIZAÇÃO — pasta por módulo (`src/validations/schemas/OpeningBalance/`),
// divergência DELIBERADA da convenção `CadastrosBase/` usada por
// Product/Warehouse/CostCenter (instrução EXPLÍCITA do task-packet desta
// execução: "schema em src/validations/schemas/{Modulo}/ — NUNCA dentro de
// pages/"). Não é erro de reconciliação, é a Tarefa mandando um path
// diferente do resto do projeto.
//
// `product_uuid`/`warehouse_uuid` — `v.option<string>()` (Select/RHF,
// `{label,value}`), mensagem genérica já traduzida (mirror
// `measurement_uuid`/`group_uuid` de `product-schema.ts` — nenhum dos dois
// tem mensagem dedicada, mesmo padrão aqui).
//
// `quantity` — obrigatório e `> 0` (contrato de tela §6/Roteiro da Tarefa).
// `amount` — obrigatório NO FORK (Doc Bruta §5 registra como LACUNA que o
// legado aceita vazio; formalizar aqui é melhoria consciente, sem risco de
// regressão real porque `amount` é um campo que o próprio form usa para
// calcular Valor Total/Custo Médio — nunca fazia sentido ficar vazio na
// prática, mesmo o legado não validando).
//
// `provider_lot`/`expiration_date` — obrigatórios SE `product.has_lot` for
// `true` (Doc Bruta §5, `Rule::requiredIf`). `has_lot` é uma propriedade do
// PRODUTO selecionado, não um campo próprio do OpeningBalance — por isso não
// existe como campo irmão no `.when()` (diferente de `product-schema.ts`,
// onde `group_uuid` É um campo do próprio form). A tela injeta o valor via
// CONTEXTO do Yup (`useForm({ context: { hasLot } })`, RHF 7.51.2 relê o
// `context` a cada `trigger()`/`handleSubmit()` — não é capturado só na
// montagem) — `.when('$hasLot', ...)`, sintaxe de contexto (prefixo `$`),
// mirror do PADRÃO condicional já usado no projeto (`product-schema.ts`
// `.when('group_uuid', ...)`), adaptado porque aqui a condição não vive num
// campo submetido do próprio formulário.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const openingBalanceSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.openingBalances.openingBalance.form.validation;

  return (
    yup
      .object()
      .shape({
        product_uuid: v.option<string>(),
        warehouse_uuid: v.option<string>(),

        // Teto real = coluna física `stocks.quantity` numeric(10,2) (decisão
        // do dono) — NÃO `opening_balances` (maior, mas não é o teto
        // efetivo: o saldo inicial é persistido/consolidado em `stocks`).
        quantity: yup
          .number()
          .transform((value, original) =>
            original === '' || original === null ? undefined : value
          )
          .typeError(messages.quantityRequired)
          .required(messages.quantityRequired)
          .moreThan(0, messages.quantityMin)
          .max(99999999.99, messages.quantityMax),

        // Doc Bruta §5 lacuna — legado aceita vazio; fork formaliza (ver
        // cabeçalho do arquivo). `min(0, ...)` — permite zero (produto
        // recebido de graça/bonificação), só rejeita negativo. Teto real =
        // coluna física `stocks.total`/`average_cost` numeric(12,3) (decisão
        // do dono) — NÃO `opening_balances` (maior).
        amount: yup
          .number()
          .transform((value, original) =>
            original === '' || original === null ? undefined : value
          )
          .typeError(messages.amountRequired)
          .required(messages.amountRequired)
          .min(0, messages.amountMin)
          .max(999999999.999, messages.amountMax),

        // Zona 3, condicional a `has_lot` do produto selecionado (contexto Yup,
        // ver cabeçalho do arquivo) — mirror `Rule::requiredIf` do legado.
        provider_lot: yup
          .string()
          .trim()
          .nullable()
          .max(15, messages.providerLotMaxLength)
          .when('$hasLot', {
            is: true,
            then: (schema) => schema.required(messages.providerLotRequired),
          }),

        // `DateInput` do fork devolve/aceita string ISO `YYYY-MM-DD` (ou `null`)
        // — mesmo shape de `OpeningBalancePayload.expiration_date`, nunca um
        // objeto `Date`.
        expiration_date: yup
          .string()
          .nullable()
          .when('$hasLot', {
            is: true,
            then: (schema) => schema.required(messages.expirationDateRequired),
          }),
      })
      // Validação CRUZADA (decisão do dono) — `quantity * amount` (Valor
      // Total, campo computado/read-only na tela, NUNCA um campo próprio do
      // form) estoura o teto físico de `opening_balances.total_amount`
      // numeric(10,2) = 99.999.999,99 MESMO quando os 2 campos individuais
      // estão dentro dos próprios tetos (`stocks.quantity`/`stocks.total`
      // acima) — por isso precisa de um teste de objeto além dos `.max()`
      // de campo. Arrow function + `ctx.createError` (não `function(){...}`/
      // `this.parent`, evita `no-invalid-this` do ESLint do projeto — mesma
      // convenção de `advance-schema.ts`). Guard `Number.isFinite` evita
      // disparar junto com `required`/`typeError` de `quantity`/`amount`
      // (quando ausentes/NaN, a validação de campo já cobre). Anexado ao
      // path `amount` — reaproveita o MESMO mecanismo de exibição já ligado
      // (Controller `amount` → `fieldState.error?.message` → `NumberInput`
      // `error`), sem criar campo novo no form nem no tipo.
      .test('total-amount-max', messages.totalMax, (value: any, ctx) => {
        const quantity = Number(value?.quantity);
        const amount = Number(value?.amount);
        if (!Number.isFinite(quantity) || !Number.isFinite(amount)) return true;

        const roundedTotal = Math.round(quantity * amount * 100) / 100;
        if (roundedTotal > 99999999.99) {
          return ctx.createError({ path: 'amount', message: messages.totalMax });
        }
        return true;
      })
  );
};

export const openingBalanceSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(openingBalanceSchema(languageGB)) as any;

export default openingBalanceSchemaResolver;
