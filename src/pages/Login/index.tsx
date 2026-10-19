import { AuthContext } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { useSplashStore } from '@/stores/splashStore';

type PendingCreds = { email: string; password: string };

// ─── Vídeos institucionais (CDN público Cloudflare R2 — mesmo acervo do
// protótipo CERNE em localhost:2020). Trocam de fundo a cada slide,
// sincronizados com a troca de texto. ─────────────────────────────────────────
const CDN = 'https://pub-0f1e695318f140f895ccdb13696c1c62.r2.dev';
const vid0 = `${CDN}/agricultura.mp4`;
const vid1 = `${CDN}/apicultura.mp4`;
const vid2 = `${CDN}/avicultura.mp4`;
const vid3 = `${CDN}/ovicultura.mp4`;
const vid4 = `${CDN}/Psicultura.mp4`;

// ─── Carrossel institucional — copy idêntica ao Login.tsx do protótipo CERNE ──
const SLIDES = [
  {
    src: vid0,
    eyebrow: 'Gestão rural inteligente',
    h1a: 'Sua fazenda,',
    h1em: 'gerenciada',
    h1b: 'com precisão.',
    desc: 'Do campo ao escritório, controle produção, custos, colheita e equipes em uma plataforma pensada para o agronegócio brasileiro.',
  },
  {
    src: vid1,
    eyebrow: 'Apicultura de precisão',
    h1a: 'Produção de mel',
    h1em: 'monitorada',
    h1b: 'em tempo real.',
    desc: 'Gerencie colmeias, floradas e extração com rastreabilidade completa do campo até a embalagem.',
  },
  {
    src: vid2,
    eyebrow: 'Avicultura integrada',
    h1a: 'Lotes e aves',
    h1em: 'controlados',
    h1b: 'sem esforço.',
    desc: 'Ciclos de produção, conversão alimentar e sanidade animal integrados em um único painel.',
  },
  {
    src: vid3,
    eyebrow: 'Ovinocultura moderna',
    h1a: 'Rebanho',
    h1em: 'acompanhado',
    h1b: 'do nascimento ao abate.',
    desc: 'Rastreie cada animal, controle peso, vacinação e genealogia com registros precisos e auditáveis.',
  },
  {
    src: vid4,
    eyebrow: 'Piscicultura eficiente',
    h1a: 'Tanques e safras',
    h1em: 'gerenciados',
    h1b: 'com inteligência.',
    desc: 'Controle qualidade da água, biometria e despesca com análises automáticas e alertas em tempo real.',
  },
];

const STATS = [
  { value: '2.400+', label: 'Fazendas ativas' },
  { value: 'R$ 4,2B', label: 'Em produção gerenciada' },
  { value: '99,7%', label: 'Uptime SLA garantido' },
];

const LS_EMAIL = 'gbcerne_email';
const LS_REMEMBER = 'gbcerne_remember';

