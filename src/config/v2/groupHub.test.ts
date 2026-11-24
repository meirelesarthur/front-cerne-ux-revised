// Central de agrupador: caminho da central (própria ou genérica) e busca do grupo pela rota.
import { describe, expect, it } from 'vitest';

import { navDescriptions as descEn } from '@/constants/languages/languageEnUs/languageSidebarDescriptions';
import { navDescriptions as descEs } from '@/constants/languages/languageEsEs/languageSidebarDescriptions';
import { navDescriptions as descPt } from '@/constants/languages/languagePtBr/languageSidebarDescriptions';

import {
  GROUP_HUB_BASE,
  findGroupByHubPath,
  getGroupHubPath,
  menuModules,
  type NavGroup,
} from './navigationTree';

const group = (over: Partial<NavGroup> = {}): NavGroup => ({
  id: 'g-1',
  label: 'G',
  icon: 'grain',
  items: [],
  ...over,
});

describe('central de agrupador', () => {
  it('usa a central genérica quando o grupo não tem a própria', () => {
    expect(getGroupHubPath(group())).toBe(`${GROUP_HUB_BASE}/g-1`);
  });

  it('usa a central própria quando o grupo declara hubPath', () => {
    expect(getGroupHubPath(group({ hubPath: '/x/central' }))).toBe('/x/central');
  });

  it('Trabalho e compras abre a Central da ordem de compra', () => {
    const operacional = menuModules.find((m) => m.groups?.some((g) => g.id === 'ope-apontamento'));
    const trabalho = operacional!.groups!.find((g) => g.id === 'ope-apontamento')!;
    expect(getGroupHubPath(trabalho)).toBe('/operacional/central');
  });

  it('acha módulo e grupo pela rota da central genérica', () => {
    const found = findGroupByHubPath('/central/adm-suprimentos', menuModules);
    expect(found?.group.id).toBe('adm-suprimentos');
    expect(found?.module.groups).toContain(found?.group);
  });

  it('toda tela de módulo com agrupadores tem descrição nos 3 idiomas', () => {
    const leaves = menuModules
      .flatMap((m) => m.groups ?? [])
      .flatMap((g) => g.items)
      .flatMap((i) => (i.children?.length ? i.children : [i]))
      .map((i) => i.id);
    const missing = (dict: Record<string, string>) => leaves.filter((id) => !dict[id]);
    expect(missing(descPt)).toEqual([]);
    expect(missing(descEn)).toEqual([]);
    expect(missing(descEs)).toEqual([]);
    expect(Object.keys(descEn).sort()).toEqual(Object.keys(descPt).sort());
    expect(Object.keys(descEs).sort()).toEqual(Object.keys(descPt).sort());
  });

  it('não casa rota de outra tela nem grupo inexistente', () => {
    expect(findGroupByHubPath('/administrativo/compras', menuModules)).toBeUndefined();
    expect(findGroupByHubPath('/central/nao-existe', menuModules)).toBeUndefined();
  });
});
