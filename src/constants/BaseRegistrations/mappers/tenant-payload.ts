// src/constants/BaseRegistrations/mappers/tenant-payload.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-03 — mapper PURO form → payload de Contratante (POST/PUT
// /tenants), extraído de `CreateOrUpdateContratante.tsx::tryPersistTenant` para
// ser testável sem render. Regras preservadas 1:1 do componente:
//   - `person` ANINHADO (Achado B) e uuid-first (`city_uuid`/`country_uuid`,
//     `role_uuid` — Achados A/D);
//   - NIF enviado COMO ESTÁ, com pontuação (I2/D3 — legado grava pontuado;
//     SEM `cleanMask`); o `MaskedInput kind="cpfCnpj"` já entrega o formatado;
//   - `due_date` = `null` quando `signature` = 99 (Indeterminado);
//   - `cancellation_reason` só com `status` = 4 (Cancelado);
//   - `plan_uuid`/`centers` só quando tocados nesta sessão (`dirtyFields`) —
//     omitir a chave preserva o valor atual no servidor (backend `sometimes`).
// -----------------------------------------------------------------------------

import type {
  TenantForm,
  TenantPayload,
  TenantPayloadDirtyFields,
} from '@/@types/v2/BaseRegistrations/tenant';

/**
 * Monta o payload de escrita do Contratante a partir do formulário validado.
 * @param {TenantForm} data - Valores do formulário (já validados pelo schema).
 * @param {TenantPayloadDirtyFields} dirtyFields - Campos tocados nesta sessão.
 * @return {TenantPayload} Payload aninhado aceito por `TenantRequest`.
 */
export function buildTenantPayload(
  data: TenantForm,
  dirtyFields: TenantPayloadDirtyFields
): TenantPayload {
  return {
    person: {
      name: data.name.trim(),
      nickname: data.nickname.trim(),
      nif: data.nif.trim(),
      email: data.email.trim(),
      city_uuid: data.city!.value,
      phone: data.phone?.trim() || null,
      address: data.address.trim(),
      zip_code: data.zip_code?.trim() || undefined,
    },
    country_uuid: data.country!.value,
    cellphone: data.cellphone?.trim() || null,
    contact: data.contact?.trim() || null,
    contact_phone: data.contact_phone?.trim() || null,
    role_uuid: data.role_id!.value,
    ...(dirtyFields.plan_uuid ? { plan_uuid: data.plan_uuid!.value } : {}),
    list_all_farms: data.list_all_farms?.value,
    qtd_farms: data.qtd_farms!,
    qtd_users: data.qtd_users!,
    qtd_issuers: data.qtd_issuers!,
    qtd_nfe: data.qtd_nfe!,
    qtd_cte: data.qtd_cte!,
    qtd_mdfe: data.qtd_mdfe!,
    export_xls: data.export_xls!.value,
    status: data.status!.value,
    uses_cash_book: data.uses_cash_book?.value,
    use_fiscal: data.use_fiscal!.value,
    signature: data.signature!.value,
    dt_accession: data.dt_accession!,
    due_date: data.signature!.value === 99 ? null : data.due_date,
    due_day: data.due_day!.value,
    value: data.value!,
    generate_financial: data.generate_financial!.value,
    generate_ticket: data.generate_ticket!.value,
    cancellation_reason: data.status!.value === 4 ? data.cancellation_reason?.trim() : undefined,
    ...(dirtyFields.centers ? { centers: data.centers } : {}),
  };
}
