/* eslint-disable import/no-unresolved */

import { ReactNode } from 'react';

import {
  ActionMeta,
  GroupBase,
  NoticeProps,
  components as customComponents,
} from "react-select";
import { AsyncPaginate } from "react-select-async-paginate";
import { StateManagerProps } from "react-select/dist/declarations/src/useStateManager";

import { customStyles } from "@/styles/components/SelectComponent";

import { toaster } from "@/components/ui/toaster";

import customToast from "@/utils/custom-toast";
import strings from "@/utils/strings";

import { Option } from "@/@types/option";
import { PaginationQueryParams } from "@/@types/pagination";
import { ResponsePagination } from "@/@types/response-api";

import { Field } from "./Field";
import { CSSPosition } from "./Select";

export interface SelectAsyncPaginateProps<T = any> extends StateManagerProps {
  label?: string;
  helperText?: string;
  name: string;
  isRequired?: boolean;
  isInactive?: boolean;
  isReadOnly?: boolean;
  error?: string;
  placeholder?: string;
  service: (
    pageParams: PaginationQueryParams,
  ) => Promise<ResponsePagination<T>>;
  pageSize?: number;
  findParams?: (search: string | { search: string }) => any | undefined;
  options?: [
    {
      label: string;
      value: string;
      active?: boolean;
    },
  ];
  mapOptions?: (item: T) => {
    label: string;
    value: string;
    active?: boolean;
  };
  // TASK-BREED-FILTER-CLEAR-FIX: aceita `null` explicitamente. `react-select`
  // trata `value={undefined}` como campo NÃO-CONTROLADO (mantém a seleção
  // interna) e só `value={null}` força o componente controlado a esvaziar —
  // por isso o wrapper precisa tipar `null` como valor válido.
  value?: Option<T> | Option<T>[] | null;
  debounceTimeout?: number;
  cacheUniqs?: readonly any[];
  position?: CSSPosition;
  tooltip?: string;
  /**
   * Desabilita o Portal do menu (`menuPortalTarget`/`menuPosition` do
   * react-select) — use quando o Select está dentro de modais/dialogs
   * (TASK-FE-706/DF-31, mirror EXATO de `disablePortal` já implementado em
   * `Select.tsx`): o menu portalizado em `document.body` cria um filho
   * DIRETO de `<body>`, fora da árvore de `Portal` do `Dialog.Root` (Ark
   * UI/Zag.js) — o Dialog aplica `aria-hidden`/`inert` em elementos fora
   * dessa árvore, deixando o menu VISÍVEL porém NÃO-CLICÁVEL. Quando
   * `true`, `menuPortalTarget`/`menuPosition` recebidos do caller são
   * ignorados e o menu renderiza INLINE (`menuPosition="fixed"`),
   * dentro da mesma árvore de `Portal` do Dialog. NÃO REMOVER sem
   * verificar todos os consumidores dentro de `Dialog.Root` (grep por
   * `SelectAsyncPaginate` + `Dialog.Root` no mesmo arquivo).
   *
   * TASK-FE-063-SELECT-MENU-CLIP-FIX: era `menuPosition="absolute"`, que
   * posiciona o menu relativo ao ancestral posicionado mais próximo —
   * dentro de `Dialog.Body` (`overflow` para scroll do conteúdo do
   * diálogo), o menu era CLIPADO pelo `overflow` do container, cortando
   * opções abaixo da dobra (ex.: Select de Produto do sanitário do
   * Curral). `menuPosition="fixed"` posiciona o menu relativo à VIEWPORT
   * — segue INLINE (sem portal, mesma árvore de `Portal` do Dialog,
   * preservando o fix de `aria-hidden`/`inert`), mas escapa do clipping
   * do `overflow` do ancestral.
   */
  disablePortal?: boolean;
  /**
   * Ação sutil no label do campo (EST-07 — ex.: abrir modal de
   * cadastro/edição de Cliente). Repassada ao `Field`; aditivo e
   * retrocompatível — sem uso, nenhum consumidor muda.
   */
  labelAction?: ReactNode;
  /**
   * Tooltip do `labelAction` (EST-07, esteira 006). Repassada ao `Field`;
   * aditiva e retrocompatível — sem uso, nenhum consumidor muda.
   */
  labelActionTooltip?: string;
  /**
   * Cor (CSS var de token semântico) do texto do valor selecionado/digitado —
   * opt-in para corrigir contraste no tema dark sem alterar os demais consumidores.
   */
  valueColor?: string;
}

