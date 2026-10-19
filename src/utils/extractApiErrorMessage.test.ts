import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { API_ERROR_CODES } from '@/constants/api-error-codes';
import { languageContextTypes } from '@/constants/languages';

import { LanguageDate } from '@/@types/language';

import {
  getBusinessMutationErrorMessage,
  getQueryErrorPresentation,
} from './extractApiErrorMessage';

// Mock mínimo de languageGB — a função só acessa `common.errorLog`, então o
// restante da árvore de tradução (imenso) não precisa existir no teste.
const languageGBMock = {
  common: {
    errorLog: {
      networkError: 'Sem resposta do servidor (erro de rede)',
      unknownError: 'Ocorreu um erro desconhecido',
      byStatus: {
        forbidden: 'Você não tem permissão para executar esta ação.',
        forbiddenList: 'Você não tem permissão para acessar estes registros.',
        forbiddenFarmContext: 'Selecione uma fazenda ativa no topo para acessar estes registros.',
        notFound:
          'Registro não encontrado. Ele pode ter sido removido ou alterado por outra pessoa.',
        conflict:
          'Não foi possível concluir: este registro está em conflito com outro já existente ou com uma operação em andamento.',
        server:
          'Ocorreu um erro interno. Tente novamente em instantes. Se o problema continuar, acione o suporte.',
      },
    },
  },
} as unknown as LanguageDate;

// `isAxiosError` do axios é uma checagem de shape (`isAxiosError === true` +
// campos), então este mock passa no guard sem precisar de uma instância real.
function mockAxiosError(status: number, data: any): AxiosError {
  return {
    isAxiosError: true,
    response: { status, data, statusText: '', headers: {}, config: {} as any },
    toJSON: () => ({}),
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
  } as unknown as AxiosError;
}

describe('getBusinessMutationErrorMessage', () => {
  it('500 sem message do backend (erro Axios cru) — usa mensagem de negócio de servidor', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(500, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.byStatus.server);
    expect(result).not.toContain('500');
    expect(result).not.toContain('Request failed');
  });

  it('500 com resData.message do handler genérico Laravel — mesma mensagem de negócio, sem prefixo de código', () => {
    const result = getBusinessMutationErrorMessage(
      mockAxiosError(500, { message: 'Ocorreu um erro interno. Tente novamente em instantes.' }),
      languageGBMock
    );
    expect(result).toBe(languageGBMock.common.errorLog.byStatus.server);
    expect(result).not.toContain('500 —');
  });

  it('404 — mapeia para mensagem de negócio de registro não encontrado', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(404, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.byStatus.notFound);
  });

  it('409 — mapeia para mensagem de negócio de conflito', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(409, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.byStatus.conflict);
  });

  it('403 (não-tier) — mapeia para mensagem de negócio de permissão', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(403, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.byStatus.forbidden);
  });

  it('422 por campo — inalterado, preserva o caminho de extractApiFieldErrorMessage', () => {
    const result = getBusinessMutationErrorMessage(
      mockAxiosError(422, { errors: { name: ['Este campo é obrigatório.'] } }),
      languageGBMock
    );
    expect(result).toBe('Este campo é obrigatório.');
  });

  it('422 sem errors por campo, com message de DomainException — passthrough sem prefixo de código', () => {
    const businessMessage =
      'Não é possível excluir: há registros vinculados a esta classificação de cultivo.';
    const result = getBusinessMutationErrorMessage(
      mockAxiosError(422, { message: businessMessage }),
      languageGBMock
    );
    expect(result).toBe(businessMessage);
  });

  it('422 sem errors por campo e sem message de topo — cai no fallback unknownError', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(422, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.unknownError);
  });

  it('network error / sem response — usa networkError', () => {
    const result = getBusinessMutationErrorMessage(
      { isAxiosError: true, message: 'Network Error' } as unknown as AxiosError,
      languageGBMock
    );
    expect(result).toBe(languageGBMock.common.errorLog.networkError);
  });

  it('401 — não é tratado por este util (skip acontece antes, no useRequest); aqui apenas confere que não quebra', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(401, {}), languageGBMock);
    // 401 não tem case dedicado no mapa — cai no default (topMessage || unknownError).
    expect(result).toBe(languageGBMock.common.errorLog.unknownError);
  });

  it('status não mapeado sem message de topo — fallback unknownError', () => {
    const result = getBusinessMutationErrorMessage(mockAxiosError(418, {}), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.unknownError);
  });

  it('erro genérico não-Axios — cai no fallback networkError (guard isAxiosError falha)', () => {
    const result = getBusinessMutationErrorMessage(new Error('boom'), languageGBMock);
    expect(result).toBe(languageGBMock.common.errorLog.networkError);
  });
});

