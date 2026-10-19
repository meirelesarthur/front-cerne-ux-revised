// Componente de card para status e configuração do 2FA
import { useState } from 'react';
import {
  Box,
  Badge,
  Button,
  Dialog,
  Flex,
  HStack,
  Icon,
  Input,
  Portal,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiShield, FiCheck, FiX, FiKey, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

import {
  useTwoFactorStatus,
  useTwoFactorSetup,
  useTwoFactorEnable,
  useTwoFactorDisable,
  useTwoFactorRegenerateBackupCodes,
} from '@/hooks/useTwoFactor';
import { useLanguage } from '@/hooks/useLanguage';
import type {
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
  TwoFactorRegenerateBackupCodesResponse,
} from '@/@types/v2/two-factor';

export function TwoFactorSettings() {
  // Traduções
  const { languageGB } = useLanguage();

  // Estado local
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  
  // Modais
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  // Queries & Mutations
  const { data: statusData, isLoading: isLoadingStatus, refetch: refetchStatus } = useTwoFactorStatus();
  
  const setupMutation = useTwoFactorSetup({
    onSuccess: (data) => {
      setSetupData(data);
      setIsSetupModalOpen(true);
    },
  });

  const enableMutation = useTwoFactorEnable({
    onSuccess: (data: TwoFactorEnableResponse) => {
      setBackupCodes(data.backup_codes);
      setSetupData(null);
      setVerificationCode('');
      setIsSetupModalOpen(false);
      setIsBackupCodesModalOpen(true);
      refetchStatus();
    },
  });

  const disableMutation = useTwoFactorDisable({
    onSuccess: () => {
      setDisableCode('');
      setIsDisableModalOpen(false);
      refetchStatus();
    },
  });

  const regenerateMutation = useTwoFactorRegenerateBackupCodes({
    onSuccess: (data: TwoFactorRegenerateBackupCodesResponse) => {
      setBackupCodes(data.backup_codes);
      setRegenerateCode('');
      setIsRegenerateModalOpen(false);
      setIsBackupCodesModalOpen(true);
      refetchStatus();
    },
  });

  const status = statusData?.data;
  const isEnabled = status?.enabled ?? false;

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleEnableTwoFactor = () => {
    if (verificationCode.length === 6) {
      enableMutation.mutate({ code: verificationCode });
    }
  };

  const handleDisableTwoFactor = () => {
    if (disableCode.length === 6) {
      disableMutation.mutate({ code: disableCode });
    }
  };

  const handleRegenerateBackupCodes = () => {
    if (regenerateCode.length === 6) {
      regenerateMutation.mutate({ code: regenerateCode });
    }
  };

  const copyBackupCodesToClipboard = () => {
    if (backupCodes) {
      const text = backupCodes.join('\n');
      navigator.clipboard.writeText(text);
    }
  };

  if (isLoadingStatus) {
    return (
      <Box
        bg="cardBG"
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor="borderColor"
      >
        <Flex justify="center" align="center" minH="120px">
          <Spinner size="lg" />
        </Flex>
      </Box>
    );
  }

  return (
    <>
      {/* Card Principal de 2FA */}
      <Box
        bg="cardBG"
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor="borderColor"
      >
        <Flex justify="space-between" align="flex-start" mb={4}>
          <HStack gap={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg={isEnabled ? 'green.900' : 'gray.700'}
            >
              <Icon as={FiShield} boxSize={6} color={isEnabled ? 'green.400' : 'gray.400'} />
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                {languageGB.common.profile.twoFactor.title}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {languageGB.common.profile.twoFactor.description}
              </Text>
            </Box>
          </HStack>
          <Badge
            colorPalette={isEnabled ? 'green' : 'gray'}
            size="lg"
            px={3}
            py={1}
          >
            {isEnabled ? (
              <HStack gap={1}>
                <Icon as={FiCheck} boxSize={3} />
                <Text>{languageGB.common.profile.twoFactor.enabled}</Text>
              </HStack>
            ) : (
              <HStack gap={1}>
                <Icon as={FiX} boxSize={3} />
                <Text>{languageGB.common.profile.twoFactor.disabled}</Text>
              </HStack>
            )}
          </Badge>
        </Flex>

        {isEnabled ? (
          <VStack align="stretch" gap={4}>
            {/* Info de quando foi ativado */}
            {status?.verified_at && (
              <Text fontSize="sm" color="fg.muted">
                {languageGB.common.profile.twoFactor.enabledAt} {new Date(status.verified_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}

            {/* Códigos de backup restantes */}
            <Box
              p={4}
              borderRadius="lg"
              bg="bg.subtle"
              border="1px solid"
              borderColor="borderColor"
            >
              <HStack justify="space-between">
                <HStack gap={2}>
                  <Icon as={FiKey} color="fg.muted" />
                  <Text fontSize="sm" color="fg.default">
                    {languageGB.common.profile.twoFactor.backupCodesRemaining}
                  </Text>
                </HStack>
                <Badge
                  colorPalette={(status?.backup_codes_remaining ?? 0) > 3 ? 'green' : 'yellow'}
                >
                  {status?.backup_codes_remaining ?? 0} / 10
                </Badge>
              </HStack>
              {(status?.backup_codes_remaining ?? 0) <= 3 && (
                <HStack mt={2} gap={1}>
                  <Icon as={FiAlertTriangle} color="yellow.400" boxSize={4} />
                  <Text fontSize="xs" color="yellow.400">
                    {languageGB.common.profile.twoFactor.lowBackupCodesWarning}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* Ações */}
            <Flex gap={3} wrap="wrap">
              <Button
                variant="outline"
                onClick={() => setIsRegenerateModalOpen(true)}
              >
                <HStack gap={1}>
                  <Icon as={FiRefreshCw} />
                  <Text>{languageGB.common.profile.twoFactor.regenerateBackupCodes}</Text>
                </HStack>
              </Button>
              <Button
                variant="outline_danger"
                onClick={() => setIsDisableModalOpen(true)}
              >
                {languageGB.common.profile.twoFactor.disable2FA}
              </Button>
            </Flex>
          </VStack>
        ) : (
          <VStack align="stretch" gap={4}>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.common.profile.twoFactor.appRecommendation}
            </Text>
            <Button
              colorPalette="blue"
              onClick={handleStartSetup}
              loading={setupMutation.isPending}
              w="fit-content"
            >
              <HStack gap={1}>
                <Icon as={FiShield} />
                <Text>{languageGB.common.profile.twoFactor.configure2FA}</Text>
              </HStack>
            </Button>
          </VStack>
        )}
      </Box>

      {/* Modal de Configuração */}
      {/* @ts-ignore - Chakra UI v3 Dialog props */}
      <Dialog.Root
        open={isSetupModalOpen}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) {
            setSetupData(null);
            setVerificationCode('');
          }
          setIsSetupModalOpen(e.open);
        }}
        size="md"
      >
        <Portal>
          {/* @ts-ignore */}
          <Dialog.Backdrop />
          {/* @ts-ignore */}
          <Dialog.Positioner>
            {/* @ts-ignore */}
            <Dialog.Content>
              {/* @ts-ignore */}
              <Dialog.Header>
                {/* @ts-ignore - Chakra UI v3 Dialog */}
                <Dialog.Title>{languageGB.common.profile.twoFactor.setupModalTitle}</Dialog.Title>
              </Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Body>
                {setupData && (
                  <VStack gap={6} align="center">
                    {/* QR Code */}
                    <Box
                      p={4}
                      bg="white"
                      borderRadius="lg"
                    >
                      <QRCodeSVG
                        value={`otpauth://totp/${setupData.issuer}:${setupData.account}?secret=${setupData.secret}&issuer=${setupData.issuer}`}
                        size={200}
                        level="H"
                      />
                    </Box>

                    <VStack gap={2} w="full">
                      <Text fontSize="sm" color="fg.muted" textAlign="center">
                        {languageGB.common.profile.twoFactor.scanQRCode}
                      </Text>
                      <Box
                        p={3}
                        bg="bg.subtle"
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="sm"
                        letterSpacing="2px"
                        userSelect="all"
                        w="full"
                        textAlign="center"
                      >
                        {setupData.manual_entry_key}
                      </Box>
                    </VStack>

                    {/* Input de verificação */}
                    <VStack gap={2} w="full">
                      <Text fontSize="sm" color="fg.default">
                        {languageGB.common.profile.twoFactor.enterDigitCode}
                      </Text>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        textAlign="center"
                        fontSize="2xl"
                        fontWeight="bold"
                        letterSpacing="8px"
                        w="200px"
                      />
                    </VStack>
                  </VStack>
                )}
              </Dialog.Body>
              {/* @ts-ignore */}
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setIsSetupModalOpen(false)}
                >
                  {languageGB.common.profile.twoFactor.cancel}
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleEnableTwoFactor}
                  loading={enableMutation.isPending}
                  disabled={verificationCode.length !== 6}
                >
                  {languageGB.common.profile.twoFactor.enable2FA}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Modal de Desativar 2FA */}
      {/* @ts-ignore */}
      <Dialog.Root
        open={isDisableModalOpen}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) setDisableCode('');
          setIsDisableModalOpen(e.open);
        }}
        size="sm"
      >
        <Portal>
          {/* @ts-ignore */}
          <Dialog.Backdrop />
          {/* @ts-ignore */}
          <Dialog.Positioner>
            {/* @ts-ignore */}
            <Dialog.Content>
              {/* @ts-ignore */}
              <Dialog.Header>
                {/* @ts-ignore - Chakra UI v3 Dialog */}
                <Dialog.Title>{languageGB.common.profile.twoFactor.disableModalTitle}</Dialog.Title>
              </Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Box
                    p={3}
                    bg="red.900"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="red.600"
                  >
                    <HStack gap={2}>
                      <Icon as={FiAlertTriangle} color="red.400" />
                      <Text fontSize="sm" color="red.200">
                        {languageGB.common.profile.twoFactor.disableWarning}
                      </Text>
                    </HStack>
                  </Box>
                  <Stack gap={2}>
                    <Text fontSize="sm" color="fg.default">
                      {languageGB.common.profile.twoFactor.enterCodeConfirm}
                    </Text>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                      placeholder={languageGB.common.profile.twoFactor.codePlaceholder}
                      textAlign="center"
                      fontSize="2xl"
                      fontWeight="bold"
                      letterSpacing="8px"
                    />
                  </Stack>
                </VStack>
              </Dialog.Body>
              {/* @ts-ignore */}
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setIsDisableModalOpen(false)}
                >
                  {languageGB.common.profile.twoFactor.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisableTwoFactor}
                  loading={disableMutation.isPending}
                  disabled={disableCode.length !== 6}
                >
                  {languageGB.common.profile.twoFactor.disableButton}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Modal de Regenerar Códigos de Backup */}
      {/* @ts-ignore */}
      <Dialog.Root
        open={isRegenerateModalOpen}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) setRegenerateCode('');
          setIsRegenerateModalOpen(e.open);
        }}
        size="sm"
      >
        <Portal>
          {/* @ts-ignore */}
          <Dialog.Backdrop />
          {/* @ts-ignore */}
          <Dialog.Positioner>
            {/* @ts-ignore */}
            <Dialog.Content>
              {/* @ts-ignore */}
              <Dialog.Header>
                {/* @ts-ignore - Chakra UI v3 Dialog */}
                <Dialog.Title>{languageGB.common.profile.twoFactor.regenerateModalTitle}</Dialog.Title>
              </Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Box
                    p={3}
                    bg="yellow.900"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="yellow.600"
                  >
                    <HStack gap={2}>
                      <Icon as={FiAlertTriangle} color="yellow.400" />
                      <Text fontSize="sm" color="yellow.200">
                        {languageGB.common.profile.twoFactor.regenerateWarning}
                      </Text>
                    </HStack>
                  </Box>
                  <Stack gap={2}>
                    <Text fontSize="sm" color="fg.default">
                      {languageGB.common.profile.twoFactor.enterCodeConfirm}
                    </Text>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={regenerateCode}
                      onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
                      placeholder={languageGB.common.profile.twoFactor.codePlaceholder}
                      textAlign="center"
                      fontSize="2xl"
                      fontWeight="bold"
                      letterSpacing="8px"
                    />
                  </Stack>
                </VStack>
              </Dialog.Body>
              {/* @ts-ignore */}
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setIsRegenerateModalOpen(false)}
                >
                  {languageGB.common.profile.twoFactor.cancel}
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleRegenerateBackupCodes}
                  loading={regenerateMutation.isPending}
                  disabled={regenerateCode.length !== 6}
                >
                  {languageGB.common.profile.twoFactor.regenerateButton}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Modal de Códigos de Backup */}
      {/* @ts-ignore */}
      <Dialog.Root
        open={isBackupCodesModalOpen}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) setBackupCodes(null);
          setIsBackupCodesModalOpen(e.open);
        }}
        size="md"
      >
        <Portal>
          {/* @ts-ignore */}
          <Dialog.Backdrop />
          {/* @ts-ignore */}
          <Dialog.Positioner>
            {/* @ts-ignore */}
            <Dialog.Content>
              {/* @ts-ignore */}
              <Dialog.Header>
                {/* @ts-ignore - Chakra UI v3 Dialog */}
                <Dialog.Title>{languageGB.common.profile.twoFactor.backupCodesModalTitle}</Dialog.Title>
              </Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Box
                    p={3}
                    bg="yellow.900"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="yellow.600"
                  >
                    <Text fontSize="sm" color="yellow.200">
                      {languageGB.common.profile.twoFactor.backupCodesImportant}
                    </Text>
                  </Box>

                  {/* Lista de códigos */}
                  <Box
                    p={4}
                    bg="bg.subtle"
                    borderRadius="md"
                    fontFamily="mono"
                  >
                    <Flex flexWrap="wrap" gap={2} justify="center">
                      {backupCodes?.map((code, index) => (
                        <Box
                          key={index}
                          px={3}
                          py={2}
                          bg="bg.muted"
                          borderRadius="md"
                          fontSize="sm"
                          letterSpacing="1px"
                        >
                          {code}
                        </Box>
                      ))}
                    </Flex>
                  </Box>

                  <Button
                    variant="outline"
                    onClick={copyBackupCodesToClipboard}
                    w="full"
                  >
                    {languageGB.common.profile.twoFactor.copyCodes}
                  </Button>
                </VStack>
              </Dialog.Body>
              {/* @ts-ignore */}
              <Dialog.Footer>
                <Button
                  colorPalette="blue"
                  onClick={() => setIsBackupCodesModalOpen(false)}
                >
                  {languageGB.common.profile.twoFactor.savedCodes}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

export default TwoFactorSettings;
