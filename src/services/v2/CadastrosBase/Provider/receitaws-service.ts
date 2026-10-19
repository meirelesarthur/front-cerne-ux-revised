// src/services/v2/CadastrosBase/Provider/receitaws-service.ts
// -----------------------------------------------------------------------------
// ReceitaWS — cliente HTTP ISOLADO para a API pública externa
// `receitaws.com.br` (TASK-PR-FE-05, autofill de CNPJ da aba "Filiais").
//
// Decisão do dono (proveniência: `GAP-UX-PR-01`/`Provider-FrontEnd-contrato.md
// ## 11`, ver Histórico da ficha `TASK-PR-FE-05`) — divergindo da recomendação
// original do Arquiteto Frontend, que recomendava NÃO implementar por ser
// dependência de terceiro sem precedente de código no legado/protótipo.
//
// ISOLAMENTO OBRIGATÓRIO (mesma decisão de `src/services/viacep.ts`, 1º
// consumidor de API externa deste `frontend_root`): `fetch` nativo, ZERO
// dependência nova, NUNCA a instância `api.V2`/`api.CHAT` do GB Cerne — essa
// API de terceiro não devolve o envelope `ApiResponse`, não aceita/precisa de
// `X-Farm-Id`, não usa Sanctum/cookie de sessão, e o `baseURL`/interceptor
// apontado para `api_root` quebraria a chamada. `AbortController` aplica um
// timeout CURTO (5s) — a Tarefa exige tratamento gracioso OBRIGATÓRIO:
// qualquer falha (rede fora do ar, timeout, CNPJ não encontrado, rate-limit
// 429 do serviço público) vira `null`, NUNCA propaga exceção. O chamador
// (`CreateOrUpdateFornecedor.tsx::handleBranchCnpjBlur`) trata `null` como
// "preencha manualmente" — nenhum estado de loading bloqueante na tela
// inteira, só um indicador local na linha da Filial sendo consultada.
//
// ADVERTÊNCIA DE DEPENDÊNCIA EXTERNA (documentada a pedido da própria
// especificação da Tarefa, para o próximo dev entender a defensividade deste
// arquivo): disponibilidade/rate-limit de `receitaws.com.br` estão FORA do
// controle do GB Cerne. Adicionalmente, a API pública não anuncia headers
// CORS documentados para chamadas diretas de browser (mesmo risco que o
// legado aceitava via JSONP — `agro365/resources/views/providers/
// _forms.blade.php:229-274`, `dataType: "jsonp"`) — se o navegador bloquear a
// resposta por CORS, o `fetch` rejeita e cai no mesmo `catch` abaixo,
// preservando o mesmo comportamento gracioso (não é um caminho de erro
// especial, é o MESMO catch genérico).
// -----------------------------------------------------------------------------

const RECEITAWS_TIMEOUT_MS = 5000;

// Shape cru da resposta pública (campos confirmados pelo uso real do legado —
// `_forms.blade.php:248-253` lê `data.logradouro`/`data.cep`/`data.municipio`;
// `nome`/`fantasia`/`uf` são campos documentados do contrato público do
// serviço, usados aqui para o autofill de `name`/resolução de cidade).
interface ReceitaWsRawResponse {
  /** 'ERROR' em falha (CNPJ inválido/inexistente) — mesmo campo checado pelo legado. */
  status?: string;
  message?: string;
  nome?: string;
  fantasia?: string;
  logradouro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
}

export interface ReceitaWsBranchAutofillData {
  /** Razão social (fallback nome fantasia) — o chamador só aplica se a linha ainda não foi editada manualmente (dirtyFields). */
  name: string | null;
  address: string;
  /** CEP formatado (`99999-999`) — `null` quando o CEP vier ausente/malformado na resposta. */
  zipCode: string | null;
  /** Nome do município — usado pelo chamador para resolver `city_uuid` via `GET /api/v1/cities` (listCityOptions). */
  cityName: string;
  /** UF (2 letras) — usado pelo chamador para desempatar entre cidades homônimas de estados diferentes. */
  stateUf: string;
}

// Busca dados de uma Filial (Pessoa Jurídica) na API pública
// `receitaws.com.br` a partir do CNPJ. `cnpjDigits` já deve chegar SEM
// máscara (14 dígitos) — validado pelo chamador antes de disparar a chamada
// (mesmo gatilho do legado, `onBlur` com contagem de dígitos).
//
// NUNCA lança — qualquer falha (rede, timeout, CORS, CNPJ não encontrado,
// rate-limit) devolve `null`. Ver cabeçalho do arquivo para o racional
// completo do tratamento gracioso.
export async function fetchCnpjDataFromReceitaWs(
  cnpjDigits: string
): Promise<ReceitaWsBranchAutofillData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RECEITAWS_TIMEOUT_MS);

  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjDigits}`, {
      signal: controller.signal,
    });

    // Inclui 429 (rate-limit do serviço público) e qualquer 4xx/5xx — tratado
    // como "não encontrado", nunca como exceção não tratada.
    if (!response.ok) return null;

    const data: ReceitaWsRawResponse = await response.json();

    if (data.status === 'ERROR' || !data.logradouro) return null;

    const cleanCep = (data.cep ?? '').replace(/\D/g, '');
    const zipCode = cleanCep.length === 8 ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}` : null;

    return {
      name: data.nome || data.fantasia || null,
      address: data.logradouro,
      zipCode,
      cityName: data.municipio ?? '',
      stateUf: data.uf ?? '',
    };
  } catch {
    // Rede fora do ar, timeout do AbortController ou bloqueio de CORS do
    // browser — qualquer falha vira `null`. NUNCA propagar: o chamador nunca
    // pode travar o submit do formulário por causa desta dependência de
    // terceiro (ver cabeçalho do arquivo).
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
