// src/pages/Operacional/GestaoAnimais/index.tsx
// -----------------------------------------------------------------------------
// Tela DEDICADA "Gestão Animais" (Operacional > Pecuária) — rota
// `/operacional/gestao-animais`, guardada por `anyOf={['animals_view',
// 'animals-management_view']}` em `router/index.tsx` (mesma guarda dupla de
// `/cadastros-base/rebanho`).
//
// Execução 017 (item 4/4) — reversão de SD-01 (Tarefa 54, ver contrato de
// tela 97-Esteiras/017/CONTRATOS/contrato-tela-gestao-animais-dedicada.md
// §2/§4). Wrapper fino: 100% do corpo de grid/filtro/lote vem do MESMO
// núcleo (`AnimalListScreen`) extraído de `Rebanho/index.tsx` na Tarefa 53 —
// nenhuma lógica nova, só título/subtítulo/`storageKeyPrefix` próprios desta
// rota, para que o usuário que entra por "Gestão Animais" tenha URL/
// identidade visual e memória de filtro/página distintas de quem entra por
// "Cadastros Base > Rebanho", sem duplicar código.
// -----------------------------------------------------------------------------

import { AnimalListScreen } from '@/pages/CadastrosBase/Rebanho/AnimalListScreen';

import { useLanguage } from '@/hooks/useLanguage';

export default function GestaoAnimaisList() {
  const { languageGB } = useLanguage();
  const text = languageGB.animals.animal;

  return (
    <AnimalListScreen
      basePath="/operacional/gestao-animais"
      pageTitle={text.managementScreen.pageTitle}
      pageSubtitle={text.managementScreen.pageSubtitle}
      storageKeyPrefix="OperacionalGestaoAnimais"
    />
  );
}
