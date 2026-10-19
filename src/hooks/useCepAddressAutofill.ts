// src/hooks/useCepAddressAutofill.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-04 (I4) — busca de endereço por CEP para o formulário de
// Contratante, fiel ao legado (`agro365/resources/js/main.js:1060-1118`):
//   - só dispara com o formato completo (8 dígitos); formato inválido →
//     "Formato de CEP inválido." sem consulta;
//   - com formato válido, LIMPA o endereço antes da consulta (`main.js:1081`)
//     e preenche o logradouro quando o ViaCEP responde; CEP inexistente →
//     "CEP não encontrado." e o endereço fica vazio;
//   - seleciona a cidade pelo código IBGE (`GET /cities?iso=`).
// Reusa `getAddressByCep` (ViaCEP em `fetch` nativo, nunca `api.V2`) e
// `getCityByIso`. Nada de `useState` de loading: o autofill é um atalho que
// NUNCA trava o formulário — toda falha vira toast e o preenchimento manual
// continua disponível.
// -----------------------------------------------------------------------------

import { toaster } from '@/components/ui/toaster';

import cleanMask from '@/utils/clean-mask';

import { getCityByIso } from '@/services/v2/Cities/city-service';
import { getAddressByCep } from '@/services/viacep';

import type {
  CepAutofillHandlers,
  CepAutofillToastMessage,
} from '@/@types/v2/BaseRegistrations/tenant';

function notify(type: 'warning' | 'error', message: CepAutofillToastMessage) {
  toaster.create({ type, title: message.title, description: message.description });
}

/**
 * Consulta o CEP e devolve endereço/cidade pelos callbacks.
 * @param {string} rawCep - Valor digitado (com ou sem máscara).
 * @param {CepAutofillHandlers} handlers - Callbacks de escrita e mensagens i18n.
 * @return {Promise<void>} Resolve sempre (erros viram toast, nunca exceção).
 */
export async function autofillByCep(
  rawCep: string,
  { onAddress, onCity, messages }: CepAutofillHandlers
): Promise<void> {
  const digits = cleanMask(rawCep ?? '');
  if (!digits) return;

  if (digits.length !== 8) {
    notify('warning', messages.invalidFormat);
    return;
  }

  onAddress('', '');

  try {
    const address = await getAddressByCep(digits);
    if (!address) {
      notify('warning', messages.notFound);
      return;
    }

    onAddress(address.logradouro ?? '', address.bairro ?? '');

    const city = await getCityByIso(Number(address.ibge));
    if (!city) {
      notify('warning', messages.cityNotResolved);
      return;
    }

    onCity({
      label: [city.title, city.state?.letter].filter(Boolean).join(' — '),
      value: city.uuid,
    });
  } catch {
    notify('error', messages.networkError);
  }
}

/**
 * Hook de conveniência do autofill por CEP (sem estado próprio).
 * @return {{autofillByCep: Function}} Função de autofill.
 */
export function useCepAddressAutofill() {
  return { autofillByCep };
}
