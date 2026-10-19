// src/validations/schemas/Invoices/invoice-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Invoice (Doc. Fiscal/Entrada) —
// TASK-FE-2761. Resolver ÚNICO cobrindo cabeçalho + itens + parcelamento +
// rateio — 1 `useForm` raiz (`CreateOrUpdateInvoice.tsx`, TASK-FE-2763)
// consome este schema para as 4 abas de uma vez, mesmo achado já registrado
// em `equipment-schema.ts` (formulário com abas compartilha 1 resolver só).
//
// 2 validações de soma de nível de ARRAY (mirror `.test('cost-center-sum-100',
// ...)` de `equipment-schema.ts`, tolerância `0.01`):
//   - `categories` (rateio) — soma de `percentage` deve fechar 100 (alvo
//     FIXO, sem dependência de outro campo do form).
//   - `installments` (parcelamento) — soma de `value` deve fechar o
//     `vl_total` CALCULADO no client (`vl_items + vl_freight + vl_ipi -
//     vl_discount + vl_safe + vl_expense`, mesma fórmula de
//     `InvoiceItemsTab.tsx`/`InvoiceInstallmentsTab.tsx`) — alvo VARIÁVEL,
//     lido via `this.parent` (Yup `test(function(value) {...})`, soma
//     cruzada entre 2 arrays + 4 campos escalares do mesmo objeto raiz).
//     Tolerância acumulada: `0.01 × count(installments)` (arredondamento de
//     centavos por parcela, decisão de implementação desta Tarefa).
//
// `items.*.appropriation_type` é OPCIONAL (nullable, efeito condicionado a
// GAP-528) — SEM `.required()`. `categories`/`installments` são
// OBRIGATÓRIOS no nível de ARRAY (`min:1`, o backend bloqueia store sem
// isso) — cada linha individual segue as regras normais de campo obrigatório
// dentro da linha.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** Tolerância de soma do rateio — mirror EXATO de `COST_CENTER_SUM_TOLERANCE`
 *  de `equipment-schema.ts`. */
const APPORTIONMENT_SUM_TOLERANCE = 0.01;
const APPORTIONMENT_SUM_TARGET = 100;

/** Tolerância acumulada de arredondamento de centavos das parcelas — 1
 *  centavo por linha (mesma unidade de `APPORTIONMENT_SUM_TOLERANCE`, mas
 *  escalada pelo número de parcelas, decisão registrada no cabeçalho). */
const INSTALLMENTS_SUM_TOLERANCE_PER_ROW = 0.01;

type ApportionmentRowShape = {
  category_uuid?: unknown;
  percentage?: number;
};

type InstallmentRowShape = {
  due_date?: string | null;
  value?: number;
};

type ItemRowShape = {
  quantity?: number;
  amount?: number;
  discount?: number;
  category_uuid?: unknown;
  center_uuid?: unknown;
};

