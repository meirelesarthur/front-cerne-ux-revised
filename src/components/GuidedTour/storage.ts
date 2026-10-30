// src/components/GuidedTour/storage.ts
// Persistência do progresso do tutorial. HOJE: localStorage por usuário. Para ligar a API, troque
// a implementação de `tourStorage` (mesma interface) — o resto do módulo não conhece o localStorage.
//   GET  /me/onboarding-tour  → TourState
//   PUT  /me/onboarding-tour  ← TourState

import type { TourState } from './types';

export interface TourStorage {
  load(userKey: string): TourState;
  save(userKey: string, state: TourState): void;
}

const key = (userKey: string) => `cerne-tour:v1:${userKey}`;
const EMPTY: TourState = { flows: {}, autoStart: null };

export const tourStorage: TourStorage = {
  load(userKey) {
    try {
      const raw = localStorage.getItem(key(userKey));
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY, flows: {} };
    } catch {
      return { ...EMPTY, flows: {} };
    }
  },
  save(userKey, state) {
    try {
      localStorage.setItem(key(userKey), JSON.stringify(state));
    } catch {
      /* sem localStorage: o tutorial funciona, só não lembra */
    }
  },
};

/**
 * Chamado pelo onboarding "Criar conta" quando o cliente entra no sistema pela primeira vez: o
 * `GuidedTourProvider` lê esta marca ao montar e inicia o fluxo. Fica fora do estado por usuário
 * porque, nesse instante, o usuário ainda não foi carregado.
 */
const PENDING_KEY = 'cerne-tour:pending-autostart';
export const queueTourAutoStart = (flowId: string) => {
  try {
    localStorage.setItem(PENDING_KEY, flowId);
  } catch {
    /* ignore */
  }
};
export const takeTourAutoStart = (): string | null => {
  try {
    const v = localStorage.getItem(PENDING_KEY);
    if (v) localStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
};
