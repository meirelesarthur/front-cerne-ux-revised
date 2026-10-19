// src/validations/schemas/ModuleWeighing/create-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup de Criar/Editar (FE-SCR-02, `TASK-MWG-FE-03`) — corpo real:
// formaliza (client-side, paridade com o legado) os grupos aplicáveis de
// `GAP-PES-10` que fazem sentido nesta tela (a Tarefa NÃO adiciona regra de
// negócio nova além do que o legado já validava — `DECISOES-DONO.md`:
// "aplicar somente as guardas de segurança/tenant; não adicionar validações
// de regra de negócio novas que rejeitem entradas que o legado aceitava").
//
// Grupos cobertos aqui:
//  - `allowed_type_category_pair` — combinação `type`×`category` válida.
//  - `client_id_requirement` — `client_uuid` obrigatório quando
//    `category=Externa` e `type∈{VendaSaida,EntradaTerceiros}` (IG-005).
//  - `provider_buy_id_requirement` — `provider_buy_uuid` obrigatório quando
//    `category=Externa` e `type=CompraEntrada`.
//  - `farm_to_id_requirement` — `farm_to_uuid` obrigatório quando
//    `category=Interna`.
//  - Lote/validade obrigatórios quando o produto selecionado tem
//    `has_lot=true` (IG-009) — via `context` injetado no `resolver`
//    (`hasProductLot`), não um campo do próprio form.
//
// Mensagens sempre via `languageGB.moduleWeighing.moduleWeighing.create.*`
// (nunca string dura), mirror `farmSchema`/`farmSchemaResolver`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { moduleWeighingCategory } from '@/constants/ModuleWeighing/module-weighing-category';
import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';

import type { LanguageDate } from '@/@types/language';

export const moduleWeighingCreateSchema = (languageGB: LanguageDate) => {
  const text = languageGB.moduleWeighing.moduleWeighing.create.validation;

  const optionSchema = yup
    .object({ value: yup.string().required(), label: yup.string().required() })
    .nullable();

  return yup.object({
    date: yup.string().required(text.requiredField),
    product: optionSchema.required(text.requiredField),
    // Correção 050 (D5) — `measurement` volta a ser obrigatório no front,
    // mirror `_forms.blade:60` + `Controller.php:593` (o legado exige em
    // form E em `rules()` server-side; a obrigatoriedade havia se perdido
    // nos 2 lados — GAP-PES-10 §Exceção).
    measurement: optionSchema.required(text.requiredField),
    area: optionSchema.nullable().defined(),
    type: yup.number().required(text.requiredField),
    category: yup.string().required(text.requiredField),

    // `warehouse` — obrigatório, EXCETO `type=Avulsa` (IG-001, campo
    // readonly/não-obrigatório nesse caso — a tela também trava a edição).
    warehouse: optionSchema.nullable().when('type', {
      is: (type: number) => type !== moduleWeighingType.avulsa,
      then: (schema) => schema.required(text.requiredField),
      otherwise: (schema) => schema.nullable(),
    }),

    equipment: optionSchema.required(text.requiredField),
    provider: optionSchema.required(text.requiredField),

    // Grupo #5 (IG-005) — `client_uuid` obrigatório quando
    // `category=Externa` e `type∈{VendaSaida,EntradaTerceiros}`.
    client: optionSchema.when(['category', 'type'], {
      is: (category: string, type: number) =>
        category === moduleWeighingCategory.externa &&
        (type === moduleWeighingType.vendaSaida || type === moduleWeighingType.entradaTerceiros),
      then: (schema) => schema.required(text.clientRequired),
      otherwise: (schema) => schema.nullable(),
    }),

    // Grupo #6 — `provider_buy_uuid` obrigatório quando `category=Externa` e
    // `type=CompraEntrada`.
    providerBuy: optionSchema.when(['category', 'type'], {
      is: (category: string, type: number) =>
        category === moduleWeighingCategory.externa && type === moduleWeighingType.compraEntrada,
      then: (schema) => schema.required(text.providerBuyRequired),
      otherwise: (schema) => schema.nullable(),
    }),

    // Grupo #7 — `farm_to_uuid` obrigatório quando `category=Interna`.
    farmTo: optionSchema.when('category', {
      is: (category: string) => category === moduleWeighingCategory.interna,
      then: (schema) => schema.required(text.farmToRequired),
      otherwise: (schema) => schema.nullable(),
    }),

    hasClassification: yup.boolean().required(),
    discountTable: optionSchema.nullable().defined(),

    providerLot: yup.string().nullable().defined(),
    // Correção 050 (D2) — `lot` REMOVIDO do schema: não é campo de form no
    // legado (`uniqid()` gerado no servidor, `Controller.php:306,935`) — o
    // backend passa a gerá-lo (mirror `CreateModuleWeighingAction`), nunca
    // mais a partir do payload. `providerLot` continua sendo o único campo
    // de lote do usuário (IG-009).
    expirationDate: yup.string().when('$hasProductLot', {
      is: true,
      then: (schema) => schema.required(text.expirationDateRequired),
      otherwise: (schema) => schema.nullable(),
    }),
    note: yup.string().nullable().defined(),
  });
};

export const moduleWeighingCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(moduleWeighingCreateSchema(languageGB)) as any;
