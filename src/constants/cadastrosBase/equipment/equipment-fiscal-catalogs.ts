// src/constants/cadastrosBase/equipment/equipment-fiscal-catalogs.ts
// -----------------------------------------------------------------------------
// Fábricas de opções dos 4 catálogos ESTÁTICOS do bloco Fiscal/Veículo
// (`EquipamentoFiscalVeiculoTab.tsx`, TASK-FE-1007) — mirror do padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mesma fábrica de
// `markerTypeOptions`). Códigos fixos do legado (agro365
// `app/Equipment.php::opTypes()/opBodyTypes()/opWheelTypes()/opOwnerTypes()`,
// linhas 168-248) — NÃO endpoint (Equipment-Frontend-Contrato.md §6/§10:
// "opções fixas, sem endpoint, mesma estratégia de catálogos estáticos já
// usada em TaxRules").
//
// Labels via `languageGB.equipments.equipment.form.fiscalCatalogs.*`
// (aditivo, `TASK-FE-1007`) — zero string literal no componente, mesma
// disciplina do resto do módulo.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export type EquipmentVehicleType =
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '10'
  | '11'
  | '13'
  | '14'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '24'
  | '25';

export type EquipmentBodyType = '00' | '01' | '02' | '03' | '04';
export type EquipmentWheelType = '01' | '02' | '03' | '04' | '05' | '06';
export type EquipmentOwnerTp = 0 | 1 | 2;

const VEHICLE_TYPE_CODES: EquipmentVehicleType[] = [
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '10',
  '11',
  '13',
  '14',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
];

const BODY_TYPE_CODES: EquipmentBodyType[] = ['00', '01', '02', '03', '04'];
const WHEEL_TYPE_CODES: EquipmentWheelType[] = ['01', '02', '03', '04', '05', '06'];
const OWNER_TP_CODES: EquipmentOwnerTp[] = [0, 1, 2];

/**
 * Fábrica genérica `codes -> labels(languageGB) -> getLabel/getOption/options`
 * — evita repetir a mesma mecânica 4x (mirror `markerTypeOptions`).
 * @param {T[]} codes - Códigos fixos do catálogo, na ordem de exibição.
 * @param {Function} labelsOf - Extrai o record de labels (i18n) do pacote de
 *   idioma ativo (`languageGB`), mapeando cada código para o rótulo traduzido.
 * @return {object} Fábrica pronta para o `Select` (`getLabel`/`getOption`/`options`).
 */
function createStaticOptionFactory<T extends string | number>(
  codes: readonly T[],
  labelsOf: (languageGB: LanguageDate) => Record<T, string>
) {
  const getLabel = (value: T, languageGB: LanguageDate): string => labelsOf(languageGB)[value];

  const getOption = (value: T, languageGB: LanguageDate): Option<T> => ({
    label: getLabel(value, languageGB),
    value,
  });

  const options = (languageGB: LanguageDate): Option<T>[] =>
    codes.map((value) => getOption(value, languageGB));

  return { getLabel, getOption, options };
}

export const equipmentVehicleTypeOptions = createStaticOptionFactory(
  VEHICLE_TYPE_CODES,
  (languageGB) => languageGB.equipments.equipment.form.fiscalCatalogs.type
);

export const equipmentBodyTypeOptions = createStaticOptionFactory(
  BODY_TYPE_CODES,
  (languageGB) => languageGB.equipments.equipment.form.fiscalCatalogs.bodyType
);

export const equipmentWheelTypeOptions = createStaticOptionFactory(
  WHEEL_TYPE_CODES,
  (languageGB) => languageGB.equipments.equipment.form.fiscalCatalogs.wheelType
);

export const equipmentOwnerTpOptions = createStaticOptionFactory(
  OWNER_TP_CODES,
  (languageGB) => languageGB.equipments.equipment.form.fiscalCatalogs.ownerTp
);
