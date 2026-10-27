// src/components/ui/steps.tsx
// -----------------------------------------------------------------------------
// Wrapper sobre o `Steps` nativo do Chakra UI v3. RESKIN (execução 024,
// GAP-FE-127 — decisão do dev: Opção B aprovada) fiel ao `Stepper.tsx` do
// design system `cerne` (GB.Cerne.UX/src/components/ui/Stepper.tsx): círculos
// SEM número (vazio = pendente, contorno = etapa atual, preenchido =
// concluída, cor `colorPalette.solid` — rampa `green`/brand do projeto) ligados
// por uma linha de progresso colorida, com o label ABAIXO do círculo (antes:
// numerado, ícone de check, label ao lado). Compartilhado por 2 wizards —
// Fazenda (`CreateOrUpdateFarm.tsx`) e Pessoas (`CreateOrUpdatePessoa.tsx`,
// GAP-FE-127) — a mudança É intencional nas duas telas (aprovada pelo dev,
// ambas ganham fidelidade ao DS). Continua fino wrapper: só estiliza via
// slots oficiais do Chakra (`Trigger`/`Indicator`/`Title`/`Separator` +
// `ItemContext` para ler estado current/completed, mesmo padrão que o próprio
// `StepsNumber` oficial do Chakra usa internamente) — não reescreve a máquina
// de estado do Ark UI.
// -----------------------------------------------------------------------------
'use client';

import * as React from 'react';

import { Box, Steps as ChakraSteps } from '@chakra-ui/react';

// Diâmetros do ponto (DS: t.space[3] = 12px · t.space[4] = 16px).
const STEP_DOT = '12px';
const STEP_DOT_ACTIVE = '16px';

interface StepsItemProps extends Omit<ChakraSteps.ItemProps, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Opcional: tamanho fixo do indicador (token Chakra) para exibir o número legível. Sem a prop, mantém o ponto atual. */
  indicatorSize?: string;
}

interface StepsItemState {
  current: boolean;
  completed: boolean;
}

export const StepsItem = React.forwardRef<HTMLDivElement, StepsItemProps>(
  function StepsItem(props, ref) {
    const { title, description, indicatorSize, ...rest } = props;
    return (
      // @ts-ignore - Chakra UI v3 headless Steps: tipos ainda não compatíveis
      <ChakraSteps.Item {...rest} ref={ref} css={{ alignItems: "flex-start", ...(rest as any).css }}>
        {/* @ts-ignore - Chakra UI v3 headless Steps */}
        <ChakraSteps.ItemContext>
          {({ current, completed }: StepsItemState) => (
            <>
              {/* @ts-ignore - Chakra UI v3 headless Steps */}
              <ChakraSteps.Trigger
                css={{
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px", // DS space[2]
                  textAlign: "center",
                  padding: 0,
                  flex: "0 0 auto",
                }}
              >
                {/* Trilho fixo de 16px: o ponto (12px/16px) fica centralizado e a
                    linha de progresso alinha ao centro dele (DS Stepper.tsx). */}
                <Box
                  width={STEP_DOT_ACTIVE}
                  height={STEP_DOT_ACTIVE}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {/* @ts-ignore - Chakra UI v3 headless Steps */}
                  <ChakraSteps.Indicator
                    css={{
                      // DS: concluída = preenchida; atual = contorno; pendente = contorno neutro.
                      // Sem número (o Chakra renderiza o número por padrão — por isso o
                      // conteúdo vazio explícito). Com `indicatorSize` o número volta (uso
                      // da Pesagem Rodoviária).
                      boxSize: indicatorSize ?? (current ? STEP_DOT_ACTIVE : STEP_DOT),
                      ...(indicatorSize ? { fontSize: "xs", fontWeight: "bold", flexShrink: 0 } : {}),
                      borderRadius: "full",
                      boxSizing: "border-box",
                      borderWidth: completed ? "0" : "2px",
                      borderStyle: "solid",
                      bg: completed ? "green.600" : "bg.surface",
                      color: completed ? "white" : "fg.muted",
                      borderColor: current ? "green.600" : "border.default",
                      transition:
                        "background 0.2s ease, border-color 0.2s ease, width 0.2s ease, height 0.2s ease",
                    }}
                  >
                    {indicatorSize ? undefined : <></>}
                  </ChakraSteps.Indicator>
                </Box>
                {title && (
                  // @ts-ignore - Chakra UI v3 headless Steps
                  <ChakraSteps.Title
                    css={{
                      fontSize: "xs",
                      whiteSpace: "nowrap",
                      fontWeight: current ? "600" : "400", // DS: semibold só na etapa atual
                      color: completed || current ? "selectedText" : "fg.muted",
                    }}
                  >
                    {title}
                    {description && (
                      // @ts-ignore - Chakra UI v3 headless Steps
                      <ChakraSteps.Description>{description}</ChakraSteps.Description>
                    )}
                  </ChakraSteps.Title>
                )}
              </ChakraSteps.Trigger>
              {/* @ts-ignore - Chakra UI v3 headless Steps — linha de progresso (2px, centro do ponto) */}
              <ChakraSteps.Separator
                css={{
                  height: "2px",
                  marginTop: "7px", // centro do trilho de 16px menos metade da linha
                  marginInline: 0,
                  bg: completed ? "green.600" : "border.default",
                  transition: "background 0.2s ease",
                }}
              />
            </>
          )}
        </ChakraSteps.ItemContext>
      </ChakraSteps.Item>
    );
  }
);

export const StepsList = ChakraSteps.List;

/**
 * `colorPalette="green"` default — rampa brand do `cerne` neste projeto
 * (`src/styles/theme/color-tokens.ts`). Consumidores podem sobrescrever
 * passando a prop explicitamente (nenhum dos 2 consumidores atuais passa).
 */
export const StepsRoot = React.forwardRef<HTMLDivElement, ChakraSteps.RootProps>(
  function StepsRoot(props, ref) {
    // @ts-ignore - Chakra UI v3 headless Steps
    return <ChakraSteps.Root colorPalette="green" {...props} ref={ref} />;
  }
);

export const StepsContent = ChakraSteps.Content;
export const StepsCompletedContent = ChakraSteps.CompletedContent;
export const StepsNextTrigger = ChakraSteps.NextTrigger;
export const StepsPrevTrigger = ChakraSteps.PrevTrigger;

// Namespace completo — reexportado para consumidores que preferem
// `Steps.Root`/`Steps.List`/`Steps.Item` (mesma convenção usada aqui).
export const Steps = {
  Root: StepsRoot,
  List: StepsList,
  Item: StepsItem,
  Content: StepsContent,
  CompletedContent: StepsCompletedContent,
  NextTrigger: StepsNextTrigger,
  PrevTrigger: StepsPrevTrigger,
};
