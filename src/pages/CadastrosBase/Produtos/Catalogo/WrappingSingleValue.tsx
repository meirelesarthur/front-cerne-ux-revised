// src/pages/CadastrosBase/Produtos/Catalogo/WrappingSingleValue.tsx
// -----------------------------------------------------------------------------
// UT-000781 — `SingleValue` local (react-select 5) que QUEBRA LINHA em vez de
// truncar com reticências. Usado SÓ nos selects de rótulo longo
// ("código — descrição") da tela de Produtos, via prop `components` do
// `SelectAsyncPaginate` (que já faz o merge com `NoOptionsMessage`).
//
// Sobrepõe apenas o estilo `singleValue`; o `SelectComponent.ts`
// compartilhado (682 consumidores) NÃO é alterado. O `control` do select não
// tem altura fixa (só `minHeight`), então cresce junto com o valor.
// -----------------------------------------------------------------------------

import {
  components,
  type GroupBase,
  type PlaceholderProps,
  type SingleValueProps,
} from 'react-select';

export function WrappingSingleValue<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SingleValueProps<Option, IsMulti, Group>) {
  const { getStyles } = props;

  return (
    <components.SingleValue
      {...props}
      getStyles={(name, styleProps) => {
        const base = getStyles(name, styleProps);
        if (name !== 'singleValue') return base;
        return {
          ...base,
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'clip',
          overflowWrap: 'anywhere',
        };
      }}
    />
  );
}

// UT-000781 (G2) — mesmo tratamento para o PLACEHOLDER: o `SelectComponent.ts`
// compartilhado o trunca com reticências ("Selecione a unidade de medida"
// cortado em colunas estreitas).
export function WrappingPlaceholder<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: PlaceholderProps<Option, IsMulti, Group>) {
  const { getStyles } = props;

  return (
    <components.Placeholder
      {...props}
      getStyles={(name, styleProps) => {
        const base = getStyles(name, styleProps);
        if (name !== 'placeholder') return base;
        return {
          ...base,
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'clip',
          overflowWrap: 'anywhere',
        };
      }}
    />
  );
}

/** Prop `components` dos selects de rótulo/placeholder longo da tela de Produtos. */
export const WRAPPING_SELECT_COMPONENTS = {
  SingleValue: WrappingSingleValue,
  Placeholder: WrappingPlaceholder,
} as const;
