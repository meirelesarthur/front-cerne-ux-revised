// src/components/Form/CollapsibleSectionGroup.tsx
// -----------------------------------------------------------------------------
// exec-038 HOMOLOG R2 (R2-01, achado E2E do dono) — agrupa várias
// `CollapsibleSection` num ÚNICO `Accordion.Root` compartilhado, dando
// comportamento de accordion real ("abrir uma seção fecha as outras"). Ark-UI/
// zag-js Accordion tem `multiple: false` como DEFAULT (confirmado em
// `@zag-js/accordion/dist/accordion.machine.js`) — não é preciso nenhum
// estado controlado manual, só compartilhar o mesmo Root entre os Items.
//
// Uso: envolva as `CollapsibleSection` que devem se excluir mutuamente,
// cada uma com um `sectionId` próprio; `defaultOpenSectionId` decide qual
// abre ao carregar (`undefined`/omitido = todas fechadas).
//
//   <CollapsibleSectionGroup defaultOpenSectionId="service-type">
//     <CollapsibleSection sectionId="service-type" title="..">...</CollapsibleSection>
//     <CollapsibleSection sectionId="execution" title="..">...</CollapsibleSection>
//   </CollapsibleSectionGroup>
//
// Seções FORA do grupo continuam com Root próprio (independentes,
// comportamento pré-existente inalterado) — usar o grupo é OPT-IN por
// página, não uma mudança global de `CollapsibleSection`.
// -----------------------------------------------------------------------------
import { ReactNode } from 'react';

import { Accordion } from '@chakra-ui/react';

import { CollapsibleSectionGroupContext } from './CollapsibleSection';

export interface CollapsibleSectionGroupProps {
  children: ReactNode;
  /** `sectionId` da `CollapsibleSection` que deve nascer aberta. Omitido =
   *  todas as seções do grupo nascem fechadas. */
  defaultOpenSectionId?: string;
}

export function CollapsibleSectionGroup({
  children,
  defaultOpenSectionId,
}: CollapsibleSectionGroupProps) {
  return (
    <Accordion.Root
      collapsible
      defaultValue={defaultOpenSectionId ? [defaultOpenSectionId] : []}
      mb={6}
    >
      <CollapsibleSectionGroupContext.Provider value={true}>
        {children}
      </CollapsibleSectionGroupContext.Provider>
    </Accordion.Root>
  );
}
