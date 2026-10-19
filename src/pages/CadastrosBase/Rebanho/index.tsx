// src/pages/CadastrosBase/Rebanho/index.tsx
// -----------------------------------------------------------------------------
// Wrapper fino da tela Rebanho (Cadastros Base / Pecuários) — rota
// `/cadastros-base/rebanho`, guardada por `anyOf={['animals_view',
// 'animals-management_view']}` em `router/index.tsx`.
//
// A partir da Tarefa 53 (execução 017, item 4/4 — reversão de SD-01, ver
// contrato de tela `97-Esteiras/017/CONTRATOS/contrato-tela-gestao-animais-
// dedicada.md` §2 AD-F06), o núcleo de grid/filtro/lote foi EXTRAÍDO para
// `AnimalListScreen` (parametrizado por `basePath`/`pageTitle`/`pageSubtitle`/
// `storageKeyPrefix`), reaproveitado também por `Operacional/GestaoAnimais/
// index.tsx` (Tarefa 54). Este arquivo não contém mais lógica própria — só
// injeta os parâmetros desta rota. Nenhuma mudança de comportamento
// pretendida: mesmo `storageKey` efetivo (`'CadastrosBaseRebanho' +
// queryKey.animals.animalsList`), mesmo título/subtítulo, mesma navegação.
// -----------------------------------------------------------------------------

import { useLanguage } from '@/hooks/useLanguage';

import { AnimalListScreen } from './AnimalListScreen';

export default function RebanhoList() {
  const { languageGB } = useLanguage();
  const text = languageGB.animals.animal;

  return (
    <AnimalListScreen
      basePath="/cadastros-base/rebanho"
      pageTitle={text.list.pageTitle}
      pageSubtitle={text.list.pageSubtitle}
      storageKeyPrefix="CadastrosBaseRebanho"
    />
  );
}