describe('getQueryErrorPresentation', () => {
  it('403 — retryable false, mensagem de negócio de leitura (forbiddenList, distinta da forbidden de mutação)', () => {
    const result = getQueryErrorPresentation(mockAxiosError(403, {}), languageGBMock);
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.forbiddenList,
      retryable: false,
    });
  });

  it('500 — retryable true, mensagem de negócio de servidor', () => {
    const result = getQueryErrorPresentation(mockAxiosError(500, {}), languageGBMock);
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.server,
      retryable: true,
    });
  });

  it('404 — retryable false, mensagem de negócio de registro não encontrado', () => {
    const result = getQueryErrorPresentation(mockAxiosError(404, {}), languageGBMock);
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.notFound,
      retryable: false,
    });
  });

  it('erro sem response (rede/timeout) — retryable true, mensagem networkError', () => {
    const result = getQueryErrorPresentation(
      { isAxiosError: true, message: 'Network Error' } as unknown as AxiosError,
      languageGBMock
    );
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.networkError,
      retryable: true,
    });
  });

  it('409 — retryable true (conflito pode se resolver com retry natural), mensagem de conflito', () => {
    const result = getQueryErrorPresentation(mockAxiosError(409, {}), languageGBMock);
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.conflict,
      retryable: true,
    });
  });

  it('erro genérico não-Axios — cai no fallback networkError, retryable true', () => {
    const result = getQueryErrorPresentation(new Error('boom'), languageGBMock);
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.networkError,
      retryable: true,
    });
  });
});

