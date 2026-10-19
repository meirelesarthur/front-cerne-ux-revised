// src/services/viacep.ts
// -----------------------------------------------------------------------------
// ViaCEP — 1º consumidor de API EXTERNA deste `frontend_root` (TASK-CT-FIX-03).
//
// `fetch` nativo (ZERO dependência nova) — NÃO usar `api.V2`/`api.CHAT`
// (`baseURL`/headers/credenciais internos, inadequados para domínio externo).
// Mesma escolha do legado (`agro365/resources/js/main.js:1089`,
// `fetch("https://viacep.com.br/ws/" + cep + "/json/")`).
//
// Contrato do ViaCEP (público, confirmado pelo uso real no legado):
//   GET https://viacep.com.br/ws/{cep}/json/
//   → sucesso: { cep, logradouro, complemento, bairro, localidade, uf, ibge, ddd, ... }
//   → CEP inexistente: { erro: true } (sem os demais campos)
//
// Qualquer falha de rede é capturada aqui e devolvida como `null` — tratada
// como "não encontrado" pelo chamador (`handleCepBlur`, em
// `CreateOrUpdateContador.tsx`), que nunca deve propagar exceção não tratada.
// -----------------------------------------------------------------------------

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export async function getAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) return null;

    const data: ViaCepResponse = await response.json();
    if (data.erro) return null;

    return data;
  } catch {
    return null; // rede fora do ar — tratado como "não encontrado" pelo chamador
  }
}
