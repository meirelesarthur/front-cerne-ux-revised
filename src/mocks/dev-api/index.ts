// -----------------------------------------------------------------------------
// DEV MOCKS — dados simulados SOMENTE para trabalho de UX local, sem backend.
//
// Ativação: `VITE_DEV_MOCKS=true` no `.env` E `import.meta.env.DEV`. Em
// `vite build` o `DEV` é `false` e este módulo sai do bundle (tree-shaking).
//
// Como funciona: um adapter do axios intercepta as requisições da instância V2.
// Rota registrada em `routes` → responde localmente (envelope ApiResponse).
// Rota NÃO registrada → segue para a rede real (e falha sem backend, como antes).
//
// Para simular mais telas: crie `handlers/<recurso>.ts` exportando `MockRoute[]`
// e some em `routes` abaixo. Docs: docs/ux/README.md.
// -----------------------------------------------------------------------------

import axios, { type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { farmRoutes } from './handlers/farms';
import { referenceRoutes } from './handlers/reference';
import { loadSynthetic, syntheticHandle } from './synthetic';

export const DEV_MOCKS = import.meta.env.DEV && import.meta.env.VITE_DEV_MOCKS === 'true';

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, any>;
  body: any;
  match: RegExpMatchArray;
}

export interface MockRoute {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  pattern: RegExp;
  handler: (req: MockRequest) => { status?: number; body?: unknown; meta?: unknown };
}

const routes: MockRoute[] = [...farmRoutes, ...referenceRoutes];

const LATENCY_MS = 250;

// Mock sintético (qualquer endpoint dos serviços, com dados fictícios) — ligado por padrão junto
// com os mocks; desligue com VITE_DEV_MOCKS_SYNTHETIC=false.
const SYNTHETIC = import.meta.env.VITE_DEV_MOCKS_SYNTHETIC !== 'false';
// Com a API local de dev (scripts/dev-db) no ar: tenta ela primeiro e só usa os mocks quando ela
// não atende a rota (resposta marcada `x-dev-fallback`) ou está fora do ar.
const API_FIRST = import.meta.env.VITE_DEV_MOCKS_API_FIRST === 'true';

/** Envelope ApiResponse: { success, message, data, errors, meta }. */
const envelope = (data: unknown, meta: unknown = null) => ({
  success: true,
  message: 'dev-mock',
  data,
  errors: null,
  meta,
});

function toPath(config: InternalAxiosRequestConfig) {
  const url = config.url ?? '';
  return url.replace(config.baseURL ?? '', '').split('?')[0];
}

export function installDevMocks(instance: AxiosInstance) {
  if (!DEV_MOCKS) return;

  const realAdapter = axios.getAdapter(instance.defaults.adapter ?? axios.defaults.adapter);

  const adapter: AxiosAdapter = async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const path = toPath(config);

    if (API_FIRST) {
      try {
        const res = await realAdapter(config);
        if (!res.headers?.['x-dev-fallback']) return res;
      } catch (err: any) {
        // erro HTTP de verdade (ex.: 422 da API local) segue para a tela; só rede indisponível cai no mock
        if (err?.response) throw err;
      }
    }

    for (const route of routes) {
      const match = path.match(route.pattern);
      if (route.method !== method || !match) continue;

      const out = route.handler({ method, path, params: config.params ?? {}, body: config.data, match });
      await new Promise((r) => setTimeout(r, LATENCY_MS));
      const status = out.status ?? 200;
      return {
        data: status === 204 ? '' : envelope(out.body, out.meta),
        status,
        statusText: 'OK (dev-mock)',
        headers: {},
        config,
      };
    }

    if (SYNTHETIC && (await loadSynthetic())) {
      const out = syntheticHandle({ method, path, params: config.params ?? {}, body: config.data });
      if (out) {
        await new Promise((r) => setTimeout(r, LATENCY_MS / 2));
        return {
          data: out.status === 204 ? '' : out.data,
          status: out.status,
          statusText: 'OK (dev-mock synthetic)',
          headers: {},
          config,
        };
      }
    }

    // Fallback "navegável": sem backend, rota não registrada não deve derrubar a tela.
    // GET → lista vazia paginada (a tela mostra o estado vazio, não erro de rede);
    // escrita → sucesso genérico. Desligue com VITE_DEV_MOCKS_FALLBACK=false para
    // deixar rotas não registradas irem à rede real.
    if (import.meta.env.VITE_DEV_MOCKS_FALLBACK !== 'false') {
      await new Promise((r) => setTimeout(r, LATENCY_MS));
      const empty = {
        total: 0,
        count: 0,
        per_page: Number(config.params?.per_page) || 10,
        current_page: 1,
        last_page: 1,
      };
      const isRead = method === 'get';
      const status = method === 'delete' ? 204 : 200;
      return {
        data: status === 204 ? '' : envelope(isRead ? [] : {}, isRead ? empty : null),
        status,
        statusText: 'OK (dev-mock fallback)',
        headers: {},
        config,
      };
    }

    return realAdapter(config);
  };

  // eslint-disable-next-line no-param-reassign
  instance.defaults.adapter = adapter;
}
