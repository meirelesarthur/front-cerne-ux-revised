import { useLanguage } from '@/hooks/useLanguage';
import logoWhite from '@/assets/Logo-white.svg';
import { requestPasswordRecovery } from '@/services/v2/Auth/password-recovery-service';
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
import { useState } from 'react';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toaster } from '@/components/ui/toaster';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { languageGB } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(languageGB.common.forgotPassword.requiredFields);
      return;
    }

    try {
      setIsLoading(true);
      const response = await requestPasswordRecovery({ email });

      if (response?.data) {
        setSuccess(true);
        toaster.success({
          title: languageGB.common.forgotPassword.successTitle,
          description: languageGB.common.forgotPassword.successMessage,
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
                          languageGB.common.forgotPassword.errorTitle;
      setError(errorMessage);
      toaster.error({
        title: languageGB.common.forgotPassword.errorTitle,
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

        {/* Card de Recuperação de Senha com backdrop blur */}
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
                {languageGB.common.forgotPassword.title}
              </Text>
              <Text
                fontSize="14px"
                fontWeight="normal"
                lineHeight="20px"
                color="rgba(255, 255, 255, 0.7)"
              >
                {languageGB.common.forgotPassword.subtitle}
              </Text>
            </Box>

            {success ? (
              <Box
                w="full"
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid rgba(34, 197, 94, 0.3)"
                borderRadius="8px"
                px="16px"
                py="12px"
                textAlign="center"
              >
                <Text color="green.400" fontSize="14px" mb={2}>
                  ✓ {languageGB.common.forgotPassword.successTitle}
                </Text>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="12px">
                  {languageGB.common.forgotPassword.successRedirect}
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

                  {/* Input de Email com ícone */}
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
                      <Icon as={FiMail} boxSize="16px" />
                    </Box>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={languageGB.common.forgotPassword.emailPlaceholder}
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
                      {languageGB.common.forgotPassword.cancelButton}
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
                      disabled={isLoading || !email}
                    >
                      {isLoading ? languageGB.common.forgotPassword.sendingButton : languageGB.common.forgotPassword.sendButton}
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

export default ForgotPassword;
