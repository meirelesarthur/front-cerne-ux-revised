// src/validations/schemas/Areas/area-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Área (Area — subdivisão
// geoespacial da Fazenda, F-348/UT-000446, esteira 067) — TASK-FE-415
// (fundação). Consumido pelo editor single (TASK-FE-420) e reaproveitado por
// item de `AreaBatchRequest` (TASK-FE-421, "Adicionar Múltiplas Áreas").
//
// Localização: `src/validations/schemas/Areas/`, NUNCA co-locado em
// `src/pages/CadastrosBase/Areas/` — decisão INVIOLÁVEL do task-packet
// (`CONTRATO-tela-frontend-area.md §8`/§2-bis "Tensão de convenção"), mesmo
// quando `CentroCusto`/`Fazendas` co-locam o schema na pasta da tela
// (anti-clonagem: o vizinho fora do padrão não é referência).
//
// Compõe `fieldValidationSchema(languageGB)` para o genérico + mensagens
// 100% via `languageGB.areas.area.form.validation.*` (zero string literal) —
// mirror mecânico de `equipment-schema.ts`/`evento-schema.ts`.
//
// -- Obrigatoriedade (contrato de tela §4, item 4 "Validações/mensagens") ---
// Descrição, coordinates, Área(total), Tipo, Ativo, Data, Cor — client-side.
// `date` é OBRIGATÓRIO (§4.D da matriz FID-G3A — corrige a divergência
// legado-required/destino-nullable; TASK-067-AR-05 fecha o lado API).
// `productive_area`/`unproductive_area` também exigidos numericamente — a
// tela de mapa (TASK-FE-419) os preenche em cascata ao desenhar/editar o
// polígono (de-para §4, item 3 "Cálculos"), nunca digitados livremente.
//
// -- Armadilhas conhecidas (Riscos da Tarefa) --------------------------------
// (1) `isEmpty()` do projeto é INVERTIDO (`ERRO-FE-001`, `src/utils/isEmpty.ts`)
//     — NÃO usar aqui; é problema do `fillForm`/dirty-check da tela (420), não
//     deste schema.
// (2) `coordinates` de Área chega/sai como um único `Feature` GeoJSON já
//     desserializado (objeto), DIFERENTE de `Farm.coordinates` (string
//     serializada) — o `.test()` abaixo só exige "objeto presente", nunca
//     tenta `JSON.parse`.
// (3) `KgInput` (`total_area`/`productive_area`/`unproductive_area`) persiste
//     SÓ o `floatValue` — a máscara é apresentação, nunca o valor validado
//     aqui (que é sempre `number`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const areaSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.areas.area.form.validation;

  return yup.object({
    // -- Identificação --
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    registration: yup.string().trim().nullable().max(30, messages.registrationMaxLength),
    date: v.date().required(messages.dateRequired),

    // -- Classificação (Select + Controller, Option<T>) --
    type: v.option<number>().required(messages.typeRequired),
    color: v.option<string>().required(messages.colorRequired),
    proprietary: yup.mixed().nullable(),
    activity: yup.mixed().nullable(),
    infrastructure: yup.array().of(yup.mixed()).default([]),
    recreation_area: yup.boolean().default(false),
    is_enabled: yup.boolean().required(messages.isEnabledRequired),

    // -- Mapa/polígono (hidden, populado pelo desenho/KML — SURF-04a/04b) --
    coordinates: yup
      .mixed()
      .nullable()
      .required(messages.coordinatesRequired)
      .test(
        'coordinates-present',
        messages.coordinatesRequired,
        (value) => value !== null && value !== undefined && typeof value === 'object'
      ),
    activity_icon_coordinates: yup.mixed().nullable(),
    infrastructure_icon_coordinates: yup.mixed().nullable(),

    // -- Cálculos em cascata (de-para §4 item 3) — sempre `number`, nunca a
    // string mascarada do `KgInput` (`floatValue`, ver Riscos acima). --
    total_area: v.number().required(messages.totalAreaRequired),
    productive_area: v.number().required(messages.productiveAreaRequired),
    unproductive_area: v.number().required(messages.unproductiveAreaRequired),

    // -- Observação --
    note: yup.string().trim().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do editor single (TASK-FE-420).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo Áreas.
 */
export const areaSchemaResolver = (languageGB: LanguageDate) => yupResolver(areaSchema(languageGB));

export default areaSchemaResolver;
