/* eslint-disable import/no-unresolved */
// src/components/Form/SelectCultivation.tsx
// -----------------------------------------------------------------------------
// SelectCultivation — Select agrupado de Cultura/Variedade (TASK-FE-643,
// achados AP-12/DF-16). Só a Variedade (folha) é selecionável; a Cultura
// (raiz) aparece como cabeçalho de grupo NÃO clicável — comportamento NATIVO
// do `react-select` (`GroupBase<Option>[]`), sem componente novo de UI
// dedicado no Storybook do `cerne` (adaptação de recurso já usado pelo
// `SelectAsyncPaginate`, ver Passo UX da Tarefa).
//
// Fonte: `GET /cultivations/active` (`getCultivationActive`, já existe SEM
// mudança) — catálogo pequeno, NÃO-paginado, buscado 1x via `useQuery` direto
// (mirror "Caso derivado — filtro em árvore/hierarquia",
// `get_pwa_complex_screen_compositions_pattern` — sem `paginatedQuery`). Busca
// por texto é NATIVA do `react-select` dentro de grupos — sem `AsyncPaginate`,
// sem debounce, sem novo request por tecla. Mesma `queryKey.cultivation.active`
// já usada por `useCultivationActiveOptions`
// (`src/pages/BaseRegistrations/Cultivation/useCultivation.tsx`) — cache
// COMPARTILHADO entre a tela de Cultura/Variedade e este Select (mesma
// chave, TanStack Query deduplica), sem acoplar este componente de
// `components/Form` a um hook de `pages/` (camadas separadas).
//
// `listCultivationOptions`/`GET /cultivations/options` (catálogo FLAT) NÃO é
// tocado por este componente — continua servindo `SelectAsyncPaginate` em
// outros consumidores (ex. `ProdutoEstoqueFinanceiroTab.tsx`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import RSelect, { type GroupBase } from 'react-select';

import { customStyles } from '@/styles/components/SelectComponent';

import { queryKey } from '@/constants/query-key';

import { getCultivationActive } from '@/services/v2/Cultivation/cultivation-service';

import type { Option } from '@/@types/option';
import type { CultivationTreeNode } from '@/@types/v2/Cultivation/cultivation';

import { Field } from './Field';

import type { CSSPosition } from './Select';

export interface SelectCultivationProps {
  label?: string;
  helperText?: string;
  name: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  error?: string;
  placeholder?: string;
  // Sempre `Option | null` — nunca `undefined` (Armadilha #3, ver
  // TASK-FE-642: `react-select` trata `value={undefined}` como
  // NÃO-CONTROLADO e mantém a seleção interna anterior).
  value?: Option | null;
  onChange?: (option: Option | null) => void;
  position?: CSSPosition;
  tooltip?: string;
  menuPortalTarget?: HTMLElement | null;
  menuPosition?: 'absolute' | 'fixed';
}

export function SelectCultivation({
  error,
  helperText,
  isRequired,
  isDisabled,
  isReadOnly,
  label,
  name,
  onChange,
  placeholder,
  value,
  position,
  tooltip,
  menuPortalTarget,
  menuPosition,
}: SelectCultivationProps) {
  const { data: cultivationTree, isLoading } = useQuery({
    queryKey: [queryKey.cultivation.active],
    queryFn: async () => {
      const response = await getCultivationActive();
      return (response.data ?? []) as CultivationTreeNode[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Transforma a árvore (raízes = Cultura, `children` = Variedade) num
  // `GroupBase<Option>[]` — o `react-select` renderiza `label` do grupo como
  // cabeçalho NÃO clicável nativamente (built-in, sem código adicional).
  // Raízes SEM filhos (Cultura sem Variedade cadastrada ainda) não aparecem
  // como grupo vazio — edge case sem dado hoje, ver Tarefa.
  const groupedOptions = useMemo<GroupBase<Option>[]>(() => {
    const roots = (cultivationTree ?? []) as CultivationTreeNode[];
    return roots
      .filter((root) => (root.children?.length ?? 0) > 0)
      .map((root) => ({
        label: root.name,
        options: (root.children ?? []).map((child) => ({
          label: child.name,
          value: child.uuid,
        })),
      }));
  }, [cultivationTree]);

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
    >
      <RSelect<Option, false, GroupBase<Option>>
        name={name}
        inputId={name}
        instanceId={name}
        value={value ?? null}
        onChange={(option) => onChange?.((option as Option | null) ?? null)}
        options={groupedOptions}
        isLoading={isLoading}
        placeholder={placeholder}
        noOptionsMessage={() => 'Sem opções'}
        styles={customStyles(!!error, position || 'absolute')}
        isClearable={!isDisabled && !isReadOnly}
        isSearchable={!isDisabled && !isReadOnly}
        isDisabled={isDisabled || isReadOnly}
        menuIsOpen={isDisabled || isReadOnly ? false : undefined}
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPosition}
      />
    </Field>
  );
}
