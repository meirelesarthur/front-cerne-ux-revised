// src/pages/Operacional/PesagemRodoviaria/hooks/useModuleWeighingScale.ts
// -----------------------------------------------------------------------------
// Hook `useModuleWeighingScale` — WebSocket da balança (TASK-MWG-FE-04,
// FE-FLW-WS). Único pedaço genuinamente novo desta fatia: NÃO existe
// nenhum outro uso de WebSocket em todo o `frontend_root` (confirmado por
// `grep` nesta sessão) — sem precedente de código a copiar, fidelidade vem
// só do contrato legado (`_check_connection.blade.php`, `main.js`,
// `CONTRATO-TELA-PESAGEM-FE §7`/`CONTRATO-API-PESAGEM §9`).
//
// Regras replicadas (IG-015..018):
//  - Conecta em `ws://localhost:9501` SÓ sob demanda (`captureWeight()`),
//    nunca ao montar a tela inteira (`page_ready_socket_monitor` é só
//    monitor de status, não conexão ativa).
//  - Envia o comando `'weight'`; payload válido → `parseFloat` + callback
//    `onWeightReceived(value)` (o hook NÃO conhece o formulário — quem
//    consome decide em qual campo RHF escrever).
//  - `inputType`: `'A'` (automático) quando o valor veio do socket, `'M'`
//    (manual) quando o consumidor sinaliza digitação direta via
//    `markManualInput()` — metadado de UI/rastreio, nunca persistido no
//    payload da API (FLD-003, server_variable interno).
//  - Timeout de conexão: 5s. Health-check: 30s (enquanto `connected`,
//    confere `readyState` periodicamente). Reconexão com backoff:
//    5s → 10s → 20s → 30s, depois PARA (nova tentativa só por novo clique
//    em "Capturar peso").
//  - Payload `'error'` → mensagem de aviso, NÃO bloqueia digitação manual
//    (fallback sempre disponível para quem tem `module-weighing_manual_weight`).
//  - Fecha a conexão ao desmontar o componente que a abriu — nunca deixa
//    socket órfão entre navegações.
//  - Fora de escopo (BLOQUEADO herdado, SF-064): o protocolo interno do
//    executável `agro365-balanca.exe` (porta serial/baud/framing) — o hook
//    só fala o protocolo WebSocket já documentado.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

const SCALE_WS_URL = 'ws://localhost:9501';
const CONNECT_TIMEOUT_MS = 5000;
const HEALTH_CHECK_INTERVAL_MS = 30000;
const RECONNECT_BACKOFF_MS = [5000, 10000, 20000, 30000];

export type ModuleWeighingScaleStatus = 'disconnected' | 'connecting' | 'connected';
export type ModuleWeighingScaleInputType = 'A' | 'M' | null;

export interface UseModuleWeighingScaleOptions {
  /** Chamado quando um peso válido chega do socket (já `parseFloat`). O hook
   *  não conhece o formulário — quem consome decide o campo RHF de destino. */
  onWeightReceived: (value: number) => void;
  /** Chamado quando o socket devolve um payload de erro — mensagem de aviso,
   *  nunca bloqueante (o consumidor decide como exibir, ex. toast leve). */
  onError?: (message: string) => void;
}

export interface UseModuleWeighingScaleReturn {
  status: ModuleWeighingScaleStatus;
  inputType: ModuleWeighingScaleInputType;
  /** Abre a conexão sob demanda (se necessário) e envia o comando `'weight'`. */
  captureWeight: () => void;
  /** Sinaliza digitação manual no campo de peso — `inputType` vira `'M'`. */
  markManualInput: () => void;
}

export function useModuleWeighingScale({
  onWeightReceived,
  onError,
}: UseModuleWeighingScaleOptions): UseModuleWeighingScaleReturn {
  const [status, setStatus] = useState<ModuleWeighingScaleStatus>('disconnected');
  const [inputType, setInputType] = useState<ModuleWeighingScaleInputType>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pendingCaptureRef = useRef(false);

  const onWeightReceivedRef = useRef(onWeightReceived);
  onWeightReceivedRef.current = onWeightReceived;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clearTimers = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    clearTimers();
    reconnectAttemptRef.current = 0;
    pendingCaptureRef.current = false;
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      try {
        socketRef.current.close();
      } catch {
        // Falha silenciosa — o socket já pode estar fechado.
      }
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, [clearTimers]);

  const scheduleReconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    if (attempt >= RECONNECT_BACKOFF_MS.length) {
      // Backoff esgotado (5/10/20/30s) — para; nova tentativa só por novo
      // clique em "Capturar peso" (`captureWeight`).
      setStatus('disconnected');
      pendingCaptureRef.current = false;
      return;
    }
    const delay = RECONNECT_BACKOFF_MS[attempt];
    reconnectAttemptRef.current = attempt + 1;
    reconnectTimeoutRef.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      openSocket();
    }, delay);
  }, []);

  function openSocket() {
    clearTimers();
    setStatus('connecting');

    let socket: WebSocket;
    try {
      socket = new WebSocket(SCALE_WS_URL);
    } catch {
      scheduleReconnect();
      return;
    }
    socketRef.current = socket;

    connectTimeoutRef.current = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        try {
          socket.close();
        } catch {
          // Falha silenciosa.
        }
        scheduleReconnect();
      }
    }, CONNECT_TIMEOUT_MS);

    socket.onopen = () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      reconnectAttemptRef.current = 0;
      setStatus('connected');

      // Health-check — enquanto conectado, confere `readyState`
      // periodicamente (IG-018, `page_ready_socket_monitor`).
      healthCheckRef.current = setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          if (healthCheckRef.current) {
            clearInterval(healthCheckRef.current);
            healthCheckRef.current = null;
          }
          setStatus('disconnected');
          scheduleReconnect();
        }
      }, HEALTH_CHECK_INTERVAL_MS);

      if (pendingCaptureRef.current) {
        pendingCaptureRef.current = false;
        socket.send('weight');
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      const payload = typeof event.data === 'string' ? event.data.trim() : String(event.data);
      if (payload === 'error') {
        onErrorRef.current?.(payload);
        return;
      }
      const value = parseFloat(payload.replace(',', '.'));
      if (Number.isNaN(value)) {
        onErrorRef.current?.(payload);
        return;
      }
      setInputType('A');
      onWeightReceivedRef.current(value);
    };

    socket.onerror = () => {
      onErrorRef.current?.('error');
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setStatus((prev) => (prev === 'disconnected' ? prev : 'disconnected'));
    };
  }

  const captureWeight = useCallback(() => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send('weight');
      return;
    }
    pendingCaptureRef.current = true;
    reconnectAttemptRef.current = 0;
    openSocket();
  }, []);

  const markManualInput = useCallback(() => {
    setInputType('M');
  }, []);

  // Fecha a conexão ao desmontar o componente que a abriu — nunca deixa
  // socket órfão entre navegações.
  useEffect(() => {
    return () => {
      closeSocket();
    };
  }, []);

  return { status, inputType, captureWeight, markManualInput };
}

export default useModuleWeighingScale;