export const invoiceSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.invoices.invoice.form.validation;

  const itemRowSchema = yup.object({
    product_uuid: v.option<string>().required(messages.productRequired),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityRequired)
      .required(messages.quantityRequired)
      .moreThan(0, messages.quantityMin),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.amountRequired)
      .required(messages.amountRequired)
      .min(0, messages.amountRequired),
    // TASK-FE-624 (DF-04) — preview client-side, NUNCA enviado no payload
    // (o servidor sempre recalcula `quantity × amount`, ignora o valor
    // enviado); sem `.required()` — só numérico/não-negativo quando
    // preenchido.
    total_amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    // TASK-FE-622 (DF-07) — Armazém obrigatório quando "Gera estoque?" =
    // Sim, mirror EXATO da técnica `.when()` já usada abaixo para
    // `equipment` (`is_equipment===true`). Legado: `_card-item.blade.php:
    // 667-680` (`$warehouse.prop('required', value == '1')`).
    warehouse_uuid: yup
      .mixed()
      .nullable()
      .when('generates_stock', {
        is: true,
        then: (schema) => schema.required(messages.warehouseRequiredWhenGeneratesStock),
      }),
    center_uuid: yup.mixed().nullable(),
    category_uuid: yup.mixed().nullable(),
    cultivation_uuid: yup.mixed().nullable(),
    measurement_uuid: yup.mixed().nullable(),
    generates_stock: yup.boolean().default(false),
    // TASK-FE-627 (DF-09) — sinal client-only (mirror `generates_stock`),
    // precisa estar no schema para não ser descartado pelo `yupResolver`
    // e sobreviver ao ciclo validate→reset em modo edição.
    has_lot: yup.boolean().default(false),
    is_equipment: yup.boolean().default(false),
    provider_lot: yup.string().trim().nullable(),
    shelf_life: yup.string().nullable(),
    ipi: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    icms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    // Opcional — efeito condicionado a GAP-528 (só o ramo Agrícola é
    // funcional no backend); SEM `.required()`.
    appropriation_type: yup.mixed().nullable(),
    // TASK-FE-629/630/631 (DF-10, execução 035) — expandido de 5 para 24
    // campos (GAP-BE-623/TASK-BE-623, `InvoiceRequest::rules()` real). Os 5
    // campos ORIGINAIS mantêm a obrigatoriedade condicional já existente
    // (`.when('is_equipment', ...)` abaixo, inalterada). Os ~19 NOVOS ficam
    // no nível BASE do objeto (aplicam-se independente de `is_equipment`,
    // mas só têm efeito prático quando o bloco está visível) — SEM
    // `.required()`/`required_if` inventado: o backend real (divergência
    // registrada no Histórico de `TASK-BE-623`) relaxou `equipment_type`/
    // `year_mod`/`has_depreciation`/`depreciation_type` para `nullable`
    // puro (evita quebrar retrocompatibilidade sem os 19 campos) — a ÚNICA
    // exceção é `residual`, condicional a `depreciation_type===COM_RESIDUAL`
    // (`Rule::requiredIf` confirmado ao vivo pelo Executor API, mirror EXATO
    // de `equipment-schema.ts`). Tamanhos máximos mirram 1:1
    // `EquipmentPayload`/`equipment-schema.ts` (mesmas colunas físicas).
    equipment: yup
      .object({
        family_equipment_uuid: v.option<string>().nullable(),
        description: yup.string().trim().nullable(),
        vl_time_productive: yup.number().nullable(),
        vl_acquisition: yup.number().nullable(),
        status: yup.mixed().nullable(),
        proprietary_uuid: v.option<string>().nullable(),
        hour_meter: yup
          .number()
          .transform((value, original) => (original === '' || original === null ? null : value))
          .nullable()
          .min(0),
        year_mod: yup.string().trim().nullable().max(10, messages.equipmentYearModMaxLength),
        brand: yup.string().trim().nullable(),
        patrimony: yup.string().trim().nullable().max(40, messages.equipmentPatrimonyMaxLength),
        chassi: yup.string().trim().nullable().max(17, messages.equipmentChassiMaxLength),
        renavam: yup.string().trim().nullable().max(11, messages.equipmentRenavamMaxLength),
        serie: yup.string().trim().nullable().max(40, messages.equipmentSerieMaxLength),
        // UT-000787: formato de placa só quando preenchida.
        plate: yup
          .string()
          .trim()
          .nullable()
          .max(10, messages.equipmentPlateMaxLength)
          .test(
            'plate-format',
            languageGB.defaltStrings.validations.plateInvalid,
            (value) => !value || isValidPlate(value)
          ),
        uf: yup.mixed().nullable(),
        color: yup.string().trim().nullable().max(10, messages.equipmentColorMaxLength),
        model: yup.string().trim().nullable().max(30, messages.equipmentModelMaxLength),
        has_depreciation: yup.boolean().nullable(),
        depreciation_type: yup.number().nullable(),
        // `required_if depreciation_type===COM_RESIDUAL(1)` — mirror EXATO
        // de `equipment-schema.ts` (`FamilyEquipmentDepreciationType.
        // COM_RESIDUAL`), único campo condicional-obrigatório dos 19 novos.
        residual: yup
          .number()
          .transform((value, original) => (original === '' || original === null ? null : value))
          .nullable()
          .min(0)
          .max(100)
          .when('depreciation_type', {
            is: FamilyEquipmentDepreciationType.COM_RESIDUAL,
            then: (schema) => schema.required(messages.equipmentResidualRequiredWithResidualType),
          }),
        life_bens: yup
          .number()
          .transform((value, original) => (original === '' || original === null ? null : value))
          .nullable()
          .min(0),
        dt_acquisition: yup.mixed().nullable(),
        specification: yup
          .string()
          .trim()
          .nullable()
          .max(200, messages.equipmentSpecificationMaxLength),
      })
      .nullable()
      // `equipment` só é obrigatório quando `is_equipment===true`
      // (`items.*.equipment` `required_if` no `InvoiceRequest` real).
      .when('is_equipment', {
        is: true,
        then: (schema) =>
          schema.shape({
            family_equipment_uuid: v.option<string>().required(messages.itemsRequired),
            description: yup.string().trim().required(messages.itemsRequired),
            vl_time_productive: yup
              .number()
              .transform((value, original) =>
                original === '' || original === null ? undefined : value
              )
              .required(messages.itemsRequired),
            vl_acquisition: yup
              .number()
              .transform((value, original) =>
                original === '' || original === null ? undefined : value
              )
              .required(messages.itemsRequired),
            status: yup.mixed().required(messages.itemsRequired),
          }),
      }),
    // TASK-FE-625/DF-05 (GAP-BE-621) — "Cultura" do bloco Apropriação
    // Agrícola, mesmo nullable dos 3 irmãos (backend não documenta nenhum
    // dos 4 como `required` em `InvoiceRequest::rules()` — autoridade final
    // de negócio continua o 422 do servidor).
    aprop_cultivation_uuid: yup.mixed().nullable(),
    aprop_area_uuid: yup.mixed().nullable(),
    aprop_operation_uuid: yup.mixed().nullable(),
    aprop_activity_uuid: yup.mixed().nullable(),
  });

  const installmentRowSchema = yup.object({
    due_date: yup.string().nullable().required(messages.dueDateRequired),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.valueRequired)
      .required(messages.valueRequired)
      .moreThan(0, messages.valueRequired),
  });

  const apportionmentRowSchema = yup.object({
    category_uuid: v.option<string>().required(messages.categoryRequired),
    percentage: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.percentageRequired)
      .required(messages.percentageRequired)
      .min(0, messages.percentageMax100)
      .max(100, messages.percentageMax100),
    center_uuid: v.option<string>().required(messages.centerRequired),
  });

  return yup.object({
    // -- Aba "Cabeçalho" --
    number: yup.string().trim().required(messages.numberRequired).max(15),
    series: yup.string().trim().required(messages.seriesRequired).max(3),
    dt_emission: yup.string().nullable().required(messages.dtEmissionRequired),
    delivery_date: yup.string().nullable(),
    provider_uuid: v.option<string>().required(messages.providerRequired),
    proprietary_uuid: v.option<string>().required(messages.proprietaryRequired),
    state_uuid: v.option<string>().required(messages.stateRequired),
    type_title_uuid: v.option<string>().required(messages.typeTitleRequired),
    conveyor: yup.string().trim().nullable().max(40),
    type: v.option<number>().required(messages.typeRequired),
    classification: yup.mixed().nullable(),
    apportionment_type: v.option<string>().required(messages.apportionmentTypeRequired),
    harvest_uuid: yup.mixed().nullable(),
    note: yup.string().trim().nullable(),
    state_registration: yup.string().trim().nullable().max(191),
    // TASK-FE-628 (DF-03) — client-only, seedado pelo import de XML (ver
    // nota de `InvoicePayload.chave`); sem UI/validação própria (nunca
    // digitado manualmente, `max:44` já é garantia do backend).
    chave: yup.string().nullable(),
    vl_freight: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    vl_safe: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    vl_expense: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    vl_ipi: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    vl_discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),

    // -- Aba "Itens & Totais" --
    // TASK-FE-687 (DF-29) — quando "Tipo Rateio" (`apportionment_type`, campo
    // do OBJETO RAIZ) = Por Produto (`'P'`), Categoria Financeira + Centro de
    // Custo de CADA item ficam obrigatórios (mirror legado, `_forms.blade.
    // php:514-525`). `.test()` no campo-array RAIZ (mesma técnica já usada
    // acima para a soma de `categories`/`installments`, que lê `context.
    // parent` para alcançar outros campos do mesmo objeto) — reprova se
    // algum item não tiver os 2 campos preenchidos.
    items: yup
      .array()
      .of(itemRowSchema)
      .min(1, messages.itemsRequired)
      .default([])
      .test(
        'items-category-required-when-apportionment-product',
        messages.itemCategoryRequiredWhenApportionmentProduct,
        (rows: ItemRowShape[] | undefined, context: yup.TestContext) => {
          const parent = context.parent as {
            apportionment_type?: { value?: string } | null;
          };
          if (parent?.apportionment_type?.value !== 'P') return true;
          return (rows ?? []).every((row) => Boolean(row?.category_uuid));
        }
      )
      .test(
        'items-center-required-when-apportionment-product',
        messages.itemCenterRequiredWhenApportionmentProduct,
        (rows: ItemRowShape[] | undefined, context: yup.TestContext) => {
          const parent = context.parent as {
            apportionment_type?: { value?: string } | null;
          };
          if (parent?.apportionment_type?.value !== 'P') return true;
          return (rows ?? []).every((row) => Boolean(row?.center_uuid));
        }
      ),

    // -- Aba "Parcelamento" — soma = vl_total calculado no client --
    // ⚠️ `installments`/`categories` são WRITE-ONLY (o backend NUNCA devolve
    // o rateio/parcelamento persistido, e `UpdateInvoiceAction` os IGNORA no
    // PUT — Contas a Pagar imutáveis pós-criação, `InvoiceRequest::rules()`
    // usa `sometimes` em vez de `required` para os 2 arrays na edição). Por
    // isso a obrigatoriedade de array (`min:1`) e as somas de validação SÓ
    // se aplicam em CRIAÇÃO (`context.options.context.isEditing !== true`) —
    // em edição essas 2 abas ficam informativas/desabilitadas
    // (`CreateOrUpdateInvoice.tsx`) e o form nunca preenche essas arrays.
    //
    // Arrow function (não `function`) + `context.parent`/`context.options.
    // context` — mesma técnica de `parameterWeights-schema.ts`
    // (`gt-initial-weight`), evita `no-invalid-this` do eslint do projeto.
    installments: yup
      .array()
      .of(installmentRowSchema)
      .default([])
      .test(
        'installments-required-on-create',
        messages.installmentsRequired,
        (rows: InstallmentRowShape[] | undefined, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          if (isEditing) return true;
          return (rows?.length ?? 0) >= 1;
        }
      )
      .test(
        'installments-sum-total',
        messages.installmentsSum,
        (rows: InstallmentRowShape[] | undefined, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          if (isEditing) return true;

          const parent = context.parent as {
            items?: ItemRowShape[];
            vl_freight?: number;
            vl_ipi?: number;
            vl_discount?: number;
            vl_safe?: number;
            vl_expense?: number;
          };

          const filled = (rows ?? []).filter(
            (row: InstallmentRowShape) => row?.value !== undefined && row?.value !== null
          );
          if (filled.length === 0) return true;

          const items = parent.items ?? [];
          // TASK-FE-624 (DF-04) — `total_amount` do item = `quantity × amount`,
          // SEM desconto (contrato §9 regra 1, confirmado 100% FE pelo
          // Arquiteto API na execução 035; formula MESMA de
          // `InvoiceItemsTab.tsx#computeVlItems`, sem 2ª fonte divergente).
          const vlItems = items.reduce((total: number, item) => {
            const quantity = Number(item?.quantity) || 0;
            const amount = Number(item?.amount) || 0;
            return total + quantity * amount;
          }, 0);
          const vlTotalTarget =
            vlItems +
            (Number(parent.vl_freight) || 0) +
            (Number(parent.vl_ipi) || 0) -
            (Number(parent.vl_discount) || 0) +
            (Number(parent.vl_safe) || 0) +
            (Number(parent.vl_expense) || 0);

          const sum = filled.reduce(
            (total: number, row: InstallmentRowShape) => total + (Number(row?.value) || 0),
            0
          );
          const tolerance = INSTALLMENTS_SUM_TOLERANCE_PER_ROW * Math.max(filled.length, 1);
          return Math.abs(sum - vlTotalTarget) <= tolerance;
        }
      ),

    // -- Aba "Rateio" — soma = 100% (alvo fixo). WRITE-ONLY — ver nota acima
    // de `installments`, mesmo racional (`context.options.context.isEditing`).
    categories: yup
      .array()
      .of(apportionmentRowSchema)
      .default([])
      .test(
        'categories-required-on-create',
        messages.categoriesRequired,
        (rows: ApportionmentRowShape[] | undefined, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          if (isEditing) return true;
          return (rows?.length ?? 0) >= 1;
        }
      )
      .test(
        'categories-sum-100',
        messages.categoriesPercentageSum100,
        (rows: ApportionmentRowShape[] | undefined, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          if (isEditing) return true;

          const filled = (rows ?? []).filter((row: ApportionmentRowShape) => !!row?.category_uuid);
          if (filled.length === 0) return true;

          const sum = filled.reduce(
            (total: number, row: ApportionmentRowShape) => total + (Number(row?.percentage) || 0),
            0
          );
          return Math.abs(sum - APPORTIONMENT_SUM_TARGET) <= APPORTIONMENT_SUM_TOLERANCE;
        }
      ),
  });
};

export const invoiceSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(invoiceSchema(languageGB));

export default invoiceSchemaResolver;
