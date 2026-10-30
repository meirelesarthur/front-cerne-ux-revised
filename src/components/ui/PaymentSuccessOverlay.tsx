// src/components/ui/PaymentSuccessOverlay.tsx
// Celebração de pagamento confirmado, em TELA CHEIA: um círculo verde nasce no centro e cresce até
// cobrir a tela, o ✓ é desenhado, o título entra com "plim" e confetes irradiam. Depois vem a 2ª
// fase ("e-mail confirmado… entrando"), que simula o clique no link do e-mail, e `onFinish` é
// chamado para o chamador entrar no sistema. Só CSS (sem lib); respeita `prefers-reduced-motion`.

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

export interface PaymentSuccessOverlayProps {
  title: string;
  subtitle?: string;
  /** 2ª fase: "E-mail confirmado". */
  confirmedLabel: string;
  /** 2ª fase: "Entrando no Cerne…". */
  enteringLabel: string;
  /** Duração (ms) da fase de celebração. */
  celebrateMs?: number;
  /** Duração (ms) da fase "entrando". */
  enterMs?: number;
  onFinish: () => void;
}

const COLORS = ['#ffffff', '#bbf7d0', '#fde68a', '#86efac', '#a7f3d0'];

export function PaymentSuccessOverlay({ title, subtitle, confirmedLabel, enteringLabel, celebrateMs = 2800, enterMs = 2000, onFinish }: PaymentSuccessOverlayProps) {
  const [phase, setPhase] = useState<'celebrate' | 'enter'>('celebrate');

  useEffect(() => {
    const a = window.setTimeout(() => setPhase('enter'), celebrateMs);
    const b = window.setTimeout(onFinish, celebrateMs + enterMs);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // dispara uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2 + (i % 3) * 0.15;
        const dist = 160 + ((i * 53) % 220);
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 6 + ((i * 7) % 9),
          color: COLORS[i % COLORS.length],
          delay: 0.55 + (i % 6) * 0.04,
          round: i % 2 === 0,
        };
      }),
    []
  );

  return (
    <Box position="fixed" inset={0} zIndex={2000} overflow="hidden" role="status" aria-live="polite">
      <style>{`
        @keyframes cerne-fill { from { clip-path: circle(0% at 50% 50%); } to { clip-path: circle(150% at 50% 50%); } }
        @keyframes cerne-ring { 0% { transform: scale(.4); opacity: .9; } 100% { transform: scale(3.2); opacity: 0; } }
        @keyframes cerne-pop { 0% { transform: scale(0); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        @keyframes cerne-draw { to { stroke-dashoffset: 0; } }
        @keyframes cerne-rise { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes cerne-fly { 0% { transform: translate(0,0) scale(0) rotate(0); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(1) rotate(260deg); opacity: 0; } }
        @keyframes cerne-swap { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .cerne-anim { animation-duration: .01ms !important; animation-delay: 0s !important; } }
      `}</style>

      {/* fundo verde que enche a tela a partir do centro */}
      <Box
        className="cerne-anim"
        position="absolute"
        inset={0}
        style={{ background: 'radial-gradient(circle at 50% 45%, #10b981 0%, #059669 45%, #047857 100%)', animation: 'cerne-fill .85s cubic-bezier(.2,.8,.2,1) both' }}
      />

      <Flex position="absolute" inset={0} direction="column" align="center" justify="center" color="white" textAlign="center" px={6}>
        {phase === 'celebrate' ? (
          <>
            <Box position="relative" boxSize="132px" mb={6}>
              {/* onda que se espalha ao confirmar */}
              {[0, 0.18].map((d) => (
                <Box key={d} className="cerne-anim" position="absolute" inset={0} borderRadius="full" borderWidth="3px" borderColor="whiteAlpha.700" style={{ animation: `cerne-ring 1.1s ease-out ${0.55 + d}s both` }} />
              ))}
              <Flex className="cerne-anim" align="center" justify="center" boxSize="132px" borderRadius="full" bg="white" boxShadow="0 18px 50px rgba(0,0,0,.25)" style={{ animation: 'cerne-pop .55s cubic-bezier(.3,1.5,.5,1) .5s both' }}>
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path className="cerne-anim" d="M5 12.5l4.5 4.5L19 7.5" style={{ strokeDasharray: 26, strokeDashoffset: 26, animation: 'cerne-draw .45s ease-out .9s forwards' }} />
                </svg>
              </Flex>
              {confetti.map((c, i) => (
                <Box
                  key={i}
                  className="cerne-anim"
                  position="absolute"
                  top="50%"
                  left="50%"
                  style={{
                    width: c.size,
                    height: c.round ? c.size : c.size * 0.45,
                    marginLeft: -c.size / 2,
                    marginTop: -c.size / 2,
                    borderRadius: c.round ? '50%' : 2,
                    background: c.color,
                    ['--dx' as string]: `${c.dx}px`,
                    ['--dy' as string]: `${c.dy}px`,
                    animation: `cerne-fly 1.2s cubic-bezier(.15,.7,.3,1) ${c.delay}s both`,
                  }}
                />
              ))}
            </Box>
            <Text className="cerne-anim" fontSize={{ base: '30px', md: '44px' }} fontWeight="700" letterSpacing="-0.02em" style={{ animation: 'cerne-rise .5s ease-out 1s both' }}>
              {title}
            </Text>
            {subtitle && (
              <Text className="cerne-anim" mt={2} fontSize="lg" opacity={0.9} style={{ animation: 'cerne-rise .5s ease-out 1.15s both' }}>
                {subtitle}
              </Text>
            )}
          </>
        ) : (
          <Flex className="cerne-anim" direction="column" align="center" gap={4} style={{ animation: 'cerne-swap .4s ease-out both' }}>
            <Flex align="center" gap={3} fontSize={{ base: '24px', md: '32px' }} fontWeight="700">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {confirmedLabel}
            </Flex>
            <Flex align="center" gap={3} fontSize="lg" opacity={0.92}>
              <Spinner size="sm" color="white" />
              {enteringLabel}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

export default PaymentSuccessOverlay;
