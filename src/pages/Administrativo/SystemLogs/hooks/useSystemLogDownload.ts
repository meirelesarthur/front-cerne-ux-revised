// -----------------------------------------------------------------------------
// Download de arquivo de log por blob, com progresso (execução 079,
// DD-FE-079-03 A). Serve a listagem e o visualizador.
//
// Por que blob e não `<a href>`: o repo tem modo duplo de auth (cookie OU
// Bearer, `IS_TOKEN_AUTH`/`IS_COOKIE_AUTH`); no modo token o navegador não
// anexaria o Bearer a um link direto. Risco aceito: o arquivo fica inteiro na
// memória do navegador (ok para dezenas/centenas de MB); acima disso, a
// alternativa é URL assinada pela API (não implementada).
//
// Um download por vez (limite da API: 10/min por usuário): o botão fica
// desabilitado enquanto há um em andamento, evitando clique duplo.
// -----------------------------------------------------------------------------

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { extractBlobApiError } from '@/utils/extractBlobApiError';

import { downloadSystemLog } from '@/services/v2/SystemLogs/system-logs-service';

import type { SystemLogDownloadProgress } from '@/@types/v2/SystemLogs';

export function useSystemLogDownload() {
  const { languageGB } = useLanguage();
  const text = languageGB.systemLogs.systemLog;

  const [activePath, setActivePath] = useState<string | null>(null);
  // `null` = indeterminado (resposta sem Content-Length)
  const [percent, setPercent] = useState<number | null>(null);

  const handleProgress = useCallback(({ loaded, total }: SystemLogDownloadProgress) => {
    if (!total || total <= 0) {
      setPercent(null);
      return;
    }
    const next = Math.min(100, Math.floor((loaded / total) * 100));
    setPercent((current) => (current === next ? current : next));
  }, []);

  const mutation = useMutation({
    mutationFn: (path: string) => downloadSystemLog(path, handleProgress),
    onMutate: (path: string) => {
      setActivePath(path);
      setPercent(null);
    },
    onSuccess: ({ blob, filename }) => {
      downloadBlob(blob, filename);
      toaster.success({ title: filename, description: text.download.success, duration: 5000 });
    },
    onError: async (error) => {
      // `responseType: 'blob'`: o corpo do erro chega como Blob
      const hasBlobBody =
        (error as { response?: { data?: unknown } } | null)?.response?.data instanceof Blob;
      const description =
        (await extractBlobApiError(error)) ??
        (hasBlobBody ? undefined : extractApiErrorMessage(error)) ??
        text.download.error;
      toaster.error({ title: text.download.error, description });
    },
    onSettled: () => {
      setActivePath(null);
      setPercent(null);
    },
  });

  const download = useCallback((path: string) => mutation.mutate(path), [mutation]);

  return {
    download,
    isPending: mutation.isPending,
    activePath,
    percent,
  };
}