export function SelectAsyncPaginate({
  error,
  findParams,
  helperText,
  isRequired,
  isReadOnly,
  label,
  options,
  mapOptions,
  name,
  onChange,
  pageSize,
  placeholder,
  service,
  value,
  components,
  debounceTimeout = 500,
  cacheUniqs,
  isInactive,
  isDisabled,
  position,
  tooltip,
  disablePortal,
  menuPortalTarget,
  menuPosition,
  // TASK-FE-063-SELECT-MENU-PLACEMENT-01: o default do react-select é
  // "bottom" FIXO (sem auto-flip) — quando o trigger está na parte baixa
  // do formulário, o menu estoura pra fora da viewport (rateio de despesa
  // Lote/Fazenda, rateio de adiantamento em Vendas etc.). "auto" deixa o
  // react-select escolher bottom/top conforme espaço disponível.
  // Continua sobrescrevível: o caller pode passar `menuPlacement="top"`/
  // `"bottom"` explicitamente para manter o comportamento fixo onde já era
  // correto.
  menuPlacement = 'auto',
  labelAction,
  labelActionTooltip,
  valueColor,
  ...rest
}: SelectAsyncPaginateProps) {
  const NoOptionsMessage = (
    props: NoticeProps<unknown, false, GroupBase<unknown>>,
  ) => (
    <customComponents.NoOptionsMessage {...props}>
      Sem opções
    </customComponents.NoOptionsMessage>
  );

  const handleFindParams = (search: string) => {
    if (typeof findParams === "function") {
      return findParams(search);
    }
    return undefined;
  };

  const handleLoadOptions = async (
    inputValue: string,
    options: any,
    additional?: any,
  ) => {
    const queryParams = Object.fromEntries(
      Object.entries({
        ...handleFindParams(inputValue),
      }).filter(([, queryParam]) => !!queryParam),
    );

    try {
      const response = await service({
        ...queryParams,
        page: additional?.page || 1,
        per_page: pageSize,
      });

      // Suporte para ResponsePagination (data.items) e Response antiga (data array)
      const items = response.data?.items ?? response.data;
      const mappedOptions = items?.map(mapOptions);

      return {
        options: mappedOptions,
        hasMore: items?.length === pageSize,
        additional: {
          page: (additional?.page || 1) + 1,
        },
      };
    } catch (error: any) {
      // Guarda defensiva (Esteira 017, achado independente durante
      // investigação do bug de "erro de rede" fantasma em Abastecimentos):
      // `error.response` nem sempre existe — um erro lançado DENTRO do try
      // (ex.: `mapOptions` quebrando ao processar um item malformado da
      // resposta, ou qualquer exceção síncrona não-Axios) caía aqui sem
      // `.response`, e o acesso cru `error.response.status` lançava um NOVO
      // `TypeError` de dentro do próprio catch (rejeição não tratada), em
      // vez de mostrar o toast de erro esperado.
      toaster.create(
        customToast({
          status: "error",
          description:
            error?.response?.status === 403
              ? strings.status.forbidden
              : strings.status.loadingError,
        }),
      );
      return { options: [], hasMore: false, additional };
    }
  };

  const handleOnChange = (
    newValue: unknown,
    actionMeta: ActionMeta<unknown>,
  ) => {
    if (typeof onChange === "function") {
      onChange(newValue, actionMeta);
    }
  };

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
      labelAction={labelAction}
      labelActionTooltip={labelActionTooltip}
    >
      {/* <Tooltip
        label={isInactive ? "Esse registro esta inativo" : ""}
        placement="top"
        backgroundColor="semanticNeutral.100"
        color="semanticNeutral.700"
        width="full"
        id="tooltip-inactive"
      > */}

      <AsyncPaginate
        name={name}
        value={value}
        options={options}
        loadOptions={handleLoadOptions}
        onChange={handleOnChange}
        additional={{
          page: 1,
        }}
        debounceTimeout={debounceTimeout}
        placeholder={placeholder}
        styles={customStyles(
          !!error,
          position || "absolute",
          isInactive,
          isReadOnly,
          valueColor,
        )}
        components={{ NoOptionsMessage, ...components }}
        menuIsOpen={isDisabled || isReadOnly ? false : undefined}
        isClearable={!isDisabled || !isReadOnly}
        isSearchable={!isDisabled || !isReadOnly}
        isDisabled={isDisabled || isReadOnly}
        cacheUniqs={cacheUniqs}
        inputId={name}
        instanceId={name}
        menuPortalTarget={disablePortal ? undefined : menuPortalTarget}
        menuPosition={disablePortal ? 'fixed' : menuPosition}
        menuPlacement={menuPlacement}
        {...rest}
      />

      {/* </Tooltip> */}
    </Field>
  );
}

SelectAsyncPaginate.defaultProps = {
  cacheUniqs: undefined,
  error: "",
  findParams: undefined,
  helperText: "",
  isRequired: false,
  isReadOnly: false,
  label: "",
  mapOptions: (item?: { label: string; value: string; active: boolean }) => ({
    label: item?.label,
    value: item?.value,
    active: true,
  }),
  onChange: undefined,
  pageSize: 10,
  placeholder: "",
  value: undefined,
  options: undefined,
};
