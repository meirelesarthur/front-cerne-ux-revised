// src/components/GuidedTour/GuidedTourContext.tsx
// MOTOR do tutorial guiado. Usa o Driver.js para destacar elementos e mostrar o balão; todo o
// resto (fluxos, progresso, pontos, navegação entre telas) é nosso. Um passo por vez: cada passo é
// um `driver().highlight(...)`, o que permite atravessar rotas diferentes (o Driver.js nativo
// assume uma única página). Documentação: docs/ux/funcionalidades/onboarding-tour.md

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import './guided-tour.css';
import { FIRST_FLOW_ID, LEVEL_THRESHOLDS, TOUR_FLOWS } from './flows';
import { takeTourAutoStart, tourStorage } from './storage';
import type { FlowProgress, TourFlow, TourState, TourStatus } from './types';

interface GuidedTourValue {
  /** Falso para contas que não vieram do "Criar conta": o helper e os balões não aparecem. */
  enabled: boolean;
  flows: TourFlow[];
  progress: Record<string, FlowProgress>;
  points: number;
  /** Índice do nível atual (0 a LEVEL_THRESHOLDS.length - 1). */
  levelIndex: number;
  runningFlowId: string | null;
  /** Inicia (ou retoma, se estava em andamento/pausado) um fluxo. */
  startFlow: (id: string) => void;
  /** Recomeça um fluxo do primeiro passo. */
  restartFlow: (id: string) => void;
  /** Apaga todo o progresso do usuário. */
  resetAll: () => void;
}

const Ctx = createContext<GuidedTourValue | null>(null);

/** Fora do provider (telas públicas, testes) o tutorial fica desligado em vez de quebrar. */
const DISABLED: GuidedTourValue = {
  enabled: false,
  flows: [],
  progress: {},
  points: 0,
  levelIndex: 0,
  runningFlowId: null,
  startFlow: () => {},
  restartFlow: () => {},
  resetAll: () => {},
};

export const useGuidedTour = (): GuidedTourValue => useContext(Ctx) ?? DISABLED;

const nowIso = () => new Date().toISOString();

/** Espera um elemento aparecer no DOM (as telas carregam depois da navegação). */
/** Espera indefinidamente (até o fluxo mudar) o seletor aparecer: usado por passos que dependem da ação do usuário. */
function waitUntilPresent(selector: string, isCancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const tick = () => {
      if (isCancelled()) return resolve(false);
      if (document.querySelector(selector)) return resolve(true);
      window.setTimeout(tick, 200);
    };
    tick();
  });
}

