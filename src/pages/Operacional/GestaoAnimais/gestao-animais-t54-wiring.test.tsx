// src/pages/Operacional/GestaoAnimais/gestao-animais-t54-wiring.test.tsx
// -----------------------------------------------------------------------------
// Prova de wiring da Tarefa 54 (execução 017, item 4/4 — reversão de SD-01,
// contrato `97-Esteiras/017/CONTRATOS/contrato-tela-gestao-animais-
// dedicada.md` §2/§4). `Operacional/GestaoAnimais/index.tsx` é um wrapper
// fino sobre o MESMO `AnimalListScreen` extraído na Tarefa 53 — este teste
// prova que:
//
//  1. `basePath`/`storageKeyPrefix` são os da tela DEDICADA
//     ('/operacional/gestao-animais' / 'OperacionalGestaoAnimais'), NUNCA os
//     de Rebanho — a tela nova não deve navegar nem persistir estado sob o
//     path/`storageKey` de Rebanho.
//  2. `pageTitle`/`pageSubtitle` vêm do namespace i18n NOVO
//     (`languageGB.animals.animal.managementScreen`), não de `list.*`
//     (que continua sendo só de Rebanho) — título da tela é "Gestão
//     Animais", não "Rebanho" (DoD da Tarefa 54).
//  3. `storageKeyPrefix` desta tela é DIFERENTE do de Rebanho
//     ('CadastrosBaseRebanho') — AD-F09, isolamento de filtro/página
//     persistidos entre as duas entradas de menu.
// -----------------------------------------------------------------------------

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

let capturedAnimalListScreenProps: Record<string, unknown> | null = null;

vi.mock('@/pages/CadastrosBase/Rebanho/AnimalListScreen', () => ({
  AnimalListScreen: (props: Record<string, unknown>) => {
    capturedAnimalListScreenProps = props;
    return null;
  },
}));

describe('Tarefa 54 — GestaoAnimaisList injeta basePath/storageKeyPrefix/i18n da tela DEDICADA', () => {
  it('basePath e storageKeyPrefix são os de /operacional/gestao-animais, distintos dos de Rebanho', async () => {
    capturedAnimalListScreenProps = null;

    const { default: GestaoAnimaisList } = await import('./index');

    render(<GestaoAnimaisList />);

    await waitFor(() => expect(capturedAnimalListScreenProps).not.toBeNull());

    const languageGB = getLanguageRouter(languageContextTypes.BR);
    const text = languageGB.animals.animal;

    expect(capturedAnimalListScreenProps).toMatchObject({
      basePath: '/operacional/gestao-animais',
      storageKeyPrefix: 'OperacionalGestaoAnimais',
      pageTitle: text.managementScreen.pageTitle,
      pageSubtitle: text.managementScreen.pageSubtitle,
    });

    // AD-F09 — isolamento de estado persistido: o prefixo desta tela NUNCA
    // pode colidir com o de Rebanho (senão um filtro salvo em
    // `/cadastros-base/rebanho` "vazaria" para `/operacional/gestao-animais`,
    // e vice-versa).
    expect(capturedAnimalListScreenProps!.storageKeyPrefix).not.toBe('CadastrosBaseRebanho');
    expect(capturedAnimalListScreenProps!.basePath).not.toBe('/cadastros-base/rebanho');

    // DoD "Título da tela é 'Gestão Animais' (não 'Rebanho')" — prova que a
    // fonte i18n é o namespace novo, não `list.pageTitle` (que continua
    // sendo "Rebanho").
    expect(capturedAnimalListScreenProps!.pageTitle).not.toBe(text.list.pageTitle);
  });
});
