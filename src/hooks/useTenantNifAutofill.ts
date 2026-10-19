// src/hooks/useTenantNifAutofill.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-05 (I5) — autocomplete por CPF/CNPJ no form de Contratante,
// fiel ao legado (`agro365/resources/js/main.js:443-522`) sem os defeitos:
//   - só no CREATE (FE-06: edit/view não disparam) e só com DV válido;
//   - pessoa já cadastrada (`GET /tenants/person-by-nif`) → preenche os
//     campos homônimos (nunca o `nif`) e seleciona a cidade; se ela já é
//     contratante, avisa sem bloquear (o back decide no save);
//   - não achou e é CNPJ (14 dígitos) → consulta a Receita PELO BACK
//     (`GET /tenants/cnpj-lookup`) e preenche igual. O front NUNCA chama a
//     ReceitaWS. CPF não encontrado → nada acontece (mirror do legado);
//   - `city` null → cai no autofill por CEP (FE-04) com o `zip_code`
//     retornado, preservando o endereço que já veio do lookup;
//   - telefone chega limpo e é gravado já com a máscara; CEP idem;
//   - 404 do CNPJ → `cnpjNotFound`; 503 `CNPJ_LOOKUP_UNAVAILABLE` →
//     `cnpjUnavailable` (preenchimento manual segue livre); 429 →
//     `rateLimited`; falha de rede/servidor → `networkError`. 422 (NIF
//     inválido/parcial) é silencioso: o schema já mostra o erro no campo.
// Sobrescrita: como no legado, os valores NÃO vazios do lookup substituem o
// que está no campo (o lookup só dispara quando o NIF muda); valores vazios
// nunca apagam o que o usuário digitou.
// Sem `useState` de loading: atalho que nunca trava o form (mirror FE-04).
// -----------------------------------------------------------------------------

import { useRef } from 'react';

import { isAxiosError } from 'axios';

import { toaster } from '@/components/ui/toaster';

import { autofillByCep } from '@/hooks/useCepAddressAutofill';

import cleanMask from '@/utils/clean-mask';
import { isValidCpfCnpj } from '@/utils/masks/document';
import { stringMaskSource } from '@/utils/masks/maskSource';

import { API_ERROR_CODES } from '@/constants/api-error-codes';
import { lookupToTenantFields } from '@/constants/BaseRegistrations/mappers/tenant-nif-autofill';

import { findPersonByNif, lookupCnpj } from '@/services/v2/BaseRegistrations/tenant-lookup-service';

import type { Option } from '@/@types/option';
import type { CepAutofillMessages, TenantFormMode } from '@/@types/v2/BaseRegistrations/tenant';
import type {
  NifAutofillMessages,
  NifAutofillToastMessage,
  TenantLookupFieldsData,
  TenantNifAutofillTextField,
} from '@/@types/v2/BaseRegistrations/tenant/lookup';

export interface NifAutofillHandlers {
  /** Modo do form (FE-06) — só `create` dispara. */
  mode: TenantFormMode;
  /** Grava um campo de texto (valor já mascarado quando aplicável). */
  onField: (name: TenantNifAutofillTextField, value: string) => void;
  /** Seleciona a cidade. */
  onCity: (option: Option<string>) => void;
  messages: NifAutofillMessages;
  /** Mensagens do fallback por CEP (FE-04). */
  cepMessages: CepAutofillMessages;
}

/** `skipped` = não disparou; `done` = concluiu; `failed` = erro (pode repetir). */
export type NifAutofillResult = 'skipped' | 'done' | 'failed';

const TEXT_FIELDS: TenantNifAutofillTextField[] = [
  'nickname',
  'name',
  'email',
  'phone',
  'zip_code',
  'address',
];

function notify(type: 'info' | 'warning' | 'error', message: NifAutofillToastMessage) {
  toaster.create({ type, title: message.title, description: message.description });
}

