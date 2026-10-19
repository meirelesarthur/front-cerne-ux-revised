// src/validations/schemas/CadastrosBase/animal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Rebanho" (Animal — Cadastros Base /
// Pecuários, execução 027, TASK-FE-880). Backend em CONSTRUÇÃO PARALELA
// (TASK-BE-884) — condicionais espelham o Contrato de Tela §3.4/§5, com
// premissas `[A CONFIRMAR]` documentadas inline. Vive em
// `src/validations/schemas/` (NÃO em `pages/`) — mirror estrutural de
// `provider-schema.ts`/`category-animal-schema.ts` (FUNÇÃO que recebe
// `languageGB` e devolve o schema).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (fonte
// única de `languageGB.defaltStrings.validations.*`) — instrução explícita do
// Maestro para esta Tarefa (diferente do precedente `categoryAnimalSchema`,
// que usa mensagens específicas do módulo; aqui a fundação de dados NÃO cria
// um bucket `form.validation` próprio nesta rodada, formulário chega em
// TASK-FE-882..885).
//
// `quantity` (criação em lote, Contrato §5) — REABERTO por TASK-FE-882: a
// Opção B foi CONFIRMADA pelo dev (`GAP-BE-425` — o backend já implementa o
// bulk-insert de N linhas idênticas em `StoreAnimalAction`, testado). O campo
// está exposto no schema/payload/form a partir desta rodada, condicional a
// `type = "no_id"` — ver validação abaixo.
//
// `_category_is_reproductive` — campo-sombra (NÃO persistido no payload,
// setado via `setValue` quando a Categoria muda, TASK-FE-884) consultado
// pelos `.when()` de `category_matrice_id`/`reproductive_status` — Yup não
// acessa direto um campo derivado de uma opção externa (a flag `is_reproductive`
// vem do objeto da opção selecionada, não de um campo do form).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const animalSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    type: v.option(),

    // Criação em lote (Contrato §5) — Opção B CONFIRMADA (`GAP-BE-425`, o
    // Executor de TASK-FE-882 recebeu a confirmação do dev de que o backend
    // já aceita o fluxo). Exercido de fato só quando `type = "no_id"` — a
    // UI só renderiza este campo nessa condição (e nunca em edição), mas a
    // regra fica condicionada ao próprio `type` (não a `isEditing`, que o
    // Yup não enxerga) para não depender de contexto externo ao schema.
    quantity: yup
      .number()
      .nullable()
      .typeError(messages.invalidValue)
      .when('type', {
        is: (type: any) => type?.value === 'no_id',
        then: (schema) => schema.min(1, messages.requiredField).required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),

    specie_uuid: v.option(),
    category_uuid: v.option(),
    breed_uuid: v.option(),
    // Bug real corrigido nesta rodada (TASK-FE-917): `v.date()` costumava ser
    // `yup.date()` e devolvia objeto `Date` castado ao resolver — `<input
    // type="date">` esperava string, e `animal-service.ts` (multipart, foto)
    // fazia `fd.append('entry_date', dateObj)`, que serializa via
    // `Date.prototype.toString()` (não `Date.toJSON()`), quebrando o
    // `strtotime` do backend com 422. `v.date()` agora devolve string ISO
    // 'yyyy-MM-dd' validada — mesmo padrão já usado em `birth_date` abaixo
    // (que nunca teve o bug, por ser `yup.mixed()`) e catalogado em
    // `pages/CadastrosBase/Safra/safra-schema.ts`.
    entry_date: v.date(),

    // TASK-FE-919 (Doc Bruta `00-Documentacao_Bruta/Animal/02-Animal-diff-
    // cadastro-legado-vs-cerne.md`, item 4.2/D2) — CORREÇÃO DE QUEBRA DE USO:
    // o campo tem a classe `single-animal` no Blade (`_forms.blade.php:76`),
    // mas o ÚNICO código que manipula essa classe (`main.js:813-826`,
    // `setTypeAnimal()`) só esconde `.single-animal` quando
    // `$('#inp-type').val() == 'batch'` — valor que NÃO EXISTE nas opções
    // atuais do select (`single`/`no_id`). Na prática o campo está SEMPRE
    // visível, para qualquer `type`. Também NUNCA foi `->required()` no
    // Blade nem em `AnimalRequest::rules()` (`'birth_date' =>
    // ['nullable', 'date']`, sem condicional de `type`). A versão anterior
    // (obrigatório quando `single`) bloqueava submissão válida de um animal
    // Individual sem data de nascimento conhecida — revertido aqui.
    birth_date: yup.mixed().nullable(),

    // Identificação dinâmica (`useFieldArray`) — obrigatório ao menos 1 linha
    // quando `type = "Individual"`; oculto/fixo quando "Sem Identificação"
    // (§3.4.2). TASK-FE-919 (item 4.5/D5) — cada LINHA agora exige os 2
    // campos (`_forms.blade.php:302-303`, reforçado a cada `changeType()`;
    // `AnimalRequest.php` também exige por item,
    // `identifications.*.id_animal_uuid`/`identifications.*.identification`
    // `required`). Sem efeito quando `type = "no_id"` (array sempre vazio
    // nesse modo, `replaceIdentifications([])` no onChange do Tipo).
    identifications: yup
      .array()
      .of(
        yup.object({
          identification_type_uuid: yup.mixed().nullable().required(messages.requiredField),
          identification: yup.string().nullable().required(messages.requiredField),
        })
      )
      .when('type', {
        is: (type: any) => type?.value === 'single',
        then: (schema) => schema.min(1, messages.requiredField),
        otherwise: (schema) => schema,
      }),

    weight: v.number(),
    price_kilo_alive: v.number(),
    // TASK-FE-919 (item 4.1) — campo RHF real em AMBOS os modos agora
    // (criação e edição), sincronizado bidirecionalmente com
    // `price_kilo_alive` no JSX (`main.js:828-846`); nunca `required` no
    // legado, mesma disciplina de `vl_acquisition`.
    price_arroba_alive: yup.number().nullable().typeError(messages.invalidValue),
    // TASK-FE-919 (item 4.4/D3) — `maxlength=100` no Blade
    // (`_forms.blade.php:100`), espelhado aqui para dar feedback
    // client-side (antes só o 422 do servidor travava).
    fur_description: yup.string().nullable().max(100, messages.invalidValue),
    note: yup.string().nullable().max(191, messages.invalidValue),

    // Genealogia (§3.4.4) — `GAP-BE-426` REVERTIDO no E2E (Contrato §19,
    // TASK-FE-901): TEXTO LIVRE, nullable, SEM validação de existência
    // (RN-4 — o backend resolve o vínculo por busca textual e grava `null`
    // silenciosamente se não achar, mas sempre grava o texto digitado).
    // TASK-FE-919 (item 4.4/D4) — `max:191` no `AnimalRequest.php` novo
    // (linhas 132-133), sem limite no Blade legado; espelhado aqui.
    mother: yup.string().nullable().max(191, messages.invalidValue),
    father: yup.string().nullable().max(191, messages.invalidValue),

    // Campo-sombra — ver cabeçalho do arquivo. Não persiste no payload.
    _category_is_reproductive: yup.boolean().nullable(),

    // Estágio/Status Reprodutivo (§3.4.5) — condicional a
    // `_category_is_reproductive === true` (categoria selecionada com
    // `is_reproductive`). `category_matrice_id` (alinhado à chave real).
    category_matrice_id: yup
      .mixed()
      .nullable()
      .when('_category_is_reproductive', {
        is: true,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),
    reproductive_status: yup
      .mixed()
      .nullable()
      .when('_category_is_reproductive', {
        is: true,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),
    // Editável só quando `reproductive_status = Prenha (1)` (§3.4.5).
    birth_forecast: yup
      .mixed()
      .nullable()
      .when('reproductive_status', {
        is: (status: any) => status?.value === 1,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),

    // Bloco Bezerro (§3.4.6) — TASK-FE-919 (item 4.8/D8): CORRIGIDO de
    // "tudo-ou-nada" para OBRIGATÓRIO de fato, fiel ao legado
    // (`_forms.blade.php:478-489`, `handlePregnant()`:
    // `$('#birth-animal').find('input, select').prop('required', value ==
    // '3')` — os 5 campos viram `required` assim que `reproductive_status`
    // = "Parida" (3) é selecionado). Antes o Cerne permitia deixar o bloco
    // inteiro vazio mesmo com "Parida" marcada — regra mais frouxa que o
    // legado. `reproductive_status` é campo IRMÃO (raiz do form, não
    // aninhado em `child`) — `.when()` lê-o diretamente.
    child: yup
      .object()
      .nullable()
      .when('reproductive_status', {
        is: (status: any) => status?.value === 3,
        then: (schema) =>
          schema
            .shape({
              category_uuid: yup.mixed().nullable().required(messages.requiredField),
              birth_date: yup.mixed().nullable().required(messages.requiredField),
              weight: yup
                .number()
                .nullable()
                .typeError(messages.invalidValue)
                .required(messages.requiredField),
              id_animal_uuid: yup.mixed().nullable().required(messages.requiredField),
              identification: yup.string().nullable().required(messages.requiredField),
            })
            .required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),

    // Depreciação (§3.4.7) — `residual` obrigatório client-side só quando
    // `depreciation_type == 1` (fiel ao legado). `// [A CONFIRMAR]` contagem
    // exata de campos (8 vs 9, Contrato §3.4.7/§6 item 8).
    depreciation_type: yup.mixed().nullable(),
    vl_acquisition: yup.number().nullable(),
    residual: yup
      .number()
      .nullable()
      .when('depreciation_type', {
        is: (depreciationType: any) => depreciationType?.value === 1,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.nullable(),
      }),
    depreciation: yup.number().nullable(),
    life_bens: yup.number().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const animalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalSchema(languageGB) as any);

export default animalSchemaResolver;
