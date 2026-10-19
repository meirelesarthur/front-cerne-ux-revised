// src/validations/schemas/BullSeedSeason/bull-seed-season-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único "Touros/Sêmen/Embrião"
// (BullSeedSeason — Operacional / Reprodução, 97-Esteiras/005, Tarefa 25),
// espelhando `BullSeedSeasonRequest::rules()` (contrato de API §6): `date`/
// `description`/`breeding_season_uuid` obrigatórios; `animals`/`products`
// SEM `.min(1)` (`GAP-BSS-06`, mirror exato — servidor aceita array vazio,
// paridade com o legado). Vive em `src/validations/schemas/BullSeedSeason/`
// (pasta pelo NOME DA ENTIDADE, NUNCA em `src/pages/`, mesma convenção dos
// irmãos `Requisitions`/`BreedingSeasons`).
//
// Cada LINHA dos 2 repetidores exige seleção quando a linha existe
// (`animal`/`product` `required`, mirror `RequisitionItemForm.stock_id`) —
// isso NÃO reintroduz `.min(1)` no array (uma linha vazia nunca é
// adicionada por padrão; o guard só impede submeter uma linha adicionada e
// deixada sem seleção). `warehouse` da linha de produto é OPCIONAL
// (`nullable`, armadilha 3 — armazém não é exigido no pivot).
// `products[].quantity` é OBRIGATÓRIO e `>= 0`, SEM checagem de estoque
// (`GAP-BSS-07`, paridade — a API também não valida saldo).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  BullSeedSeasonAnimalFieldValue,
  BullSeedSeasonProductFieldValue,
} from '@/@types/v2/BullSeedSeason';
import type Shape from '@/@types/validations/shape';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const bullSeedSeasonSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.bullSeedSeason.bullSeedSeason.form.validation;

  return yup.object({
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),

    description: yup.string().required(messages.descriptionRequired),

    breeding_season: optionSchema.required(messages.breedingSeasonRequired),

    // SEM `.min(1)` — `GAP-BSS-06`, mirror exato (servidor aceita vazio,
    // paridade com o legado). Cada linha JÁ adicionada exige seleção.
    animals: yup.array().of(
      yup.object().shape<Shape<BullSeedSeasonAnimalFieldValue>>({
        animal: optionSchema.required(messages.animalRequired),
      })
    ),

    // SEM `.min(1)` — `GAP-BSS-06`. `warehouse` OPCIONAL por linha
    // (armadilha 3); `product`/`quantity` obrigatórios quando a linha existe.
    products: yup.array().of(
      yup.object().shape<Shape<BullSeedSeasonProductFieldValue>>({
        warehouse: optionSchema,
        product: optionSchema.required(messages.productRequired),
        quantity: yup
          .number()
          .typeError(messages.quantityRequired)
          .min(0, messages.quantityMin)
          .required(messages.quantityRequired),
      })
    ),
  });
};

export const bullSeedSeasonSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(bullSeedSeasonSchema(languageGB)) as any;

export default bullSeedSeasonSchemaResolver;
