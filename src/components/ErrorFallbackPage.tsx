import { useEffect } from 'react';

import { Accordion, Center, Flex, Image, Stack, Text } from '@chakra-ui/react';
import { FallbackProps } from 'react-error-boundary';

import { useLanguage } from '@/hooks/useLanguage';

import {
  hasAttemptedDynamicImportReload,
  isDynamicImportError,
  reloadForDynamicImportError,
} from '@/utils/dynamic-import-reload';

import { Button } from './Button';

import bugComputer from '@/assets/manutencao.png';

export function ErrorFallbackPage({ error, resetErrorBoundary }: FallbackProps) {
  const { languageGB } = useLanguage();
  const { errorFallback } = languageGB.common;

  // TASK-063-MAPA-06 (bug #3, F-036) — rede de segunda camada: se o erro de
  // chunk dinâmico chegou aqui como exceção React (em vez de/além do evento
  // `vite:preloadError` capturado em `main.tsx`), recarrega automaticamente
  // 1 única vez em vez de mostrar a tela de manutenção genérica. Calculado
  // fora do efeito (peek síncrono) para poder pular o render da tela de erro
  // já no primeiro ciclo, evitando o "flash" da UI de manutenção.
  const shouldAutoReload = isDynamicImportError(error) && !hasAttemptedDynamicImportReload();

  useEffect(() => {
    if (shouldAutoReload) {
      reloadForDynamicImportError();
    }
  }, [shouldAutoReload]);

  if (shouldAutoReload) {
    // Recarregando — não renderiza a tela de erro genérica.
    return null;
  }

  function onHome() {
    window.location.href = '/';
    resetErrorBoundary();
  }

  function reset() {
    resetErrorBoundary();
    window.location.reload();
  }

  // TODO funcionalidade responsavel por registrar errors de procedencia de desenvolvimento web.

  // useEffect(() => {
  //   if (isMount) {
  //     registerError.mutateAsync();
  //   }
  // }, [error, isMount]);

  // const registerError = useMutation({
  //   mutationFn: tryRegisterError,
  //   onSuccess() {
  //     toast(
  //       customToast({
  //         status: 'success',
  //         description: `<strong>Error</strong> registrado no log de error com sucesso!`,
  //       }),
  //     );
  //   },
  //   onError() {
  //     toast(
  //       customToast({
  //         status: 'error',
  //         description: `Erro não registrado favor entre em contato com o suporte`,
  //       }),
  //     );
  //   },
  // });

  // async function tryRegisterError() {
  //   console.log('tela de error', error);
  //   console.log(window.location.href);
  // }

  return (
    <Flex
      width="full"
      height="100vh"
      background="linear-gradient(to right, #3C4C70, #3CFCA0)"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      backgroundSize="100% 100%"
      position="relative"
      _before={{
        position: 'absolute',
        top: 0,
        width: 'full',
        height: 'full',
        backgroundColor: 'linear-gradient(to right, #3C4C70, #3CFCA0)',
        content: '""',
        animation: 'changeColor 10s infinite alternate',
      }}
    >
      <Center flexDirection="column" padding="4" flex="1" background="rgba(0, 0, 0, 0.4)">
        <Image src={bugComputer} boxSize="450px" objectFit="contain" />
        <Text color="white">{errorFallback.title}</Text>
        <Stack gap={4} marginTop={4}>
          {error?.message && (
            <Accordion.Root collapsible size="sm">
              <Accordion.Item value="details">
                <Accordion.ItemTrigger color="white" cursor="pointer">
                  <Text flex="1" fontSize="sm">
                    {errorFallback.detailsToggle}
                  </Text>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <Text color="white" fontSize="sm" opacity={0.8}>
                      {error.message}
                    </Text>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          )}
          <Flex gap="4">
            <Button title={errorFallback.reloadButton} marginTop="10" onClick={reset}>
              {errorFallback.reloadButton}
            </Button>
            <Button title={errorFallback.homeButton} marginTop="10" onClick={onHome}>
              {errorFallback.homeButton}
            </Button>
          </Flex>
        </Stack>
      </Center>
    </Flex>
  );
}
