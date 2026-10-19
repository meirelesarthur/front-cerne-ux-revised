import { AuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import logoWhite from '@/assets/Logo-white.svg';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Input,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { FiShield, FiArrowLeft, FiKey } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

export function TwoFactorVerify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  
  const twoFactorPending = useContextSelector(AuthContext, (context) => context.twoFactorPending);
  const verifyTwoFactor = useContextSelector(AuthContext, (context) => context.verifyTwoFactor);
  const verifyTwoFactorBackup = useContextSelector(AuthContext, (context) => context.verifyTwoFactorBackup);
  const cancelTwoFactor = useContextSelector(AuthContext, (context) => context.cancelTwoFactor);
  const error = useContextSelector(AuthContext, (context) => context.error);
  const clearError = useContextSelector(AuthContext, (context) => context.clearError);

  // Redirecionar se não houver sessão 2FA pendente
  useEffect(() => {
    if (!twoFactorPending) {
      navigate('/login', { replace: true });
    }
  }, [twoFactorPending, navigate]);

  // Foco automático no primeiro input
  useEffect(() => {
    if (!useBackupCode) {
      inputRefs.current[0]?.focus();
    }
  }, [useBackupCode]);

  const handleCodeChange = (index: number, value: string) => {
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-avançar para próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: voltar para input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (useBackupCode) {
      if (!backupCode.trim()) return;

      try {
        setIsLoading(true);
        clearError();
        await verifyTwoFactorBackup(backupCode.trim());
      } catch (err) {
        console.error('Erro na verificação de backup:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      const fullCode = code.join('');
      if (fullCode.length !== 6) return;

      try {
        setIsLoading(true);
        clearError();
        await verifyTwoFactor(fullCode);
      } catch (err) {
        console.error('Erro na verificação 2FA:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBackToLogin = () => {
    cancelTwoFactor();
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode(['', '', '', '', '', '']);
    setBackupCode('');
    clearError();
  };

  const isCodeComplete = useBackupCode ? backupCode.trim().length > 0 : code.every(digit => digit !== '');

  if (!twoFactorPending) {
    return null;
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="loginBackground"
      position="relative"
      overflow="hidden"
    >
      {/* Background decorativo - círculo principal */}
      <Box
        position="absolute"
        top="-32%"
        left="5%"
        w="1353px"
        h="1353px"
        borderRadius="full"
        bg="rgba(135, 206, 250, 0.2)"
        filter="blur(100px)"
        zIndex={0}
      />

      {/* Background decorativo - formas abstratas */}
      <Box
        position="absolute"
        top="-10%"
        left="4%"
        w="900px"
        h="1020px"
        opacity={0.15}
        transform="rotate(135deg) scaleY(-1)"
        zIndex={0}
      >
        <Box
          w="full"
          h="full"
          bgGradient="to-br"
          gradientFrom="rgba(100, 200, 255, 0.3)"
          gradientTo="transparent"
          borderRadius="50% 50% 0 0"
        />
      </Box>

      <Box position="relative" zIndex={1} w="full" maxW="480px" mx="auto">
        {/* Logo */}
        <Box textAlign="center" mb={8}>
          <Image
            src={logoWhite}
            alt="GB Cerne"
            h="48px"
            w="auto"
            mx="auto"
            objectFit="contain"
          />
        </Box>

        {/* Card de Verificação 2FA */}
        <Box
          bg="loginCardBG"
          backdropFilter="blur(30px)"
          w="480px"
          h="fit-content"
          px="48px"
          py="48px"
          borderRadius="24px"
          boxShadow="0px 1px 0.5px 0.05px rgba(29, 41, 61, 0.02)"
        >
          <VStack gap={1} h="full">
            {/* Ícone e Título */}
            <Box textAlign="center" mb="24px">
              <Icon 
                as={FiShield} 
                boxSize="48px" 
                color="loginTextWhite" 
                mb="16px"
              />
              <Text
                fontSize="24px"
                fontWeight="bold"
                lineHeight="28px"
                color="loginTextWhite"
                mb="8px"
              >
                {useBackupCode ? languageGB.common.profile.twoFactorVerify.backupCodeTitle : languageGB.common.profile.twoFactorVerify.title}
              </Text>
              <Text
                fontSize="14px"
                color="loginInputIcon"
              >
                {useBackupCode 
                  ? languageGB.common.profile.twoFactorVerify.backupCodeDescription 
                  : languageGB.common.profile.twoFactorVerify.description
                }
              </Text>
              {twoFactorPending.email && (
                <Text
                  fontSize="12px"
                  color="loginInputIcon"
                  mt="4px"
                  opacity={0.7}
                >
                  {twoFactorPending.email}
                </Text>
              )}
            </Box>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap="4" w="384px">
                {/* Mensagem de Erro */}
                {error && (
                  <Box
                    bg="rgba(239, 68, 68, 0.1)"
                    border="1px solid rgba(239, 68, 68, 0.3)"
                    borderRadius="8px"
                    px="12px"
                    py="8px"
                  >
                    <Text color="red.400" fontSize="14px">
                      {error}
                    </Text>
                  </Box>
                )}

                {useBackupCode ? (
                  /* Input de Código de Backup */
                  <Box position="relative" h="36px" marginBottom={2}>
                    <Box
                      position="absolute"
                      left="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="loginInputIcon"
                      zIndex={2}
                      pointerEvents="none"
                    >
                      <Icon as={FiKey} boxSize="16px" />
                    </Box>
                    <Input
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      placeholder={languageGB.common.profile.twoFactorVerify.backupCodePlaceholder}
                      bg="loginInputBG"
                      border="1px solid"
                      borderColor="loginInputBorder"
                      borderRadius="12px"
                      h="36px"
                      pl="40px"
                      pr="12px"
                      fontSize="14px"
                      color="loginInputIcon"
                      textTransform="uppercase"
                      letterSpacing="2px"
                      _placeholder={{ color: 'loginInputIcon', textTransform: 'none', letterSpacing: 'normal' }}
                      autoFocus
                    />
                  </Box>
                ) : (
                  /* Inputs de Código TOTP (6 dígitos) */
                  <HStack justify="center" gap="8px" marginBottom={2}>
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        bg="loginInputBG"
                        border="1px solid"
                        borderColor="loginInputBorder"
                        borderRadius="12px"
                        w="48px"
                        h="56px"
                        fontSize="24px"
                        fontWeight="bold"
                        textAlign="center"
                        color="loginInputIcon"
                        caretColor="loginInputIcon"
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px blue.400',
                        }}
                      />
                    ))}
                  </HStack>
                )}

                {/* Link para alternar entre código TOTP e backup */}
                <Button
                  type="button"
                  variant="ghost"
                  color="loginInputIcon"
                  fontSize="13px"
                  fontWeight="normal"
                  h="auto"
                  p="0"
                  _hover={{ color: 'loginTextWhite', textDecoration: 'underline' }}
                  onClick={toggleBackupCode}
                >
                  {useBackupCode 
                    ? languageGB.common.profile.twoFactorVerify.useAuthenticatorApp 
                    : languageGB.common.profile.twoFactorVerify.lostAccess
                  }
                </Button>

                {/* Divisor */}
                <Box borderTop="1px solid rgba(255, 255, 255, 0.2)" w="full" mb="12px" mt="8px" />

                {/* Botões */}
                <Flex gap="12px" w="full" justifyContent="space-between">
                  <Button
                    type="button"
                    variant="outline"
                    border="2px solid"
                    borderColor="loginTextWhite"
                    color="loginTextWhite"
                    borderRadius="12px"
                    px="12px"
                    h="36px"
                    fontSize="14px"
                    fontWeight="bold"
                    bg="transparent"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                    onClick={handleBackToLogin}
                  >
                    <HStack gap={1}>
                      <Icon as={FiArrowLeft} />
                      <Text>{languageGB.common.profile.twoFactorVerify.back}</Text>
                    </HStack>
                  </Button>
                  <Button
                    type="submit"
                    bg="loginInputBG"
                    color="loginButtonPrimary"
                    borderRadius="12px"
                    px="24px"
                    h="36px"
                    fontSize="14px"
                    fontWeight="bold"
                    border="1px solid"
                    borderColor="loginInputBorder"
                    _hover={{ bg: '#e5e7eb' }}
                    loading={isLoading}
                    disabled={isLoading || !isCodeComplete}
                  >
                    {isLoading ? languageGB.common.profile.twoFactorVerify.verifying : languageGB.common.profile.twoFactorVerify.verify}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}

export default TwoFactorVerify;
