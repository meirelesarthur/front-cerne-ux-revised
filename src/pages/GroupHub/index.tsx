// src/pages/GroupHub/index.tsx
// -----------------------------------------------------------------------------
// Central genérica de agrupador do menu (rota `/central/:groupId`).
//
// Clicar no rótulo de um agrupador do 2º nível (ex.: "Agricultura", "Estoque")
// abre esta tela com um card por funcionalidade do grupo. Os itens vêm da árvore
// JÁ PODADA por permissão (`useMenuModules`), então o usuário só vê o que pode
// abrir. Item com filhos (3º nível) vira uma seção com os cards dos filhos.
// Grupo com central própria declara `hubPath` na árvore e não passa por aqui.
// -----------------------------------------------------------------------------

import { Box, Grid, Text } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { ModuleLinkCard } from '@/components/ui/ModuleLinkCard';
import { HubPage } from '@/components/ui/HubPage';
import { PageHeader } from '@/components/ui/PageHeader';
import { GROUP_HUB_BASE, findGroupByHubPath, type NavSubItem } from '@/config/v2/navigationTree';
import { useLanguage } from '@/hooks/useLanguage';
import { useMenuModules } from '@/hooks/useMenuModules';

const CARD_COLUMNS = { base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' };

/** Nº de telas que abrem a partir do grupo (folhas + filhos). */
export function countGroupLeaves(items: NavSubItem[]): number {
  return items.reduce((sum, item) => sum + (item.children?.length ? item.children.length : 1), 0);
}

export default function GroupHub() {
  const { groupId = '' } = useParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const modules = useMenuModules();
  const text = languageGB.sidebar.groupHub;
  const label = (id: string, fallback: string) => languageGB.sidebar.navigation[id] ?? fallback;
  const describe = (id: string) => languageGB.sidebar.descriptions?.[id];

  const found = findGroupByHubPath(`${GROUP_HUB_BASE}/${groupId}`, modules);

  if (!found) {
    return (
      <HubPage>
        <PageHeader title={text.notFoundTitle} description={text.notFoundDescription} />
      </HubPage>
    );
  }

  const { module, group } = found;
  const leaves = group.items.filter((item) => !item.children?.length);
  const sections = group.items.filter((item) => item.children?.length);
  const count = countGroupLeaves(group.items);
  const moduleLabel = label(module.id, module.label);
  const subtitle = (count === 1 ? text.subtitleOne : text.subtitle)
    .replace('{count}', String(count))
    .replace('{module}', moduleLabel);

  return (
    <HubPage>
      <Box>
        <PageHeader title={label(group.id, group.label)} description={subtitle} />

        <Box as="nav" aria-label={text.cardsAriaLabel} mt={{ base: '24px', md: '32px' }}>
          {leaves.length > 0 && (
            <Grid gap="16px" templateColumns={CARD_COLUMNS}>
              {leaves.map((item) => (
                <ModuleLinkCard
                  key={item.id}
                  icon={item.icon ?? group.icon}
                  title={label(item.id, item.label)}
                  description={describe(item.id)}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </Grid>
          )}

          {sections.map((item) => (
            <Box key={item.id} mt={leaves.length > 0 ? '32px' : 0} _notFirst={{ mt: '32px' }}>
              <Text
                as="h2"
                mb="12px"
                fontSize="sm"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.5px"
                color="fg.muted"
              >
                {label(item.id, item.label)}
              </Text>
              <Grid gap="16px" templateColumns={CARD_COLUMNS}>
                {item.children!.map((child) => (
                  <ModuleLinkCard
                    key={child.id}
                    icon={child.icon ?? item.icon ?? group.icon}
                    title={label(child.id, child.label)}
                    description={describe(child.id)}
                    onClick={() => navigate(child.path)}
                  />
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Box>
    </HubPage>
  );
}