function toDisplay(name: TenantNifAutofillTextField, value: string): string {
  if (name === 'phone') return stringMaskSource.phone.format(value);
  if (name === 'zip_code') return stringMaskSource.cep.format(value);
  return value;
}

function notifyLookupError(error: unknown, messages: NifAutofillMessages) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const code = isAxiosError(error)
    ? (error.response?.data as { code?: unknown } | undefined)?.code
    : undefined;

  if (status === 422 || status === 401 || status === 403) return;
  if (status === 429) {
    notify('warning', messages.rateLimited);
    return;
  }
  if (status === 503 && code === API_ERROR_CODES.CNPJ_LOOKUP_UNAVAILABLE) {
    notify('warning', messages.cnpjUnavailable);
    return;
  }
  notify('error', messages.networkError);
}

async function applyLookup(
  data: TenantLookupFieldsData,
  { onField, onCity, cepMessages }: NifAutofillHandlers
): Promise<void> {
  const fields = lookupToTenantFields(data);

  TEXT_FIELDS.forEach((name) => {
    if (fields[name]) onField(name, toDisplay(name, fields[name]));
  });

  if (fields.city) {
    onCity(fields.city);
    return;
  }

  if (fields.zip_code) {
    // Fallback FE-04: só a cidade interessa quando o lookup já trouxe o
    // endereço — não deixa o ViaCEP limpar/sobrescrever o que veio do back.
    await autofillByCep(fields.zip_code, {
      onAddress: (street) => {
        if (!fields.address) onField('address', street);
      },
      onCity,
      messages: cepMessages,
    });
  }
}

/**
 * Autocomplete do form de Contratante a partir do CPF/CNPJ.
 * @param {string} rawNif - NIF como digitado (com máscara).
 * @param {NifAutofillHandlers} handlers - Modo, callbacks de escrita e mensagens i18n.
 * @return {Promise<NifAutofillResult>} Resolve sempre (erros viram toast).
 */
export async function autofillByNif(
  rawNif: string,
  handlers: NifAutofillHandlers
): Promise<NifAutofillResult> {
  if (handlers.mode !== 'create') return 'skipped';
  const nif = rawNif?.trim() ?? '';
  if (!nif || !isValidCpfCnpj(nif)) return 'skipped';

  let person: Awaited<ReturnType<typeof findPersonByNif>>;
  try {
    person = await findPersonByNif(nif);
  } catch (error) {
    notifyLookupError(error, handlers.messages);
    return 'failed';
  }

  if (person) {
    await applyLookup(person, handlers);
    if (person.is_tenant) notify('info', handlers.messages.alreadyTenant);
    return 'done';
  }

  const digits = cleanMask(nif);
  if (digits.length !== 14) return 'done';

  let company: Awaited<ReturnType<typeof lookupCnpj>>;
  try {
    company = await lookupCnpj(digits);
  } catch (error) {
    notifyLookupError(error, handlers.messages);
    return 'failed';
  }

  if (!company) {
    notify('warning', handlers.messages.cnpjNotFound);
    return 'done';
  }

  await applyLookup(company, handlers);
  return 'done';
}

/**
 * Hook do autofill por NIF. Mirror do `change` do legado: o mesmo NIF não
 * é consultado de novo em blur repetido (evita estourar o throttle do back);
 * após falha, o próximo blur tenta de novo.
 * @return {{handleNifBlur: Function}} Handler para o `onBlur` do NIF.
 */
export function useTenantNifAutofill() {
  const lastNifRef = useRef('');

  async function handleNifBlur(rawNif: string, handlers: NifAutofillHandlers): Promise<void> {
    const digits = cleanMask(rawNif ?? '');
    if (!digits || digits === lastNifRef.current) return;

    // Marca antes do await: blur repetido durante a consulta não duplica.
    lastNifRef.current = digits;
    const result = await autofillByNif(rawNif, handlers);
    if (result !== 'done' && lastNifRef.current === digits) lastNifRef.current = '';
  }

  return { handleNifBlur };
}
