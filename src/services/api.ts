import {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from 'axios';

import { clearAuthStorage, getAccessToken } from '@/services/v2/Auth/auth-service';

import { IS_TOKEN_AUTH } from '@/config/env';

import {
  axiosInstanceCHAT,
  axiosInstanceV2,
} from './api-instances';

import { emitErrorLog } from '@/utils/errorLogEmitter';

// TASK-TN-FE-07 / GAP-TN-FE-04 — `skipFarmHeader` é um opt-out ADITIVO e
// OPCIONAL do header `X-Farm-Id` anexado incondicionalmente pelo interceptor
// de request abaixo. Default ausente/`false` preserva 100% do comportamento
// atual para todo o app (7+ telas que dependem do corte tenant-scoped em
// `role-service.ts`/`cost-center-service.ts` continuam enviando o header
// normalmente). SEM consumidor ativo no momento — os 2 usos originais
// (`listPlatformRoleOptions`/`listGlobalCostCenterOptions`, form de
// Contratantes) migraram para endpoints dedicados FORA de qualquer
// farm-context (`/roles/options` — TASK-TN-10; `/cost-centers/options/global`
// — TASK-TN-11), que nunca olham `X-Farm-Id`, tornando o opt-out
// desnecessário nesses 2 call sites. Interface/interceptor MANTIDOS
// (mecanismo genérico, aditivo) para um eventual novo consumidor que precise
// de um endpoint tenant-scoped real com opt-out do header.
export interface RequestConfig extends AxiosRequestConfig {
  skipFarmHeader?: boolean;
}

interface AdaptAxiosRequestConfig extends RequestConfig {
  headers: AxiosRequestHeaders;
}

function api(axiosInstance: AxiosInstance) {
  // Interceptor de Request.
  // - Modo TOKEN: anexa o Bearer token (localStorage) no header Authorization.
  // - Modo COOKIE: nada a fazer aqui — o cookie de sessão HttpOnly é enviado
  //   automaticamente pelo navegador (withCredentials).
  // Em ambos os modos propagamos o contexto multi-tenant: header X-Farm-Id com a
  // fazenda ativa (setada no login), exigido pelos endpoints tenant-scoped.
  axiosInstance.interceptors.request.use(
    (config: AdaptAxiosRequestConfig) => {
      const configAxios = config;

      if (IS_TOKEN_AUTH) {
        const token = getAccessToken();
        if (token) {
          (configAxios?.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
        }
      }

      const farmId = localStorage.getItem('app-active-farm');

      // TASK-TN-FE-07 — o opt-out precisa ser um check explícito AQUI, dentro
      // do próprio interceptor: ele roda DEPOIS que o config da chamada já
      // foi montado, então omitir o header no call site não basta (o
      // interceptor o reintroduziria de qualquer forma). Sem
      // `skipFarmHeader` (undefined/false, caso de todo o resto do app) o
      // comportamento é idêntico ao anterior a esta Tarefa.
      if (farmId && !configAxios.skipFarmHeader) {
        (configAxios?.headers as AxiosHeaders).set('X-Farm-Id', farmId);
      } else if (configAxios.skipFarmHeader) {
        // Defensivo — garante ausência do header mesmo que algo já o tenha
        // setado antes deste interceptor.
        (configAxios?.headers as AxiosHeaders).delete('X-Farm-Id');
      }

      return configAxios;
    },
    (error) => Promise.reject(error)
  );

  // Helper — emite erro para o ErrorLogPanel
  function emitAxiosError(err: AxiosError | any) {
    try {
      const config = err?.config || err?.response?.config;
      const method = (config?.method || 'UNKNOWN').toUpperCase();
      let url = config?.url || '';
      if (url && !url.startsWith('http') && config?.baseURL) {
        url = `${config.baseURL}${url}`;
      }
      const statusCode = err?.response?.status || null;
      const resData = err?.response?.data as any;
      const errorMessage =
        resData?.message || resData?.error || err?.message || 'Unknown error';

      let requestHeaders: Record<string, string> = {};
      if (config?.headers) {
        const h = config.headers;
        const raw =
          typeof h.toJSON === 'function'
            ? h.toJSON()
            : Object.fromEntries(
                Object.entries(h).filter(([, v]) => typeof v === 'string'),
              );
        requestHeaders = Object.fromEntries(
          Object.entries(raw)
            .filter(([, v]) => typeof v === 'string')
            .map(([k, v]) => [k, String(v)]),
        );
      }

      let requestPayload: unknown = null;
      if (config?.data) {
        try {
          requestPayload =
            typeof config.data === 'string'
              ? JSON.parse(config.data)
              : config.data;
        } catch {
          requestPayload = config.data;
        }
      }

      emitErrorLog({
        method,
        url,
        statusCode,
        errorMessage: `${statusCode ?? ''} — ${errorMessage}`,
        requestHeaders,
        requestPayload,
        responseBody: resData ?? null,
      });
    } catch {
      // Falha silenciosa — não pode impedir o fluxo normal
    }
  }

  // Interceptor de Response - Renova token automaticamente
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // 401 de autenticação real (token/sessão ausente, expirado ou inválido)
      // fora da rota de login → deslogamos e sinalizamos a aplicação para
      // redirecionar ao login. O backend marca esse caso específico com
      // `code: "unauthenticated"` no envelope de erro; qualquer outro 401
      // (ex.: regra de negócio — emissor sem certificado, etc.) NÃO desloga:
      // o erro segue para o handler local da tela tratar (toast específico).
      if (
        error?.response?.status === 401 &&
        !originalRequest?.url?.includes('/auth/login') &&
        (error?.response?.data as any)?.code === 'unauthenticated'
      ) {
        clearAuthStorage();
        emitAxiosError(error);
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      // Se retornou 403 — verificar se é bloqueio de tier/limite
      if (error?.response?.status === 403) {
        const resData = error.response?.data as any;
        const errorMsg = resData?.error?.message || resData?.message || '';
        const isTierBlock =
          resData?.tier_required != null ||
          resData?.limit_exceeded === true ||
          errorMsg.includes('not available for your team plan') ||
          errorMsg.includes('not available for your plan');

        if (isTierBlock) {
          // Marcar erro como tratado por tier — useRequest não duplicará toast
          (error as any)._tierHandled = true;

          // Emitir evento customizado para o listener React
          const tierEvent = new CustomEvent('tier-access-denied', {
            detail: {
              tierRequired: resData?.tier_required,
              limitExceeded: resData?.limit_exceeded,
              resource: resData?.resource,
              current: resData?.current,
              max: resData?.max,
              message: resData?.message,
              url: originalRequest?.url,
            },
          });
          window.dispatchEvent(tierEvent);

          // NÃO emitir para o ErrorLogPanel — cenário esperado
          return Promise.reject(error);
        }
      }

      // Para outros erros, emitir e rejeitar
      emitAxiosError(error);

      return Promise.reject(error);
    }
  );

  return {
    get<T>(
      endpoint: string,
      params?: any,
      config?: Omit<RequestConfig, 'params'>
    ): Promise<AxiosResponse<T>> {
      return axiosInstance.get<T>(endpoint, {
        params,
        ...config,
      });
    },

    post<T>(endpoint: string, payload?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.post(endpoint, payload, config);
    },
    delete(endpoint: string, config?: RequestConfig): Promise<AxiosResponse<any>> {
      return axiosInstance.delete(endpoint, config);
    },

    put<T>(endpoint: string, payload?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.put(endpoint, payload, config);
    },

    all(requests: any[]): Promise<any[]> {
      return Promise.all(requests);
    },

    patch<T = any, R = AxiosResponse<T>>(
      endpoint: string,
      payload?: any,
      config?: RequestConfig
    ): Promise<R> {
      return axiosInstance.patch(endpoint, payload);
    },
    baseURL: axiosInstance.getUri(),
  };
}

export default {
  V2: api(axiosInstanceV2),
  CHAT: api(axiosInstanceCHAT),
};
