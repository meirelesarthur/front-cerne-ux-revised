/* eslint-disable import/no-unresolved */
// src/components/ReloadPromptSW.tsx
//
// Estratégia de atualização segura para plataforma interativa:
//
// Gatilhos de atualização (3 cenários):
//   1. Botão "Atualizar Agora" no toast → aplica imediatamente
//   2. Troca de rota (navegação voluntária) → aplica automaticamente
//   3. F5 / reload manual → detecta via sessionStorage flag → aplica na recarga
//
// O que NÃO acontece:
//   - Nunca recarrega a página automaticamente sem ação do usuário
//   - Protege: streaming SSE, formulários, processos em andamento
//
// Fluxo técnico:
//   registerType: 'prompt' → novo SW fica "waiting"
//   Polling (30s) → detecta novo sw.js → needRefresh = true
//   needRefresh → mostra toast + marca sessionStorage('sw-pending-update')
//   F5 → componente re-monta → vê flag no sessionStorage → aplica update
//   Troca de rota → pathname muda → aplica update

import { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useLoad } from '@/hooks/useLoad';

import { cleanServiceWorkerAndCache } from '@/utils/service-worker-cleaner';

const POLL_INTERVAL_MS = 1000 * 60 * 0.5; // 30 segundos
const UPDATE_TOAST_ID = 'sw-update-toast';
const PENDING_UPDATE_KEY = 'sw-pending-update';
// TASK-063-MAPA-05 (bug #3, F-036, 063-est03-9-reprovacoes) — janela de
// tolerância do Cenário 2 (troca de rota): tempo dado para o `lazy(() =>
// import(...))` da rota de destino resolver ANTES de `applyUpdate()` apagar
// os caches Workbox que poderiam estar servindo/interceptando esse mesmo
// chunk. Usado só como timeout de fallback do `requestIdleCallback` (que já
// aguarda o navegador ficar ocioso — indício de que a navegação assentou).
const ROUTE_UPDATE_APPLY_DELAY_MS = 2000;

function ReloadPromptSW() {
  const { languageGB } = useLanguage();
  const { toggleLoading } = useLoad();
  const { pathname } = useLocation();
  const pendingUpdateRef = useRef(false);
  const initialPathnameRef = useRef(pathname);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      console.log('✅ Service Worker registrado:', swUrl);

      // Polling periódico para detectar novas versões
      setInterval(async () => {
        if (registration.installing) return;
        if ('connection' in navigator && !navigator.onLine) return;

        try {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
              cache: 'no-store',
              'cache-control': 'no-cache',
            },
          });

          if (resp?.status === 200) await registration.update();
        } catch {
          // Falha de rede silenciosa — tentará no próximo ciclo
        }
      }, POLL_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.error('❌ SW registration error:', error);
    },
  });

  /**
   * Aplica a atualização: limpa caches antigos + envia SKIP_WAITING + recarrega
   */
  async function applyUpdate() {
    try {
      toggleLoading(true);
      toaster.dismiss(UPDATE_TOAST_ID);
      sessionStorage.removeItem(PENDING_UPDATE_KEY);
      pendingUpdateRef.current = false;

      console.log('🔄 Aplicando atualização do Service Worker...');

      // Limpar caches do Workbox antes de ativar o novo SW
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const workboxCaches = cacheNames.filter(
          (name) => name.includes('workbox-precache') || name.includes('workbox-runtime')
        );

        if (workboxCaches.length > 0) {
          console.log('🧹 Limpando caches do Workbox:', workboxCaches);
          for (const cacheName of workboxCaches) {
            await caches.delete(cacheName);
          }
        }
      }

      // Envia SKIP_WAITING ao SW waiting + recarrega a página
      await updateServiceWorker(true);
      console.log('✅ Service Worker atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar Service Worker:', error);

      // Fallback: limpeza completa
      toaster.create({
        title: languageGB.defaltStrings.serviceWorker.updateErrorTitle,
        description: languageGB.defaltStrings.serviceWorker.updateErrorDescription,
        type: 'warning',
        duration: 2000,
      });

      const success = await cleanServiceWorkerAndCache({
        clearStorage: true,
        onProgress: (msg) => console.log(msg),
      });

      if (success) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } finally {
      toggleLoading(false);
    }
  }

  // Efeito principal: quando needRefresh muda para true
  useEffect(() => {
    if (!needRefresh) return;

    // Cenário 3: F5/reload — flag já existe no sessionStorage de antes do reload
    const isReload = sessionStorage.getItem(PENDING_UPDATE_KEY) === 'true';
    if (isReload) {
      console.log('🔄 Reload detectado com atualização pendente — aplicando imediatamente...');
      applyUpdate();
      return;
    }

    // Cenário 1: primeira detecção — mostra toast + salva flag para F5
    console.log('🔔 Nova versão disponível. Toast exibido, aguardando ação do usuário.');
    pendingUpdateRef.current = true;
    sessionStorage.setItem(PENDING_UPDATE_KEY, 'true');

    queueMicrotask(() => {
      toaster.create({
        id: UPDATE_TOAST_ID,
        title: languageGB.defaltStrings.serviceWorker.updateAvailableTitle,
        description: languageGB.defaltStrings.serviceWorker.updateAvailableDescription,
        type: 'info',
        duration: 1000 * 60 * 60, // 1 hora (persistente)
        action: {
          label: languageGB.defaltStrings.serviceWorker.updateNowButton,
          onClick: () => applyUpdate(),
        },
      });
    });
  }, [needRefresh]);

  // Cenário 2: troca de rota → se há atualização pendente, aplica automaticamente.
  // Ignora o pathname inicial (mount) para não aplicar antes de needRefresh ser detectado.
  //
  // TASK-063-MAPA-05 (bug #3, F-036) — NÃO dispara `applyUpdate()` de forma
  // síncrona na MESMA troca de rota: se o destino usa `lazy(() =>
  // import(...))` e o chunk nunca foi buscado nesta sessão, apagar os caches
  // Workbox (dentro de `applyUpdate`) enquanto esse fetch está em voo derruba
  // o import com "Failed to fetch dynamically imported module" antes do
  // React Router terminar de montar a nova tela. Adia a aplicação para o
  // navegador ficar ocioso (`requestIdleCallback`, com timeout de fallback
  // via `setTimeout` para navegadores sem suporte) — tempo suficiente para o
  // lazy-import da rota assentar antes da limpeza de cache acontecer.
  useEffect(() => {
    if (pathname === initialPathnameRef.current) return;
    if (!pendingUpdateRef.current) return;

    console.log(
      '🔄 Troca de rota detectada com atualização pendente — agendando aplicação após o chunk da rota assentar...'
    );

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let didRun = false;

    const runApplyUpdate = () => {
      if (didRun) return;
      didRun = true;
      // Outro gatilho (toast manual, F5) pode já ter aplicado a atualização
      // enquanto esperávamos — `pendingUpdateRef` já teria sido zerado por
      // `applyUpdate()` nesse caso.
      if (!pendingUpdateRef.current) return;

      console.log('🔄 Aplicando atualização adiada pós-navegação...');
      applyUpdate();
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(runApplyUpdate, {
        timeout: ROUTE_UPDATE_APPLY_DELAY_MS,
      });
    } else {
      timeoutHandle = setTimeout(runApplyUpdate, ROUTE_UPDATE_APPLY_DELAY_MS);
    }

    return () => {
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [pathname]);

  return null;
}

export default ReloadPromptSW;
