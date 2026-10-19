import { useLanguage } from '@/hooks/useLanguage';
import logoWhite from '@/assets/Logo-white.svg';
import { resetPassword } from '@/services/v2/Auth/password-recovery-service';
import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Input,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toaster } from '@/components/ui/toaster';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Valida se o token existe
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError(languageGB.common.resetPassword.errorExpired);
      toaster.error({
        title: languageGB.common.resetPassword.errorTitle,
        description: languageGB.common.resetPassword.errorInvalid,
        duration: 7000,
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError(languageGB.common.resetPassword.errorRequired);
      return;
    }

    if (password !== confirmPassword) {
      setError(languageGB.common.resetPassword.errorMismatch);
      return;
    }

    if (password.length < 8) {
      setError(languageGB.common.resetPassword.errorTooShort);
      return;
    }

    try {
      setIsLoading(true);
      const response = await resetPassword({
        token: token!,
        password,
        password_confirmation: confirmPassword
      });

      if (response?.data) {
        setSuccess(true);
        toaster.success({
          title: languageGB.common.resetPassword.successTitle,
          description: languageGB.common.resetPassword.successMessage,
          duration: 7000,
        });

        // Redireciona para login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          languageGB.common.resetPassword.errorTitle;
      setError(errorMessage);
      toaster.error({
        title: languageGB.common.resetPassword.errorTitle,
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Card de Reset de Senha com backdrop blur */}
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
            {/* Botão voltar */}
            <Flex w="full" justifyContent="flex-start" mb={4}>
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                color="loginTextWhite"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                display="flex"
                alignItems="center"
                gap="2"
              >
                <Icon as={FiArrowLeft} boxSize="16px" />
                Voltar
              </Button>
            </Flex>

            {/* Título */}
            <Box textAlign="center" mb="32px" w="full">
              <Text
                fontSize="24px"
                fontWeight="bold"
                lineHeight="28px"
                color="loginTextWhite"
                mb={2}
              >
                {languageGB.common.resetPassword.title}
              </Text>
              <Text
                fontSize="14px"
                fontWeight="normal"
                lineHeight="20px"
                color="rgba(255, 255, 255, 0.7)"
              >
                {languageGB.common.resetPassword.subtitle}
              </Text>
            </Box>

            {!tokenValid ? (
              <Box
                w="full"
                bg="rgba(239, 68, 68, 0.1)"
                border="1px solid rgba(239, 68, 68, 0.3)"
                borderRadius="8px"
                px="16px"
                py="12px"
                textAlign="center"
              >
                <Text color="red.400" fontSize="14px" mb={2} fontWeight="bold">
                  ✗ {languageGB.common.resetPassword.errorExpired}
                </Text>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="12px" mb={4}>
                  {languageGB.common.resetPassword.errorExpired}
                </Text>
                <Button
                  bg="loginInputBG"
                  color="loginButtonPrimary"
                  borderRadius="8px"
                  onClick={() => navigate('/login')}
                >
                  Voltar para Login
                </Button>
              </Box>
            ) : success ? (
              <Box
                w="full"
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid rgba(34, 197, 94, 0.3)"
                borderRadius="8px"
                px="16px"
                py="12px"
                textAlign="center"
              >
                <Text color="green.400" fontSize="14px" mb={2} fontWeight="bold">
                  ✓ {languageGB.common.resetPassword.successTitle}
                </Text>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="12px">
                  {languageGB.common.resetPassword.successMessage}
                </Text>
              </Box>
            ) : (
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

                  {/* Input de Nova Senha com ícone */}
                  <Box position="relative" h="36px">
                    <Box
                      position="absolute"
                      left="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="loginInputIcon"
                      zIndex={2}
                      pointerEvents="none"
                    >
                      <Icon as={FiLock} boxSize="16px" />
                    </Box>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={languageGB.common.resetPassword.newPasswordPlaceholder}
                      bg="loginInputBG"
                      border="1px solid"
                      borderColor="loginInputBorder"
                      borderRadius="12px"
                      h="36px"
                      pl="40px"
                      pr="12px"
                      fontSize="14px"
                      color="loginInputIcon"
                      _placeholder={{ color: 'loginInputIcon' }}
                      disabled={isLoading}
                    />
                  </Box>

                  {/* Input de Confirmação de Senha com ícone */}
                  <Box position="relative" h="36px">
                    <Box
                      position="absolute"
                      left="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="loginInputIcon"
                      zIndex={2}
                      pointerEvents="none"
                    >
                      <Icon as={FiLock} boxSize="16px" />
                    </Box>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={languageGB.common.resetPassword.confirmPasswordPlaceholder}
                      bg="loginInputBG"
                      border="1px solid"
                      borderColor="loginInputBorder"
                      borderRadius="12px"
                      h="36px"
                      pl="40px"
                      pr="12px"
                      fontSize="14px"
                      color="loginInputIcon"
                      _placeholder={{ color: 'loginInputIcon' }}
                      disabled={isLoading}
                    />
                  </Box>

                  {/* Informação de segurança */}
                  <Text
                    fontSize="12px"
                    color="rgba(255, 255, 255, 0.6)"
                    textAlign="center"
                  >
                    {languageGB.common.resetPassword.minCharacters}
                  </Text>

                  {/* Divisor */}
                  <Box borderTop="1px solid rgba(255, 255, 255, 0.2)" w="full" mb="12px" />

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
                      onClick={() => navigate('/login')}
                      disabled={isLoading}
                    >
                      {languageGB.common.resetPassword.cancelButton}
                    </Button>
                    <Button
                      type="submit"
                      bg="loginInputBG"
                      color="loginButtonPrimary"
                      borderRadius="12px"
                      px="12px"
                      h="36px"
                      fontSize="14px"
                      fontWeight="bold"
                      border="1px solid"
                      borderColor="loginInputBorder"
                      _hover={{ bg: '#e5e7eb' }}
                      w="auto"
                      minW="120px"
                      loading={isLoading}
                      disabled={isLoading || !password || !confirmPassword}
                    >
                      {isLoading ? languageGB.common.resetPassword.updatingButton : languageGB.common.resetPassword.updateButton}
                    </Button>
                  </Flex>
                </Stack>
              </form>
            )}
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
}

export default ResetPassword;