// Elementos nativos tipados (aceitam `type`, `htmlFor`, `checked`, etc.)
const ChakraButton = chakra('button');
const ChakraLabel = chakra('label');
const ChakraCheckbox = chakra('input');
const ChakraVideo = chakra('video');
const ChakraSvg = chakra('svg');
const ChakraAnchor = chakra('a');

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function Login() {
  const { languageGB } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const signIn = useContextSelector(AuthContext, (c) => c.signIn);
  const error = useContextSelector(AuthContext, (c) => c.error);
  const clearError = useContextSelector(AuthContext, (c) => c.clearError);
  const setSuppressLoadingOverlay = useContextSelector(
    AuthContext,
    (c) => c.setSuppressLoadingOverlay,
  );
  const showSplash = useSplashStore((s) => s.show);
  const hideSplash = useSplashStore((s) => s.hide);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string>(
    () => localStorage.getItem(LS_EMAIL) ?? '',
  );
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState<boolean>(
    () => localStorage.getItem(LS_REMEMBER) === '1',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailErr, setEmailErr] = useState(false);

  // ── Carrossel + vídeo de fundo ───────────────────────────────────────────────
  const [slideIdx, setSlideIdx] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const goTo = useCallback((i: number) => {
    if (!prefersReduced.current) setTextVisible(false);
    const delay = prefersReduced.current ? 0 : 400;
    setTimeout(() => {
      setSlideIdx(i);
      setTextVisible(true);
      if (videoRef.current && !prefersReduced.current) {
        videoRef.current.src = SLIDES[i].src;
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }, delay);
  }, []);

  useEffect(() => {
    if (prefersReduced.current) return;
    timerRef.current = setInterval(() => {
      setSlideIdx((prev) => {
        const next = (prev + 1) % SLIDES.length;
        goTo(next);
        return prev;
      });
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [goTo]);

  const slide = SLIDES[slideIdx];

  // ── Login (usa o mock via AuthContext) ───────────────────────────────────────
  // NOTA: `signIn` (AuthContext) já dispara `navigate('/home', { replace: true })`
  // internamente assim que o usuário é setado, e mantém `loading=true` do início
  // ao fim da chamada (só reseta no `finally`, DEPOIS do navigate).
  //
  // ★ A splash oficial é GLOBAL (`useSplashStore` + `<GlobalSplash/>` em
  // `App.tsx`), renderizada FORA do `AuthProvider` — de propósito. Ela cobre a
  // tela (position:fixed, z-index 9999) pelo seu tempo fixo (~4.8s) totalmente
  // independente do que acontece por baixo (Login desmontando, Home montando,
  // AuthContext trocando pra `<Loading/>` genérico durante o `signIn`).
  // Por isso chamamos `signIn()` em PARALELO com a splash (não esperamos ela
  // terminar pra autenticar) — o mock resolve em ~300-600ms, bem antes dos
  // 4.8s da splash, então a Home já está pronta por baixo quando ela se
  // esconde sozinha. `setSuppressLoadingOverlay` é mantido como segurança
  // extra (caso o signIn demore mais que o esperado).
  const doLogin = async () => {
    if (!email || !password || isLoading) return;

    if (!validateEmail(email)) {
      setEmailErr(true);
      return;
    }

    if (remember) {
      localStorage.setItem(LS_REMEMBER, '1');
      localStorage.setItem(LS_EMAIL, email);
    } else {
      localStorage.removeItem(LS_REMEMBER);
      localStorage.removeItem(LS_EMAIL);
    }

    await runLoginFlow({ email, password });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doLogin();
  };

  // SSO mockado: aciona o mesmo fluxo de login com um usuário fake de demonstração.
  const handleSso = () => {
    if (isLoading) return;
    const ssoEmail = email || 'demo@gbcerne.com';
    const ssoPassword = password || 'sso-demo';
    setEmail((prev) => prev || ssoEmail);
    setPassword((prev) => prev || ssoPassword);
    void runLoginFlow({ email: ssoEmail, password: ssoPassword });
  };

  const runLoginFlow = async (creds: PendingCreds) => {
    try {
      setIsLoading(true);
      setEmailErr(false);
      clearError();
      setIsSuccess(true);
      showSplash();
      setSuppressLoadingOverlay(true);
      await signIn(creds);
      // Sucesso: signIn já navegou pra /home — desmonta o Login sozinho.
      // A splash (global, fora do Login) continua até seu próprio timer
      // interno terminar, revelando a Home já pronta por baixo.
    } catch (err) {
      console.error('Erro no login:', err);
      setIsSuccess(false);
      hideSplash(); // falha real: não faz sentido segurar a splash por 4.8s
    } finally {
      setIsLoading(false);
      setSuppressLoadingOverlay(false);
    }
  };

  return (
    <>
      <Flex
      minH="100vh"
      w="100%"
      overflow="hidden"
      position="relative"
      display={{ base: 'flex', lg: 'grid' }}
      css={{ '@media (min-width: 1024px)': { gridTemplateColumns: '1fr minmax(440px, 520px)' } }}
    >
      {/* ══ LEFT PANEL — institucional (vídeo real + verde escuro) ═══════════════ */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        minH="100vh"
        position="relative"
        overflow="hidden"
        direction="column"
        justify="space-between"
        bg="loginBackground"
        color="loginTextWhite"
        px="56px"
        py="48px"
      >
        {/* Vídeo de fundo — troca de src a cada slide */}
        {!prefersReduced.current && (
          <Box position="absolute" inset={0} zIndex={0}>
            <ChakraVideo
              ref={videoRef}
              src={slide.src}
              autoPlay
              muted
              loop
              playsInline
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>
        )}

        {/* Overlay escuro (gradiente radial + linear) sobre o vídeo */}
        <Box
          position="absolute"
          inset={0}
          zIndex={0}
          background="
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(5,150,105,.20) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(4,120,87,.14) 0%, transparent 55%),
            linear-gradient(160deg, rgba(8,26,18,.85) 0%, rgba(4,120,87,.60) 55%, rgba(8,26,18,.90) 100%)
          "
        />

        {/* Linhas/anéis decorativos (SVG, aria-hidden) */}
        <ChakraSvg
          position="absolute"
          inset={0}
          w="100%"
          h="100%"
          zIndex={0}
          opacity={0.9}
          aria-hidden="true"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <path d="M-50 200 Q150 100 300 250 T600 200" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
          <path d="M-50 380 Q200 280 350 420 T700 360" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
          <path d="M100 -50 Q200 160 150 360 T200 760" stroke="rgba(34,197,94,0.10)" strokeWidth="1" fill="none" />
          <circle cx="480" cy="160" r="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
          <circle cx="480" cy="160" r="85" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
          <circle cx="480" cy="160" r="42" stroke="rgba(34,197,94,0.06)" strokeWidth="1" fill="none" />
        </ChakraSvg>

        {/* Logo — escudo do protótipo CERNE + texto "GB CERNE" (marca do app) */}
        <Flex align="center" gap="12px" position="relative" zIndex={1}>
          <Flex
            w="40px"
            h="40px"
            borderRadius="10px"
            align="center"
            justify="center"
            flexShrink={0}
            bgGradient="to-br"
            gradientFrom="#22c55e"
            gradientTo="#047857"
            boxShadow="0 4px 20px rgba(5,150,105,.32)"
          >
            <ChakraSvg w="22px" h="22px" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" fill="rgba(255,255,255,.9)" />
              <path d="M12 8v8M8 10l4-2 4 2" stroke="rgba(20,83,45,.6)" strokeWidth="1.5" strokeLinecap="round" />
            </ChakraSvg>
          </Flex>
          <Text fontSize="20px" fontWeight="bold" letterSpacing="0.14em">
            GB CERNE
          </Text>
        </Flex>

        {/* Copy do slide */}
        <Box
          position="relative"
          zIndex={1}
          maxW="460px"
          aria-live="polite"
          opacity={textVisible ? 1 : 0}
          transform={textVisible ? 'translateY(0)' : 'translateY(10px)'}
          transition="opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)"
        >
          <Flex align="center" gap="10px" mb="16px">
            <Box w="28px" h="1px" bg="rgba(74,222,128,0.9)" flexShrink={0} />
            <Text
              fontSize="13px"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.16em"
              color="rgba(74,222,128,0.9)"
            >
              {slide.eyebrow}
            </Text>
          </Flex>
          <Text fontSize="44px" fontWeight="extrabold" lineHeight="1.1">
            {slide.h1a}
            <br />
            <Text as="em" fontStyle="normal" color="#4ade80">
              {slide.h1em}
            </Text>{' '}
            {slide.h1b}
          </Text>
          <Text
            fontSize="16px"
            lineHeight="1.6"
            color="rgba(255,255,255,0.72)"
            mt="20px"
          >
            {slide.desc}
          </Text>

          {/* Dots */}
          <Flex gap="8px" mt="28px" role="tablist" aria-label="Slides institucionais">
            {SLIDES.map((s, i) => (
              <ChakraButton
                key={s.eyebrow}
                type="button"
                role="tab"
                aria-selected={i === slideIdx}
                aria-label={s.eyebrow}
                onClick={() => {
                  clearInterval(timerRef.current);
                  goTo(i);
                }}
                h="4px"
                w={i === slideIdx ? '28px' : '10px'}
                borderRadius="full"
                bg={i === slideIdx ? '#4ade80' : 'rgba(255,255,255,0.28)'}
                transition="width 0.25s ease, background 0.25s ease"
                cursor="pointer"
              />
            ))}
          </Flex>
        </Box>

        {/* Stats bar */}
        <Flex position="relative" zIndex={1} gap="40px" pt="24px">
          {STATS.map((s) => (
            <Box key={s.label}>
              <Text fontSize="26px" fontWeight="bold" color="loginTextWhite">
                {s.value}
              </Text>
              <Text fontSize="13px" color="rgba(255,255,255,0.6)">
                {s.label}
              </Text>
            </Box>
          ))}
        </Flex>
      </Flex>

      {/* ══ RIGHT PANEL — formulário ══════════════════════════════════════════ */}
      <Flex
        w={{ base: '100%', lg: 'auto' }}
        minH="100vh"
        align="center"
        justify="center"
        bg={isDark ? 'loginBackground' : '#fafaf9'}
        px={{ base: '24px', md: '48px' }}
        py="48px"
      >
        <Box w="100%" maxW="380px">
          {/* Status do sistema */}
          <Flex align="center" gap="6px" mb="28px" aria-label="Status dos sistemas">
            <Box
              w="7px"
              h="7px"
              borderRadius="full"
              bg="#059669"
              flexShrink={0}
              css={{
                animation: 'gbcerne-login-pulse 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
                '@keyframes gbcerne-login-pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(5,150,105,.5)' },
                  '60%': { boxShadow: '0 0 0 6px rgba(5,150,105,0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(5,150,105,0)' },
                },
              }}
            />
            <Text fontSize="11px" color={isDark ? 'rgba(255,255,255,0.5)' : 'gray.400'}>
              Todos os sistemas operacionais
            </Text>
          </Flex>

          {/* Cabeçalho do form */}
          <Box mb="32px">
            <Text
              fontSize="26px"
              fontWeight="bold"
              lineHeight="1.2"
              color={isDark ? 'loginTextWhite' : 'gray.900'}
            >
              {languageGB.common.login.welcomeTitle}
            </Text>
            <Text
              fontSize="15px"
              color={isDark ? 'rgba(255,255,255,0.6)' : 'gray.500'}
              mt="6px"
            >
              {languageGB.common.login.platformSubtitle}{' '}
              <ChakraAnchor
                href="#solicitar"
                onClick={(e: React.MouseEvent) => e.preventDefault()}
                color="loginButtonPrimary"
                fontWeight="medium"
                _hover={{ textDecoration: 'underline' }}
              >
                Solicitar acesso
              </ChakraAnchor>
            </Text>
          </Box>

          {/* Erro global */}
          {error && (
            <Box
              role="alert"
              aria-live="assertive"
              bg="rgba(220, 38, 38, 0.10)"
              border="1px solid"
              borderColor="rgba(220, 38, 38, 0.35)"
              borderRadius="12px"
              px="14px"
              py="10px"
              mb="20px"
            >
              <Text color="red.500" fontSize="14px">
                {error}
              </Text>
            </Box>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="18px" w="100%">
              {/* E-mail */}
              <Box>
                <ChakraLabel
                  htmlFor="login-email"
                  display="block"
                  fontSize="13px"
                  fontWeight="medium"
                  mb="6px"
                  color={isDark ? 'rgba(255,255,255,0.8)' : 'gray.700'}
                >
                  E-mail corporativo
                </ChakraLabel>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left="14px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="loginInputIcon"
                    pointerEvents="none"
                    zIndex={2}
                  >
                    <Icon as={FiMail} boxSize="16px" />
                  </Box>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    spellCheck={false}
                    placeholder={languageGB.common.login.emailPlaceholder}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailErr(false);
                    }}
                    bg="loginInputBG"
                    border="1px solid"
                    borderColor={emailErr ? 'red.400' : 'loginInputBorder'}
                    borderRadius="12px"
                    h="48px"
                    pl="42px"
                    pr="14px"
                    fontSize="15px"
                    color={isDark ? 'loginTextWhite' : 'gray.900'}
                    _placeholder={{ color: 'loginInputIcon' }}
                    _focusVisible={{
                      borderColor: 'loginButtonPrimary',
                      boxShadow: '0 0 0 3px rgba(5,150,105,0.14)',
                      outline: 'none',
                    }}
                  />
                </Box>
                {emailErr && (
                  <Text color="red.500" fontSize="12px" mt="6px">
                    Insira um e-mail válido.
                  </Text>
                )}
              </Box>

              {/* Senha */}
              <Box>
                <ChakraLabel
                  htmlFor="login-password"
                  display="block"
                  fontSize="13px"
                  fontWeight="medium"
                  mb="6px"
                  color={isDark ? 'rgba(255,255,255,0.8)' : 'gray.700'}
                >
                  Senha
                </ChakraLabel>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left="14px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="loginInputIcon"
                    pointerEvents="none"
                    zIndex={2}
                  >
                    <Icon as={FiLock} boxSize="16px" />
                  </Box>
                  <Input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    placeholder={languageGB.common.login.passwordPlaceholder}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="loginInputBG"
                    border="1px solid"
                    borderColor="loginInputBorder"
                    borderRadius="12px"
                    h="48px"
                    pl="42px"
                    pr="42px"
                    fontSize="15px"
                    color={isDark ? 'loginTextWhite' : 'gray.900'}
                    _placeholder={{ color: 'loginInputIcon' }}
                    _focusVisible={{
                      borderColor: 'loginButtonPrimary',
                      boxShadow: '0 0 0 3px rgba(5,150,105,0.14)',
                      outline: 'none',
                    }}
                  />
                  <ChakraButton
                    type="button"
                    aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPw((v) => !v)}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="loginInputIcon"
                    cursor="pointer"
                    display="flex"
                    zIndex={2}
                    _hover={{ color: 'loginButtonPrimary' }}
                  >
                    <Icon as={showPw ? FiEyeOff : FiEye} boxSize="16px" />
                  </ChakraButton>
                </Box>
              </Box>

              {/* Lembrar-me + esqueci a senha */}
              <Flex align="center" justify="space-between">
                <ChakraLabel
                  display="flex"
                  alignItems="center"
                  gap="8px"
                  cursor="pointer"
                  fontSize="14px"
                  color={isDark ? 'rgba(255,255,255,0.75)' : 'gray.600'}
                >
                  <ChakraCheckbox
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.currentTarget.checked)}
                    w="16px"
                    h="16px"
                    accentColor="#059669"
                    cursor="pointer"
                  />
                  {languageGB.common.login.rememberMe}
                </ChakraLabel>
                <ChakraButton
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  fontSize="14px"
                  fontWeight="medium"
                  color="loginButtonPrimary"
                  bg="transparent"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                >
                  {languageGB.common.login.forgotPassword}
                </ChakraButton>
              </Flex>

              {/* Submit */}
              <Button
                type="submit"
                w="100%"
                h="48px"
                borderRadius="12px"
                bg={isSuccess ? '#059669' : 'loginButtonPrimary'}
                color="white"
                fontSize="15px"
                fontWeight="bold"
                _hover={{ bg: '#047857' }}
                _active={{ bg: '#065f46' }}
                loading={isLoading}
                loadingText={languageGB.common.login.loading}
                disabled={isLoading || isSuccess || !email || !password}
              >
                {isSuccess ? (
                  <>
                    <ChakraSvg w="18px" h="18px" aria-hidden="true" viewBox="0 0 20 20" fill="none" mr="8px">
                      <path d="M4 10l5 5 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </ChakraSvg>
                    Acesso autorizado
                  </>
                ) : (
                  languageGB.common.login.loginButton
                )}
              </Button>
            </Stack>
          </form>

          {/* Divider */}
          <Flex align="center" gap="12px" my="24px" aria-hidden="true">
            <Box flex={1} h="1px" bg={isDark ? 'rgba(255,255,255,0.14)' : 'gray.200'} />
            <Text fontSize="12px" color={isDark ? 'rgba(255,255,255,0.5)' : 'gray.400'}>
              ou acesse com
            </Text>
            <Box flex={1} h="1px" bg={isDark ? 'rgba(255,255,255,0.14)' : 'gray.200'} />
          </Flex>

          {/* SSO (mockado — aciona o mesmo fluxo de login). Só Google, como no protótipo. */}
          <Button
            type="button"
            w="100%"
            h="46px"
            borderRadius="12px"
            variant="outline"
            bg="transparent"
            border="1px solid"
            borderColor={isDark ? 'rgba(255,255,255,0.16)' : 'gray.200'}
            color={isDark ? 'loginTextWhite' : 'gray.700'}
            fontSize="14px"
            fontWeight="medium"
            _hover={{ bg: isDark ? 'rgba(255,255,255,0.06)' : 'gray.50' }}
            onClick={handleSso}
            disabled={isLoading}
          >
            <Icon as={FaGoogle} boxSize="16px" mr="8px" color="#EA4335" />
            Entrar com Google
          </Button>

          {/* Trust badges */}
          <Flex
            align="center"
            justify="center"
            gap="20px"
            mt="28px"
            pt="22px"
            borderTop="1px solid"
            borderColor={isDark ? 'rgba(255,255,255,0.10)' : 'gray.100'}
            flexWrap="wrap"
            aria-label="Certificações de segurança"
          >
            <Flex align="center" gap="5px" fontSize="11px" color={isDark ? 'rgba(255,255,255,0.5)' : 'gray.400'}>
              <ChakraSvg w="13px" h="13px" color="loginButtonPrimary" aria-hidden="true" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L2 3.5v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6v-4L7 1z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </ChakraSvg>
              SSL 256-bit
            </Flex>
            <Flex align="center" gap="5px" fontSize="11px" color={isDark ? 'rgba(255,255,255,0.5)' : 'gray.400'}>
              <ChakraSvg w="13px" h="13px" color="loginButtonPrimary" aria-hidden="true" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 4V3a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </ChakraSvg>
              LGPD Conforme
            </Flex>
            <Flex align="center" gap="5px" fontSize="11px" color={isDark ? 'rgba(255,255,255,0.5)' : 'gray.400'}>
              <ChakraSvg w="13px" h="13px" color="loginButtonPrimary" aria-hidden="true" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 4.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </ChakraSvg>
              99,7% uptime
            </Flex>
          </Flex>

          {/* Legal */}
          <Text
            fontSize="12px"
            textAlign="center"
            mt="16px"
            color={isDark ? 'rgba(255,255,255,0.45)' : 'gray.400'}
          >
            Ao acessar, você concorda com os Termos de Uso e a Política de
            Privacidade do GB Cerne.
          </Text>
        </Box>
      </Flex>
      </Flex>
    </>
  );
}

export default Login;