function waitForElement(selector: string, timeoutMs: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - started >= timeoutMs) return resolve(null);
      window.setTimeout(tick, 120);
    };
    tick();
  });
}

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.tour;
  const userKey = (user as { uuid?: string } | null)?.uuid ?? 'anon';

  const [state, setState] = useState<TourState>(() => tourStorage.load(userKey));
  const [runningFlowId, setRunningFlowId] = useState<string | null>(null);
  /** Passo pausado pelo usuário (para digitar sem o balão): volta sozinho na próxima etapa. */
  const [paused, setPaused] = useState<{ flowId: string; index: number } | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);
  /** Passo exibido agora (para o "Pular tutorial" fixo no canto saber onde parou). */
  const currentRef = useRef<{ flowId: string; index: number } | null>(null);

  // recarrega ao trocar de usuário
  useEffect(() => {
    setState(tourStorage.load(userKey));
  }, [userKey]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const driverRef = useRef<Driver | null>(null);
  const programmaticDestroy = useRef(false);
  const detachRef = useRef<(() => void) | null>(null);
  const pendingRef = useRef<string | null | undefined>(undefined);
  /** Evita que um passo antigo (ainda esperando elemento) apareça depois de o fluxo mudar. */
  const runToken = useRef(0);

  const commit = useCallback(
    (updater: (s: TourState) => TourState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      tourStorage.save(userKey, next);
    },
    [userKey]
  );

  const setFlowProgress = useCallback(
    (flowId: string, status: TourStatus, stepIndex: number) =>
      commit((s) => ({
        ...s,
        flows: {
          ...s.flows,
          [flowId]: {
            status,
            stepIndex,
            updatedAt: nowIso(),
            completedAt: status === 'completed' ? nowIso() : s.flows[flowId]?.completedAt,
          },
        },
      })),
    [commit]
  );

  const teardown = useCallback(() => {
    document.body.classList.remove('cerne-tour-passthrough');
    setPaused(null);
    resumeRef.current = null;
    detachRef.current?.();
    detachRef.current = null;
    if (driverRef.current) {
      programmaticDestroy.current = true;
      try {
        driverRef.current.destroy();
      } catch {
        /* já destruído */
      }
      driverRef.current = null;
      programmaticDestroy.current = false;
    }
  }, []);

  const runStep = useCallback(
    async (flow: TourFlow, index: number, token: number): Promise<void> => {
      teardown();
      if (token !== runToken.current) return;

      if (index >= flow.steps.length) {
        setFlowProgress(flow.id, 'completed', flow.steps.length - 1);
        setRunningFlowId(null);
        return;
      }
      const step = flow.steps[index];
      setFlowProgress(flow.id, 'in_progress', index);
      currentRef.current = { flowId: flow.id, index };

      if (step.route && !window.location.pathname.startsWith(step.route)) navigate(step.route);

      // passo ligado a um estado da tela (ex.: etapa N do assistente): só aparece quando ele ocorre
      if (step.showWhen) {
        // se o usuário já está em outra etapa do assistente (ex.: retomou o tutorial), salta para o
        // passo que corresponde ao que está na tela, em vez de ficar esperando em silêncio
        const here = await waitForElement(step.showWhen, 1200);
        if (token !== runToken.current) return;
        if (!here) {
          const match = flow.steps.findIndex((st) => st.showWhen && document.querySelector(st.showWhen));
          if (match >= 0 && match !== index) return runStep(flow, match, token);
        }
        const ok = await waitUntilPresent(step.showWhen, () => token !== runToken.current);
        if (!ok || token !== runToken.current) return;
      }

      let el: Element | null = null;
      if (step.element) {
        el = await waitForElement(step.element, step.waitMs ?? 4000);
        if (token !== runToken.current) return;
        if (!el && step.optional) return runStep(flow, index + 1, token);
      }

      const go = (to: number) => void runStep(flow, to, token);
      const last = index === flow.steps.length - 1;
      const clickToAdvance = !!(step.advanceOn === 'click' && el);
      const autoAdvance = clickToAdvance || !!step.advanceWhen;

      const d = driver({
        stagePadding: 6,
        stageRadius: 10,
        // passos que esperam o usuário agir na tela (ex.: preencher o formulário): fundo leve e
        // sem bloquear cliques; os demais escurecem a tela e focam o elemento
        overlayOpacity: step.advanceWhen ? 0.18 : 0.55,
        // nesses passos, clicar fora (para preencher campos) NÃO fecha o tutorial
        ...(step.advanceWhen ? { overlayClickBehavior: () => {} } : {}),
        smoothScroll: true,
        allowClose: true,
        popoverClass: 'cerne-tour',
        onPopoverRender: (popover) => {
          const progress = document.createElement('span');
          progress.className = 'cerne-tour-progress';
          progress.textContent = t.stepOf.replace('{n}', String(index + 1)).replace('{t}', String(flow.steps.length));
          popover.footer.prepend(progress);
          // passos em que o usuário precisa digitar: "Pausar" esconde o balão sem perder o fio; o
          // tutorial volta sozinho na próxima etapa (ou pelo botão Continuar da barrinha)
          if (step.advanceWhen) {
            const pause = document.createElement('button');
            pause.type = 'button';
            pause.className = 'cerne-tour-pause';
            pause.textContent = t.resume;
            pause.onclick = () => {
              programmaticDestroy.current = true;
              try {
                driverRef.current?.destroy();
              } catch {
                /* já destruído */
              }
              programmaticDestroy.current = false;
              driverRef.current = null;
              document.body.classList.remove('cerne-tour-passthrough');
              resumeRef.current = () => void runStep(flow, index, token);
              setPaused({ flowId: flow.id, index });
            };
            popover.footer.appendChild(pause);
          }
        },
        onDestroyed: () => {
          // fechou pelo X, Esc ou clique fora: tratamos como "pausar" (fica salvo)
          document.body.classList.remove('cerne-tour-passthrough');
          if (programmaticDestroy.current) return;
          detachRef.current?.();
          detachRef.current = null;
          driverRef.current = null;
          setFlowProgress(flow.id, 'skipped', index);
          setRunningFlowId(null);
        },
      });
      driverRef.current = d;
      document.body.classList.toggle('cerne-tour-passthrough', !!step.advanceWhen);

      d.highlight({
        element: el ?? undefined,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? 'bottom',
          align: 'start',
          showButtons: autoAdvance ? ['previous', 'close'] : ['next', 'previous', 'close'],
          nextBtnText: last ? t.done : t.next,
          prevBtnText: t.prev,
          onNextClick: () => go(index + 1),
          onPrevClick: () => go(Math.max(0, index - 1)),
        },
      });

      // avança sozinho quando a tela chega ao estado seguinte (ex.: o usuário foi para a próxima etapa)
      if (step.advanceWhen) {
        const sel = step.advanceWhen;
        const timer = window.setInterval(() => {
          if (token !== runToken.current) return window.clearInterval(timer);
          if (document.querySelector(sel)) {
            window.clearInterval(timer);
            detachRef.current = null;
            go(index + 1);
          }
        }, 250);
        detachRef.current = () => window.clearInterval(timer);
      }

      if (clickToAdvance && el) {
        const onClick = () => {
          detachRef.current?.();
          detachRef.current = null;
          // deixa o clique original navegar/abrir antes de seguir
          window.setTimeout(() => go(index + 1), 250);
        };
        el.addEventListener('click', onClick, { once: true });
        detachRef.current = () => el!.removeEventListener('click', onClick);
      }
    },
    [navigate, setFlowProgress, t, teardown]
  );

  const begin = useCallback(
    (flowId: string, fromStart: boolean) => {
      const flow = TOUR_FLOWS.find((f) => f.id === flowId);
      if (!flow) return;
      runToken.current += 1;
      const saved = stateRef.current.flows[flowId];
      const index = fromStart || !saved || saved.status === 'completed' ? 0 : saved.stepIndex;
      setRunningFlowId(flowId);
      void runStep(flow, index, runToken.current);
    },
    [runStep]
  );

  const startFlow = useCallback((id: string) => begin(id, false), [begin]);
  const restartFlow = useCallback((id: string) => begin(id, true), [begin]);

  const resetAll = useCallback(() => {
    runToken.current += 1;
    teardown();
    setRunningFlowId(null);
    commit((s) => ({ enabled: s.enabled, flows: {}, autoStart: null }));
  }, [commit, teardown]);

  // Início automático logo após criar a conta (marca gravada pelo onboarding "Criar conta").
  useEffect(() => {
    // lido uma única vez (o StrictMode do React monta o efeito duas vezes em dev)
    if (pendingRef.current === undefined) pendingRef.current = takeTourAutoStart();
    const pending = pendingRef.current;
    if (!pending) return;
    // veio do "Criar conta": liga o tutorial para este usuário
    commit((s) => ({ ...s, enabled: true }));
    const id = window.setTimeout(() => begin(pending === 'default' ? FIRST_FLOW_ID : pending, true), 900);
    return () => window.clearTimeout(id);
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // limpa o balão ao desmontar
  useEffect(() => () => teardown(), [teardown]);

  const points = useMemo(
    () => TOUR_FLOWS.reduce((sum, f) => sum + (state.flows[f.id]?.status === 'completed' ? f.points : 0), 0),
    [state]
  );
  const levelIndex = useMemo(() => LEVEL_THRESHOLDS.reduce((acc, min, i) => (points >= min ? i : acc), 0), [points]);

  const skipAll = () => {
    const cur = currentRef.current;
    runToken.current += 1;
    teardown();
    if (cur) setFlowProgress(cur.flowId, 'skipped', cur.index);
    setRunningFlowId(null);
  };
  // sempre disponível enquanto um tutorial roda, no canto inferior esquerdo
  const skipButton = runningFlowId && (
    <Text
      as="button"
      position="fixed"
      left="16px"
      bottom="16px"
      zIndex={10001}
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      bg="cardBG"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="full"
      boxShadow="0 6px 20px rgba(0,0,0,.18)"
      px={4}
      py="6px"
      onClick={skipAll}
    >
      {t.skip}
    </Text>
  );

  const pausedBar = paused && (
    <Flex position="fixed" left="50%" bottom="84px" transform="translateX(-50%)" zIndex={9999} align="center" gap={3} bg="cardBG" borderWidth="1px" borderColor="border.muted" borderRadius="full" boxShadow="0 10px 30px rgba(0,0,0,.2)" pl={4} pr={2} py={2} role="status">
      <Box boxSize="8px" borderRadius="full" bg="green.500" />
      <Text fontSize="sm">{t.pausedNote}</Text>
      <Text as="button" fontSize="sm" fontWeight="semibold" color="white" bg="green.600" borderRadius="full" px={3} py="4px" onClick={() => resumeRef.current?.()}>
        {t.showHint}
      </Text>
    </Flex>
  );

  const value = useMemo<GuidedTourValue>(
    () => ({ enabled: !!state.enabled, flows: TOUR_FLOWS, progress: state.flows, points, levelIndex, runningFlowId, startFlow, restartFlow, resetAll }),
    [state.enabled, state.flows, points, levelIndex, runningFlowId, startFlow, restartFlow, resetAll]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {pausedBar}
      {skipButton}
    </Ctx.Provider>
  );
}
