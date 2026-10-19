import { useEffect } from 'react'

const DURATION_MS = 4800

// Coreografia: a pilha de gomos parte do topo e anda um slot por vez,
// largando um gomo a cada parada (fase 1); o C completo encolhe até a
// posição final (fase 2) e o nome entra (fase 3).
const WEDGE_SLOT_DEG = 29.2 // (360 − 68 da boca) / 10 gomos
const HOP_CYCLE_S = 0.18 // intervalo entre saltos da pilha
const HOP_DUR_S = 0.13 // duração de cada salto
const DEAL_DELAY_S = 0.25 // espera antes do primeiro salto
const DEAL_DUR_S = 9 * HOP_CYCLE_S
const SHRINK_DELAY_S = 1.95

// Gomo i faz (9−i) saltos de um slot junto com a pilha e para no seu lugar.
function wedgeKeyframes(i: number): string {
  const hops = 9 - i
  if (hops === 0) return ''
  const ease = 'animation-timing-function: cubic-bezier(0.33,1,0.68,1);'
  const frames: string[] = [
    `    0% { transform: rotate(${(hops * WEDGE_SLOT_DEG).toFixed(1)}deg); ${ease} }`,
  ]
  for (let k = 1; k <= hops; k++) {
    const pEnd = (((k - 1) * HOP_CYCLE_S + HOP_DUR_S) / DEAL_DUR_S) * 100
    const angle = ((hops - k) * WEDGE_SLOT_DEG).toFixed(1)
    frames.push(`    ${pEnd.toFixed(2)}% { transform: rotate(${angle}deg); }`)
    if (k < hops) {
      const pNext = ((k * HOP_CYCLE_S) / DEAL_DUR_S) * 100
      frames.push(`    ${pNext.toFixed(2)}% { transform: rotate(${angle}deg); ${ease} }`)
    }
  }
  frames.push('    100% { transform: rotate(0deg); }')
  return `  @keyframes sp-wedge-${i} {\n${frames.join('\n')}\n  }`
}

// Marca CERNE — aperture C, 10 gomos. Cores = rampa brand 300→500 do cerne,
// que já são idênticas à rampa green/blue já portada neste projeto
// (confirmado em src/styles/theme/color-tokens.ts: 300=#86efac, 400=#4ade80,
// 500=#22c55e) — por isso os hex abaixo são copiados literal do protótipo,
// sem risco de divergência de cor. Este projeto não tem o objeto `t` de
// tokens do cerne, por isso os valores (cor/fonte) estão literais aqui.
const MARK_WEDGES: Array<{ d: string; c: string }> = [
  { d: 'M 193.06 175.91 A 92 92 0 0 1 166.32 199.49 L 145.50 158.28 A 46 46 0 0 0 154.79 150.10 Z', c: '#86efac' },
  { d: 'M 156.50 204.45 A 92 92 0 0 1 121.65 211.99 L 123.58 165.86 A 46 46 0 0 0 135.68 163.24 Z', c: '#79eba2' },
  { d: 'M 110.66 211.52 A 92 92 0 0 1 76.56 201.10 L 100.75 161.78 A 46 46 0 0 0 112.59 165.40 Z', c: '#6be798' },
  { d: 'M 67.20 195.34 A 92 92 0 0 1 42.52 169.60 L 82.82 147.08 A 46 46 0 0 0 91.39 156.02 Z', c: '#5ee48f' },
  { d: 'M 37.15 160.00 A 92 92 0 0 1 28.16 125.50 L 74.33 125.50 A 46 46 0 0 0 77.45 137.48 Z', c: '#51e085' },
  { d: 'M 28.16 114.50 A 92 92 0 0 1 37.15 80.00 L 77.45 102.52 A 46 46 0 0 0 74.33 114.50 Z', c: '#46db7c' },
  { d: 'M 42.52 70.40 A 92 92 0 0 1 67.20 44.66 L 91.39 83.98 A 46 46 0 0 0 82.82 92.92 Z', c: '#3dd675' },
  { d: 'M 76.56 38.90 A 92 92 0 0 1 110.66 28.48 L 112.59 74.60 A 46 46 0 0 0 100.75 78.22 Z', c: '#34d06d' },
  { d: 'M 121.65 28.01 A 92 92 0 0 1 156.50 35.55 L 135.68 76.76 A 46 46 0 0 0 123.58 74.14 Z', c: '#2bcb66' },
  { d: 'M 166.32 40.51 A 92 92 0 0 1 193.06 64.09 L 154.79 89.90 A 46 46 0 0 0 145.50 81.72 Z', c: '#22c55e' },
]