// TASK-072-FE-10 (E1, gate G-FE-2) — texto próprio SÓ para o 403 com
// `code: FARM_CONTEXT_REQUIRED`; os demais 403 permanecem idênticos.
describe('getQueryErrorPresentation — 403 FARM_CONTEXT_REQUIRED (TASK-072-FE-10)', () => {
  it('403 com code FARM_CONTEXT_REQUIRED → forbiddenFarmContext, retryable false', () => {
    const result = getQueryErrorPresentation(
      mockAxiosError(403, {
        success: false,
        message: 'Header X-Farm-Id é obrigatório.',
        data: null,
        errors: null,
        meta: null,
        code: API_ERROR_CODES.FARM_CONTEXT_REQUIRED,
      }),
      languageGBMock
    );
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.forbiddenFarmContext,
      retryable: false,
    });
  });

  it('403 sem code (Spatie/AccessDenied/domínio) → forbiddenList inalterado', () => {
    const result = getQueryErrorPresentation(
      mockAxiosError(403, { success: false, message: 'This action is unauthorized.' }),
      languageGBMock
    );
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.forbiddenList,
      retryable: false,
    });
  });

  it('403 com OUTRO code → forbiddenList inalterado', () => {
    const result = getQueryErrorPresentation(
      mockAxiosError(403, { success: false, message: 'x', code: 'unauthenticated' }),
      languageGBMock
    );
    expect(result).toEqual({
      message: languageGBMock.common.errorLog.byStatus.forbiddenList,
      retryable: false,
    });
  });

  it('o code em 404 NÃO altera a mensagem (restrito ao 403)', () => {
    const result = getQueryErrorPresentation(
      mockAxiosError(404, { code: API_ERROR_CODES.FARM_CONTEXT_REQUIRED }),
      languageGBMock
    );
    expect(result.message).toBe(languageGBMock.common.errorLog.byStatus.notFound);
  });

  it('locale en-US real → texto traduzido, distinto do forbiddenList', () => {
    const enUs = getLanguageRouter(languageContextTypes.US) as LanguageDate;
    const result = getQueryErrorPresentation(
      mockAxiosError(403, { code: API_ERROR_CODES.FARM_CONTEXT_REQUIRED }),
      enUs
    );
    expect(result.message).toBe(enUs.common.errorLog.byStatus.forbiddenFarmContext);
    expect(result.message).toBe('Select an active farm at the top to access these records.');
    expect(result.message).not.toBe(enUs.common.errorLog.byStatus.forbiddenList);
  });

  it('locales pt-BR e es-ES reais têm a chave preenchida', () => {
    for (const locale of [languageContextTypes.BR, languageContextTypes.ES]) {
      const lang = getLanguageRouter(locale) as LanguageDate;
      expect(lang.common.errorLog.byStatus.forbiddenFarmContext).toBeTruthy();
      expect(lang.common.errorLog.byStatus.forbiddenFarmContext).not.toBe(
        lang.common.errorLog.byStatus.forbiddenList
      );
    }
  });
});

describe('getBusinessMutationErrorMessage — code estável (TASK-095-FE-R2-02, P5 + D7)', () => {
  const idiomas = [
    languageContextTypes.BR,
    languageContextTypes.US,
    languageContextTypes.ES,
  ] as const;

  it.each(idiomas)(
    '%s — RECORD_HAS_ACTIVE_LINKS usa a i18n própria, não a message da API',
    (lang) => {
      const languageGB = getLanguageRouter(lang)!;
      const result = getBusinessMutationErrorMessage(
        mockAxiosError(422, {
          code: API_ERROR_CODES.RECORD_HAS_ACTIVE_LINKS,
          message: 'MENSAGEM-DA-API',
          errors: { blocked_uuids: ['u1'] },
        }),
        languageGB
      );
      expect(result).toBe(languageGB.defaltStrings.deletion.blocked);
      expect(result).not.toContain('MENSAGEM-DA-API');
    }
  );

  it.each(idiomas)('%s — PURCHASE_CANCEL_HAS_WEIGHINGS usa a i18n do Processamentos', (lang) => {
    const languageGB = getLanguageRouter(lang)!;
    const result = getBusinessMutationErrorMessage(
      mockAxiosError(422, {
        code: API_ERROR_CODES.PURCHASE_CANCEL_HAS_WEIGHINGS,
        message: 'MENSAGEM-DA-API',
      }),
      languageGB
    );
    expect(result).toBe(languageGB.processamentos.processing.list.cancelBlockedByWeighings);
    expect(result).not.toContain('MENSAGEM-DA-API');
  });

  it('as 3 mensagens de vínculo são distintas entre idiomas', () => {
    const msgs = idiomas.map((l) => getLanguageRouter(l)!.defaltStrings.deletion.blocked);
    expect(new Set(msgs).size).toBe(3);
  });

  it('422 sem code (ou code desconhecido) mantém a message da API', () => {
    const languageGB = getLanguageRouter(languageContextTypes.BR)!;
    expect(
      getBusinessMutationErrorMessage(mockAxiosError(422, { message: 'Regra X' }), languageGB)
    ).toBe('Regra X');
    expect(
      getBusinessMutationErrorMessage(
        mockAxiosError(422, { code: 'OUTRO', message: 'Regra Y' }),
        languageGB
      )
    ).toBe('Regra Y');
  });
});
