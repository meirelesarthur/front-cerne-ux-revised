// src/validations/schemas/CadastrosBase/parameter-animal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Parâmetros Animais" (ParameterAnimal —
// Cadastros Base / Pecuários), espelhando `AnimalParameterRequest::rules()`
// v1.1 (`animal-parameter-contrato.md` §3, M4/GAP-475). Vive em
// `src/validations/schemas/` (NÃO em `pages/`) — mirror EXATO estrutural de
// `category-animal-schema.ts` (FUNÇÃO que recebe `languageGB` e devolve o
// schema); os schemas antigos em `pages/CadastrosBase/ParameterAnimals/` são
// um DESVIO pré-canonização, descartados no lote que regenera a tela
// (TASK-FE-1078/1079) — não clonados aqui.
//
// Mensagens SEMPRE derivadas da tradução do módulo
// (`languageGB.parameterAnimals.parameterAnimal.form.validation`) — nunca
// string literal, mesma disciplina de `categoryAnimalSchema`/`breedSchema`.
//
// Os 6 campos de negócio são TODOS `required` no contrato v1.1 (M4/GAP-475,
// restaura fidelidade ao legado) — diferente do código atual da tela antiga,
// que os tinha `nullable`. `code` NÃO entra neste schema (somente leitura,
// auto-gerado pelo servidor — RN-1, nunca input de criação/edição).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const parameterAnimalSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.parameterAnimals.parameterAnimal.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(255, messages.descriptionMaxLength),
    // FK obrigatórias — guardam o `Option` completo (SelectAsyncPaginate).
    employee_uuid: yup.mixed().required(messages.employeeRequired),
    // TASK-FE-1088 — Espécie é `required` SÓ NO FORM (filtra a Categoria,
    // Doc Bruta `_forms.blade.php:28`); `parameter_animals` não tem coluna
    // de espécie, então este campo NUNCA entra no payload (ver
    // `ParameterAnimalForm`/`tryPersistParameterAnimal`).
    specie_uuid: yup.mixed().required(messages.specieRequired),
    category_uuid: yup.mixed().required(messages.categoryRequired),
    // Campos numéricos obrigatórios (contrato v1.1 §3: `required|numeric`).
    feeding_area: yup
      .number()
      .nullable()
      .required(messages.feedingAreaRequired)
      .typeError(messages.feedingAreaRequired),
    water_consumption: yup
      .number()
      .nullable()
      .required(messages.waterConsumptionRequired)
      .typeError(messages.waterConsumptionRequired),
    ms_consumption: yup
      .number()
      .nullable()
      .required(messages.msConsumptionRequired)
      .typeError(messages.msConsumptionRequired),
    average_weight: yup
      .number()
      .nullable()
      .required(messages.averageWeightRequired)
      .typeError(messages.averageWeightRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const parameterAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(parameterAnimalSchema(languageGB));

export default parameterAnimalSchemaResolver;