// Anéis orbitais (px do diâmetro) com suas partículas. Direções alternadas
// (fwd/rev) dão o efeito "anéis de Saturno"; ângulos e tamanhos variados
// deixam a distribuição visualmente aleatória. 6 partículas no total.
type OrbitDot = { angle: number; size: number; color: string; glow: number }
type OrbitRing = {
  size: number
  border: number
  dur: number
  dir: 'fwd' | 'rev'
  dots: OrbitDot[]
}
const ORBIT_RINGS: OrbitRing[] = [
  {
    size: 440,
    border: 0.08,
    dur: 22,
    dir: 'fwd',
    dots: [
      { angle: 28, size: 5, color: '#4ade80', glow: 7 },
      { angle: 168, size: 3, color: '#86efac', glow: 5 },
    ],
  },
  {
    size: 320,
    border: 0.14,
    dur: 15,
    dir: 'rev',
    dots: [
      { angle: 72, size: 6, color: '#4ade80', glow: 9 },
      { angle: 244, size: 4, color: '#22c55e', glow: 6 },
    ],
  },
  {
    size: 220,
    border: 0.1,
    dur: 9,
    dir: 'fwd',
    dots: [
      { angle: 115, size: 5, color: '#86efac', glow: 8 },
      { angle: 300, size: 3, color: '#4ade80', glow: 5 },
    ],
  },
]

const keyframes = `
  @keyframes sp-bg-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sp-ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes sp-ring-spin-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes sp-mark-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sp-mark-shrink {
    from { transform: translateY(62px) scale(3.3); }
    to   { transform: translateY(0) scale(1); }
  }
${MARK_WEDGES.map((_, i) => wedgeKeyframes(i)).filter(Boolean).join('\n')}
  @keyframes sp-name-in {
    from { opacity: 0; transform: translateY(14px) scale(0.96); letter-spacing: 0.35em; }
    to   { opacity: 1; transform: translateY(0)    scale(1);    letter-spacing: 0.22em; }
  }
  @keyframes sp-tag-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes sp-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
`

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  const outDelay = `${DURATION_MS - 400}ms`

  return (
    <>
      <style>{keyframes}</style>
      <div
        role="status"
        aria-label="Carregando GB Cerne"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#081a12',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          fontFamily: "'Outfit', sans-serif",
          animation: `sp-bg-in 0.4s ease both, sp-out 0.4s ease ${outDelay} both`,
          overflow: 'hidden',
        }}
      >
        {/* Radial glow ambiental */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(5,150,105,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Anéis orbitais — partículas circulando como anéis de Saturno,
            cada anel numa direção, espalhadas em ângulos/tamanhos variados */}
        {ORBIT_RINGS.map((ring) => (
          <div
            key={ring.size}
            aria-hidden="true"
            style={{ position: 'absolute', width: ring.size, height: ring.size }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `1px solid rgba(5,150,105,${ring.border})`,
                borderRadius: '50%',
                animation: `${ring.dir === 'rev' ? 'sp-ring-spin-rev' : 'sp-ring-spin'} ${ring.dur}s linear infinite`,
              }}
            >
              {ring.dots.map((dot, di) => (
                <div
                  key={di}
                  style={{ position: 'absolute', inset: 0, transform: `rotate(${dot.angle}deg)` }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -dot.size / 2,
                      left: '50%',
                      width: dot.size,
                      height: dot.size,
                      borderRadius: '50%',
                      background: dot.color,
                      transform: 'translateX(-50%)',
                      boxShadow: `0 0 ${dot.glow}px ${dot.color}`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Marca central + nome */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

          {/* Marca CERNE — aperture C: nasce grande, gomo a gomo, e encolhe até a posição final */}
          <div
            style={{
              animation: `sp-mark-fade 0.35s ease both, sp-mark-shrink 0.7s cubic-bezier(0.22,1,0.36,1) ${SHRINK_DELAY_S}s both`,
            }}
          >
            <svg
              viewBox="0 0 240 240"
              width={84}
              height={84}
              fill="none"
              aria-hidden="true"
            >
              {MARK_WEDGES.map((w, i) => (
                <path
                  key={w.c}
                  d={w.d}
                  fill={w.c}
                  stroke={w.c}
                  strokeWidth={7}
                  strokeLinejoin="round"
                  style={
                    i < MARK_WEDGES.length - 1
                      ? {
                          transformOrigin: '120px 120px',
                          transformBox: 'view-box',
                          animation: `sp-wedge-${i} ${DEAL_DUR_S.toFixed(2)}s linear ${DEAL_DELAY_S}s both`,
                        }
                      : undefined
                  }
                />
              ))}
            </svg>
          </div>

          {/* Nome GB CERNE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.22em',
                lineHeight: 1,
                animation: 'sp-name-in 0.55s cubic-bezier(0.22,1,0.36,1) 2.55s both',
              }}
            >
              GB CERNE
            </span>

            {/* Subtítulo */}
            <span
              style={{
                fontSize: '11px',
                color: '#4ade80',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                animation: 'sp-tag-in 0.45s ease 2.95s both',
              }}
            >
              Sistema de Gestão Agropecuária
            </span>
          </div>

        </div>
      </div>
    </>
  )
}
