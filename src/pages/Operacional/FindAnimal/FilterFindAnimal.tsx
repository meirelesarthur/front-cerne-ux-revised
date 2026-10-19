// src/pages/Operacional/FindAnimal/FilterFindAnimal.tsx
// -----------------------------------------------------------------------------
// SURF-FORM-FILTER / SURF-FIELD-ANIMAL-ID / SURF-ACTION-FILTRAR da tela
// "Localizar Animal" (F-042, TASK-FA-FE-03). Faixa de filtro INLINE (não
// drawer — contrato de tela §6.2: não há `paginatedQuery`, então NÃO se usa
// `FilterSide`/Contrato B `FilterModalProps<T>`), mas a casca continua sendo
// `<Form formFilter>` com `Form.BodyFilter`/`Form.FooterFilter` — NUNCA
// `<VStack as="form">`/`<Box as="form">`/`<form>` nativo (Regra 3/ADR-FE-01).
//
// ⚠️ CORREÇÃO (achados do dono, run-001, `tp-front-exec-lane-a-04`):
// (1) `noPadding` no `<Form formFilter>` — SEM ele, `Form` soma o próprio
// `paddingX` (10, ~40px, pensado para o gutter de um drawer `FilterSide`) ao
// `paddingX` que o `ContainerGrid` já aplica na tela, desalinhando o filtro
// em relação aos painéis do dossiê abaixo. TODOS os demais `<Form
// formFilter>` do repositório (drawers `FilterSide*`) já passam `noPadding`
// — esta tela ficou fora do padrão por não ter passado por um drawer.
// (2) `menuPortalTarget`/`menuPosition` no `<SelectAsyncPaginate>` — SEM
// eles, o menu do react-select não é portalizado para `document.body` e
// renderiza INLINE no fluxo normal do documento (não absoluto/fixo relativo
// à viewport), aparecendo como lista crua empurrando o `Filtrar` para baixo
// e mascarando o control fechado do Select. Mirror EXATO de todo uso de
// página de `<SelectAsyncPaginate>` no repositório (ex.:
// `FilterSideNascimentos.tsx`, `FilterSideVendaAnimais.tsx`,
// `FilterSideDeathAnimals.tsx`, `FilterSideWeaning.tsx`).
// (3) `pb={6}` no `<Form.BodyFilter>` — a estrutura já estava correta
// (campo em `Form.BodyFilter`, botão em `Form.FooterFilter`; achado 4 NÃO
// é defeito estrutural). O aperto vem de `Form` (formFilter) envolver o
// corpo/rodapé num `<Flex direction="column" justify="space-between"
// height="full">`: esse `space-between` só abre respiro quando o
// container tem altura FIXA sobrando (caso do drawer `FilterSide`, com
// altura do viewport); nesta tela inline, sem altura fixa herdada, a
// altura do Flex colapsa para a do conteúdo e o `space-between` não tem
// o que distribuir — corpo e rodapé ficam colados. `pb={6}` no
// `Form.BodyFilter` usa o MESMO token de espaçamento já usado entre os
// blocos desta fatia (`index.tsx` `mt={6}`; `BatchTransferForm.tsx`
// `mt={6} pt={6}`) — coerente com o alinhamento do achado 2, sem margem
// avulsa nem valor fora da escala.
// -----------------------------------------------------------------------------

import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';

interface FilterFindAnimalValues {
  animal: Option<string> | null;
}

interface FilterFindAnimalProps {
  onFilter: (animalUuid: string) => void;
}

export function FilterFindAnimal({ onFilter }: FilterFindAnimalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.livestock.findAnimal;

  const { control, handleSubmit, reset } = useForm<FilterFindAnimalValues>({
    defaultValues: { animal: null },
  });

  function onSubmit(data: FilterFindAnimalValues) {
    if (!data.animal?.value) return;

    onFilter(data.animal.value);

    // ⚠️ D1-a — REPRODUZIR FIELMENTE o defeito de UX do legado. Decisão
    // CONSCIENTE do dono (recibo `OD-lane-a-frontend-fidelidade-e-feedback`,
    // sha256 `d966af95da2260eb889bf1f599b1f8638b28fe190482e728ddb91532709252fc`,
    // reverte o default do arquiteto), rastreada em `GAP-FE-FA-04` §1 e no
    // contrato de tela §6.2/§6.5 (Regra 6 de TASK-FA-FE-03).
    //
    // No legado (`agro365/resources/views/locate-animals/index.blade.php:31`)
    // o `<select>` é renderizado sem NENHUMA `<option>`, então o animal
    // buscado nunca reaparece no campo após o submit/reload. O
    // `<SelectAsyncPaginate>` sob `<Controller>` manteria o `Option`
    // selecionado por natureza — este `reset()` é limpeza DELIBERADA (custa
    // código a mais, não a menos) para reproduzir o mesmo vazio: o campo
    // volta ao placeholder e NÃO re-hidrata a partir de `?animal=<uuid>`. O
    // dossiê (via `index.tsx`) continua carregando e re-hidratando normal —
    // só este campo fica vazio. NÃO é bug — não "conserte" isto numa
    // revisão futura.
    reset({ animal: null });
  }

  return (
    <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
      <Form.BodyFilter pb={6}>
        <Controller
          name="animal"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.filter.animalLabel}
              placeholder={text.filter.animalPlaceholder}
              service={listAnimalOptions}
              mapOptions={(item: AnimalOptionListItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Form.BodyFilter>
      <Form.FooterFilter>
        <Button type="submit" title={text.filter.submit} />
      </Form.FooterFilter>
    </Form>
  );
}
