// src/constants/BaseRegistrations/mappers/tenant-nif-autofill.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-05 (I5) — mapper PURO do lookup por NIF (Person e CNPJ usam o
// mesmo shape) para os campos do form de Contratante. Fiel ao legado
// (`agro365/resources/js/main.js:456-517`) SEM os defeitos:
//   - `phone` sai só com dígitos (o legado calculava a limpeza e gravava o
//     valor cru, `main.js:483-488`); a máscara é aplicada ao gravar no form;
//   - `city` vira `Option` já selecionável (`uuid` + "Nome — UF"), no mesmo
//     formato do `SelectAsyncPaginate` de cidade da tela; `null` quando o
//     back não resolveu a cidade (o hook cai no autofill por CEP).
// -----------------------------------------------------------------------------

import cleanMask from '@/utils/clean-mask';

import type { Option } from '@/@types/option';
import type {
  TenantLookupCity,
  TenantLookupFieldsData,
  TenantNifAutofillFields,
} from '@/@types/v2/BaseRegistrations/tenant/lookup';

/**
 * Converte a cidade do lookup em opção do select de cidade.
 * @param {TenantLookupCity | null | undefined} city - Cidade devolvida pelo back.
 * @return {Option<string> | null} `{label: "Nome — UF", value: uuid}` ou `null`.
 */
export function lookupCityToOption(city?: TenantLookupCity | null): Option<string> | null {
  if (!city?.uuid) return null;
  return {
    label: [city.name, city.state?.uf].filter(Boolean).join(' — '),
    value: city.uuid,
  };
}

/**
 * Mapeia o retorno do lookup (Person ou CNPJ) para os campos do form.
 * @param {TenantLookupFieldsData} data - `data` do envelope do lookup.
 * @return {TenantNifAutofillFields} Valores crus (vazio = não informado).
 */
export function lookupToTenantFields(data: TenantLookupFieldsData): TenantNifAutofillFields {
  return {
    nickname: data.nickname?.trim() ?? '',
    name: data.name?.trim() ?? '',
    email: data.email?.trim() ?? '',
    phone: (data.phone ?? '').replace(/\D/g, ''),
    zip_code: cleanMask(data.zip_code ?? ''),
    address: data.address?.trim() ?? '',
    city: lookupCityToOption(data.city),
  };
}
