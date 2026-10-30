// src/components/ui/ErrorStatusPage.tsx
// Tela cheia de ERRO por status HTTP (design "404" do Figma GB-CERNE, nó 54212:6543): barra com
// logo e "Voltar"; texto à esquerda (código, título, mensagem, cartão "Retorno" com o JSON e dois
// botões) e a ilustração à direita. Só apresentação: o texto vem de `pages/Errors/copy.ts` e o
// chamador decide o status. Serve para qualquer faixa 4xx/5xx.

import { useState } from 'react';

import { Box, Flex, Image, Text } from '@chakra-ui/react';

import logo from '@/assets/Logo.svg';
import cow from '@/assets/error-cow.png';
import { Button } from '@/components/Button';
import { Icon } from '@/components/ui/Icon';

export interface ErrorStatusPageProps {
  status: number;
  /** Título grande ("Algo não saiu como o esperado..."). */
  headline: string;
  /** Mensagem do corpo. */
  message: string;
  /** Nome do status para o JSON de retorno ("Not Found"). */
  statusName: string;
  /** Mensagem técnica do retorno (opcional; padrão = a mensagem do corpo). */
  detail?: string;
  labels: { back: string; returned: string; copy: string; copied: string; home: string; retry: string };
  onBack: () => void;
  onHome: () => void;
  onRetry: () => void;
}

export function ErrorStatusPage({ status, headline, message, statusName, detail, labels, onBack, onHome, onRetry }: ErrorStatusPageProps) {
  const [copied, setCopied] = useState(false);
  const payload = JSON.stringify({ timestamp: new Date().toISOString(), status, error: statusName, message: detail ?? message }, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão de área de transferência */
    }
  };

  return (
    <Flex direction="column" minH="100vh" bg="contentOuterBG" p="8px" gap="8px">
      <Flex as="header" align="center" justify="space-between" h="48px" px={6}>
        <img src={logo} alt="GB Cerne" style={{ height: 28, width: 'auto' }} />
        <Flex as="button" align="center" gap="8px" fontSize="base" onClick={onBack}>
          <Icon name="chevron-left" size="sm" />
          {labels.back}
        </Flex>
      </Flex>

      <Flex flex={1} bg="cardBG" borderRadius="2xl" overflow="hidden" align="center" justify="center" px={{ base: 6, lg: '6vw' }} py={10} gap={{ base: 8, lg: '60px' }} direction={{ base: 'column', lg: 'row' }}>
        <Flex direction="column" gap="32px" flex={{ lg: "6 1 0" }} minW={0} w="full" maxW={{ lg: "none" }}>
          <Box>
            <Text as="h1" fontSize="50px" fontWeight="700" lineHeight="1" letterSpacing="-0.02em">
              {status}
            </Text>
            <Text as="h2" fontSize="36px" fontWeight="400" lineHeight="1.15" mt="24px" maxW="420px">
              {headline}
            </Text>
            <Text fontSize="lg" color="fg.muted" mt="28px" maxW="431px" lineHeight="1.6">
              {message}
            </Text>
          </Box>

          <Box bg="semanticNeutral.100" borderRadius="lg" p="14px 17px" maxH="156px" overflow="auto">
            <Flex align="center" justify="space-between" mb="6px">
              <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.06em" textTransform="uppercase" color="fg.muted">
                {labels.returned}
              </Text>
              <Flex as="button" align="center" gap="4px" fontSize="xs" color="fg.muted" aria-label={labels.copy} title={labels.copy} onClick={copy}>
                <Icon name={copied ? 'check' : 'copy'} size="xs" />
                {copied ? labels.copied : null}
              </Flex>
            </Flex>
            <Box as="pre" fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap" wordBreak="break-word" m={0}>
              {payload}
            </Box>
          </Box>

          <Flex gap="16px" direction={{ base: 'column', sm: 'row' }}>
            <Button title={labels.home} variant="secondary" onClick={onHome} flex={1} />
            <Button title={labels.retry} onClick={onRetry} flex={1} />
          </Flex>
        </Flex>

        <Flex display={{ base: 'none', lg: 'flex' }} flex="4 1 0" minW={0} align="center" justify="center" alignSelf="stretch" position="relative">
          <Image
            src={cow}
            alt=""
            aria-hidden="true"
            position="absolute"
            w="140%"
            maxW="none"
            right="-8%"
            objectFit="contain"
            style={{ maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)' }}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

export default ErrorStatusPage;
