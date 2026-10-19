// src/validations/schemas/CadastrosBase/category-animal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Categorias Animais" (CategoryAnimal —
// Cadastros Base / Pecuários, execução 025, TASK-FE-540), espelhando
// `CategoryAnimalRequest::rules()` (Addendum Backend, lido em paralelo pelo
// Arquiteto Backend desta mesma execução). Vive em
// `src/validations/schemas/` (NÃO em `pages/`) — mirror estrutural de
// `provider-schema.ts` (FUNÇÃO que recebe `languageGB` e devolve o schema);
// o padrão de `Racas`/`Classes`, que colocam `*-schema.ts` na própria pasta
// da página, é um DESVIO pré-canonização — não clonado aqui.
//
// Mensagens SEMPRE derivadas da tradução do módulo
// (`languageGB.categoryAnimals.categoryAnimal.form.validation`) — nunca
// string literal, mesma disciplina de `breedSchema`/`kindSchema` (moldes
// mais próximos: catálogo com FK obrigatória).
//
// `start_month`/`end_month`: SEM `.max(...)` — o teto de 12 do legado foi
// removido pelo próprio backend (`TASK-BE-541`, Addendum §2); replicar o
// teto aqui seria infiel ao contrato atual.
//
// `next_category_uuid`/`product_uuid`: opcionais (`.nullable()`), sem
// `.required()` — mesma leitura do contrato §1 (`nullable` no
// `CategoryAnimalRequest`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const categoryAnimalSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.categoryAnimals.categoryAnimal.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    specie_uuid: yup.mixed().required(messages.specieRequired),
    gender: yup.string().required(messages.genderRequired),
    // `min(0)` só — SEM teto (ver cabeçalho do arquivo).
    start_month: yup.number().nullable().min(0, messages.startMonthMin),
    end_month: yup.number().nullable().min(0, messages.endMonthMin),
    // Self-FK e FK cross-feature — opcionais, guardam o `Option` completo
    // (SelectAsyncPaginate), sem `.required()`.
    next_category_uuid: yup.mixed().nullable(),
    product_uuid: yup.mixed().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const categoryAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(categoryAnimalSchema(languageGB));

export default categoryAnimalSchemaResolver;
