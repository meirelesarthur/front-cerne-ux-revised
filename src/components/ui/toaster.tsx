import {
  Toaster as ChakraToaster,
  Box,
  createToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
} from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
});

// Toasts do tipo "error" exigem dismiss manual — sem auto-close. Fiel ao
// `ToastRow` do design system `cerne` ("autoCloses = toast.type !== 'error'",
// WCAG 2.2.1/2.2.2: dar tempo do usuário ler/agir num erro). Demais tipos
// (success/info/warning/loading) mantêm os defaults do zag-js — só
// interceptamos "error", e só quando quem chamou não passou uma `duration`
// explícita (nunca sobrescreve uma intenção explícita do call site).
type ToasterData = Parameters<typeof toaster.create>[0];

function withPersistentError(data: ToasterData): ToasterData {
  return {
    ...data,
    duration: data.duration ?? Infinity,
    closable: data.closable ?? true,
    meta: { closable: true, ...(data.meta ?? {}) },
  };
}

const baseCreate = toaster.create.bind(toaster);
toaster.create = ((data: ToasterData) =>
  data?.type === 'error'
    ? baseCreate(withPersistentError(data))
    : baseCreate(data)) as typeof toaster.create;

const baseError = toaster.error.bind(toaster);
toaster.error = ((data: ToasterData) =>
  baseError(withPersistentError(data))) as typeof toaster.error;

/** Duração do Chakra quando o chamador não informa uma. */
const DURACAO_PADRAO_MS = 5000;

const ID_DO_ESTILO = 'cerne-toast-progress';

/**
 * Injeta o keyframe da barra uma única vez.
 *
 * É `<style>` e não token de tema porque a barra precisa de um keyframe nomeado,
 * e criar um no tema espalharia a mudança pela app inteira sem necessidade.
 *
 * O bloco de `prefers-reduced-motion` deixa a barra desenhada porém parada: quem
 * pediu menos movimento não perde a informação de que o toast fecha sozinho.
 */
function injetarKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ID_DO_ESTILO)) return;

  const estilo = document.createElement('style');
  estilo.id = ID_DO_ESTILO;
  estilo.textContent = `
    @keyframes cerne-toast-progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes cerne-toast-progress {
        from { transform: scaleX(1); }
        to   { transform: scaleX(1); }
      }
    }
  `;
  document.head.appendChild(estilo);
}

/**
 * Contagem regressiva no rodapé do toast.
 *
 * ⚠️ O raio vive AQUI, na própria barra (`borderBottomRadius`), e não num
 * `overflow: hidden` no root. Recortar o root faz o toast sumir: o grupo é
 * `position: fixed` com `height: 0` e a entrada é animada por transform a partir
 * dele. A barra acompanhar a curva sozinha custa uma linha e não toca na
 * geometria da animação.
 *
 * As cores saem de `currentColor` — a cor do texto do próprio toast — então a
 * barra contrasta com a superfície dela em qualquer tema e qualquer tipo, sem um
 * token por variante.
 *
 * @param {{ duracao: number }} props - `duracao` em ms (a duração do toast).
 * @return {JSX.Element} A barra de contagem regressiva do rodapé do toast.
 */
function BarraDeProgresso({ duracao }: { duracao: number }) {
  injetarKeyframes();

  return (
    <Box
      position="absolute"
      insetX="0"
      bottom="0"
      // Altura = raio, não a espessura da barra.
      //
      // ⚠️ O CSS ENCOLHE o raio quando ele não cabe na caixa: num invólucro de
      // 4px, `borderRadius: 12px` vira ~4px, a curva da barra fica menos redonda
      // que a do toast e a ponta escapa pela direita. Com 12px de altura o raio
      // cabe inteiro e o recorte casa com o canto do toast. A faixa visível
      // continua com 4px — os 8px de cima são transparentes.
      height="12px"
      borderBottomRadius="xl"
      overflow="hidden"
      // O invólucro cobre 12px do rodapé; sem isto ele roubaria o clique do
      // botão de fechar quando o toast é curto.
      pointerEvents="none"
      aria-hidden="true"
    >
      {/*
        Trilha e preenchimento são IRMÃOS, não aninhados.
        ⚠️ Opacidade de pai multiplica a do filho: com o preenchimento dentro da
        trilha, 0.9 × 0.25 dava 0.22 efetivo — a barra existia, mas era
        indetectável a olho, e o movimento junto com ela. Lado a lado, cada um
        carrega a sua.
      */}
      <Box position="absolute" insetX="0" bottom="0" height="4px" bg="currentColor" opacity={0.2} />
      <Box
        position="absolute"
        insetX="0"
        bottom="0"
        height="4px"
        bg="currentColor"
        opacity={0.85}
        transformOrigin="left center"
        animation={`cerne-toast-progress ${duracao}ms linear forwards`}
        css={{
          // O Chakra pausa o toast no hover; a barra tem de parar junto, senão
          // ela termina com o toast ainda aberto — o oposto do que promete.
          '[data-scope="toast"][data-part="root"]:hover &': {
            animationPlayState: 'paused',
          },
        }}
      />
    </Box>
  );
}

export const Toaster = () => {
  return (
    <Portal>
      {/* @ts-ignore - Chakra UI v3 Toaster props incompatibility */}
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast: any) => {
          // `loading` não fecha sozinho; duração ausente cai no padrão do Chakra.
          // Infinita ou não numérica (ex.: erro persistente via
          // `withPersistentError`) significa "fica até alguém fechar" — e aí a
          // barra prometeria um fechamento que não vem.
          const duracao = typeof toast.duration === 'number' ? toast.duration : DURACAO_PADRAO_MS;
          const fechaSozinho = toast.type !== 'loading' && Number.isFinite(duracao) && duracao > 0;

          return (
            <Toast.Root
              width={{ md: 'sm' }}
              // Bordas mais arredondadas, a pedido.
              //
              // ⚠️ NÃO acrescentar `overflow="hidden"` aqui. O grupo de toasts é
              // `position: fixed` com `height: 0`, e a entrada é animada por
              // transform a partir dele; recortar o root nessa geometria faz o
              // toast sumir por completo.
              borderRadius="xl"
            >
              {toast.type === 'loading' ? (
                <Spinner size="sm" color="blue.solid" />
              ) : (
                <Toast.Indicator />
              )}
              <Stack gap="1" flex="1" maxWidth="100%">
                {/* @ts-ignore - Toast component props */}
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {/* @ts-ignore - Toast component props */}
                {toast.description && (
                  // @ts-ignore - Toast component props
                  <Toast.Description>{toast.description}</Toast.Description>
                )}
              </Stack>
              {/* @ts-ignore - Toast component props */}
              {toast.action && (
                // @ts-ignore - Toast component props
                <Toast.ActionTrigger onClick={toast.action.onClick}>
                  {toast.action.label}
                </Toast.ActionTrigger>
              )}
              {toast.meta?.closable !== false && <Toast.CloseTrigger />}

              {fechaSozinho && <BarraDeProgresso duracao={duracao} />}
            </Toast.Root>
          );
        }}
      </ChakraToaster>
    </Portal>
  );
};
