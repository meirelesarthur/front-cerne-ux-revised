// Reprodução isolada + regressão do fix de homologação (97-Esteiras/061,
// TASK-PACKET "fix 1ª carga do form de Site") em `Site/index.tsx::fillSiteForm`.
//
// Causa-raiz CONFIRMADA por reprodução direta (vitest, fora deste arquivo,
// descartada após confirmação): `RichTextEditor`'s `useEffect([isDisabled,
// editor])` chama `editor.setEditable(!isDisabled)` SEM o 2º argumento
// `emitUpdate: false` do Tiptap (`Editor.setEditable(editable, emitUpdate =
// true)` — default É `true`, ver `@tiptap/core/dist/index.js`). Isso dispara
// um `onUpdate`/`onChange` ESPONTÂNEO — comprovado: `onChange('<p></p>')`
// chamado sem NENHUMA interação do usuário — já na montagem do editor
// (isDisabled=true no mount, ou de novo quando isDisabled transiciona
// true->false ao terminar o loading). Via `Controller name="about"`, esse
// onChange espontâneo marca `dirtyFields.about` ANTES do GET `getSite`
// resolver pela 1ª vez (cache frio).
//
// `fillSiteForm` (Site/index.tsx) só chamava `reset(...)` quando
// `!isEmpty(dirtyFields)` (`isEmpty` é INVERTIDO — `src/utils/isEmpty.ts`
// retorna `true` quando HÁ alguma chave — então `!isEmpty(dirtyFields)`
// equivale a "form pristino"). Com `about` já dirty na montagem, o guard
// pulava o `reset` inteiro (published/instagram/facebook/twitter/youtube/
// whatsapp/about — TODOS os campos RHF, não só `about`) — exatamente o
// sintoma relatado: "só a imagem carrega" (o banner fica fora do guard, ver
// `if (!imageFile) setCurrentImageUrl(...)`).
//
// Em aberturas seguintes o `queryKey.site` já está em cache do TanStack
// Query — `fillSiteForm` roda no MESMO ciclo de montagem que popula os dados,
// diferente da 1ª vez (cache frio, GET real) — por isso "funcionava depois".
//
// Fix: `hasHydratedRef` faz a 1ª chamada bem-sucedida de `fillSiteForm`
// popular INCONDICIONALMENTE, e só reaplica o guard de `dirtyFields` a partir
// da 2ª chamada em diante (refetch em background não deve atropelar edição
// do usuário).
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface SiteFormShape {
  published: boolean;
  instagram: string;
  about: string;
}

const FETCHED_DATA: SiteFormShape = {
  published: true,
  instagram: 'https://instagram.com/fazenda',
  about: '<p>Sobre a fazenda</p>',
};

function setup(defaultValues: SiteFormShape) {
  return renderHook(() => {
    const {
      setValue,
      reset,
      formState: { dirtyFields },
      getValues,
    } = useForm<SiteFormShape>({ defaultValues });
    return { setValue, reset, dirtyFields, getValues };
  });
}

// Mirror do `fillSiteForm` ORIGINAL (guard só por `dirtyFields`, SEM
// `hasHydratedRef`) — reproduz o bug.
function fillSiteFormOriginal(
  data: SiteFormShape,
  dirtyFields: Record<string, unknown>,
  reset: (v: SiteFormShape) => void
) {
  if (!isEmpty(dirtyFields)) {
    reset(data);
  }
}

// Mirror do `fillSiteForm` CORRIGIDO (com `hasHydratedRef`).
function fillSiteFormFixed(
  data: SiteFormShape,
  dirtyFields: Record<string, unknown>,
  reset: (v: SiteFormShape) => void,
  hasHydratedRef: { current: boolean }
) {
  if (!hasHydratedRef.current || !isEmpty(dirtyFields)) {
    reset(data);
    hasHydratedRef.current = true;
  }
}

describe('Site/index.tsx fillSiteForm — guard de hidratação da 1ª carga', () => {
  it('BUG reproduzido: guard original pula o reset quando algum Controller já sujou dirtyFields antes da 1ª carga resolver', () => {
    // simula o onChange espontâneo do RichTextEditor (setEditable sem
    // emitUpdate:false) sujando "about" ANTES do GET resolver — sem
    // nenhuma interação real do usuário — via `setValue({shouldDirty:true})`,
    // mirror exato do que o `field.onChange` do Controller faz por baixo.
    const { result: result2 } = setup({ published: false, instagram: '', about: '' });

    act(() => {
      result2.current.setValue('about', '<p></p>', { shouldDirty: true });
    });

    expect(result2.current.dirtyFields.about).toBe(true);

    fillSiteFormOriginal(FETCHED_DATA, result2.current.dirtyFields, result2.current.reset);

    // BUG: como "about" já estava dirty, o reset inteiro foi pulado — os
    // dados buscados NUNCA chegam ao form na 1ª carga.
    expect(result2.current.getValues()).toEqual({
      published: false,
      instagram: '',
      about: '<p></p>',
    });
  });

  it('FIX: hasHydratedRef força a 1ª carga a popular mesmo com dirtyFields sujo pelo Controller', () => {
    const { result } = setup({ published: false, instagram: '', about: '' });

    act(() => {
      result.current.setValue('about', '<p></p>', { shouldDirty: true });
    });

    const hasHydratedRef = { current: false };
    expect(result.current.dirtyFields.about).toBe(true);

    fillSiteFormFixed(
      FETCHED_DATA,
      result.current.dirtyFields,
      result.current.reset,
      hasHydratedRef
    );

    // FIX: mesmo com "about" dirty na montagem, a 1ª carga popula TODOS os
    // campos com o que veio do GET.
    expect(result.current.getValues()).toEqual(FETCHED_DATA);
    expect(hasHydratedRef.current).toBe(true);
  });

  it('FIX: depois da 1ª hidratação, um refetch em background NÃO atropela edição do usuário em andamento', () => {
    const { result } = setup(FETCHED_DATA);

    const hasHydratedRef = { current: true }; // já hidratado pela 1ª carga

    // usuário edita "instagram" localmente, sem ainda salvar.
    act(() => {
      result.current.setValue('instagram', 'https://instagram.com/rascunho-do-usuario', {
        shouldDirty: true,
      });
    });
    expect(result.current.dirtyFields.instagram).toBe(true);

    const refetchedData: SiteFormShape = {
      ...FETCHED_DATA,
      instagram: 'https://instagram.com/outro-valor-do-servidor',
    };
    fillSiteFormFixed(
      refetchedData,
      result.current.dirtyFields,
      result.current.reset,
      hasHydratedRef
    );

    // guard de dirtyFields (2ª chamada em diante) continua protegendo a
    // edição do usuário — o refetch em background NÃO sobrescreve.
    expect(result.current.getValues().instagram).toBe('https://instagram.com/rascunho-do-usuario');
  });
});
