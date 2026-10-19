// src/components/Form/SelectCombobox.tsx
// -----------------------------------------------------------------------------
// Select client-side GENÉRICO e reutilizável — Chakra UI v3 `Combobox.Root` +
// `useListCollection` + `useFilter`. Busca CLIENT-SIDE sobre uma coleção JÁ
// CARREGADA (não pagina, não busca no servidor a cada tecla) — fiel ao
// `select2` do legado.
//
// Quando usar: endpoint de listagem NÃO-PAGINADO (conjunto fechado,
// tipicamente pequeno/médio) → `SelectCombobox`. Endpoint PAGINADO (conjunto
// grande, cresce sem limite) → `SelectAsyncPaginate` (busca server-side).
// Regra de decisão consolidada em
// `[[98-chat/memory/patterns/component-selectcombobox-reutilizavel]]`,
// nascida da correção do ERRO-02 de Autorizadores (select de fazenda migrado
// de `SelectAsyncPaginate` para este padrão pelo mesmo motivo: a "busca" de
// um `SelectAsyncPaginate` contra endpoint não-paginado só filtraria a 1ª
// página já carregada, não o conjunto inteiro — enganoso para o usuário).
//
// Portado nesta rodada (TASK-DFE-FE-02, achado #1/#2) — generalização de
// `src/components/CountryCombobox/index.tsx` (322 linhas, já existente em
// `frontend_root`) num componente sem o acoplamento a país/bandeira/emoji:
// aqui o valor é um `Option<T>` genérico (label/value), não um código ISO.
// 1º consumidor: Select de Emissor (`issue_uuid`) de
// `CreateOrUpdateSincronizacaoDfe.tsx` — endpoint `GET
// /issue-dfe-sync-times/eligible-issuers` NÃO-paginado (DA-DFE-06).
//
// Esteira 061 (F-183 ponto 1): `Combobox.Input` tinha `height`/`minHeight`
// hardcoded em `32px`, destoando dos demais controles de formulário que
// aparecem ao lado (`SelectAsyncPaginate` — `minHeight: 38px` em
// `src/styles/components/SelectComponent.ts` — e `DateInput`, `height:
// 38px` em `src/components/DateInput/index.tsx`; `MoneyInput` herda a
// altura default do recipe `input` do Chakra, também 38px). Elevado para
// `38px` como NOVO DEFAULT (não uma prop) depois de checar os ~16
// callsites do componente: nenhum passa `size`/altura customizada, nenhum
// está em contexto de grade compacta que dependesse dos 32px (os 2 usos em
// editor de linhas — `TransferAbcAnimalsEditor.tsx`,
// `ApportionmentActivityEditor.tsx` — já renderizam com `label` acima,
// mesma altura de linha dos outros controles do formulário). `borderRadius`
// já era `md` (paridade já OK, não mexido).
//
// Correção de nova reprovação AD (revisor Arthur, F-183 — "Proprietário
// Gestor" com "estilo diferente dos demais" em `CreateSaldoInicial.tsx`,
// campo que usa este componente): a altura (38px) e a borda (`border2`) já
// batiam com os irmãos (`SelectAsyncPaginate`/`DateInput`/`Input`), mas o
// `background` do `Combobox.Input` era `transparent` — os 4 controles-irmãos
// (`src/styles/recipes/input.ts`, `src/styles/components/SelectComponent.ts`,
// `src/components/DateInput/index.tsx`) usam `bg="inputBG"` (caixa sólida
// branca/verde-escura conforme o tema). Alinhado ao mesmo token — nenhum dos
// ~16 callsites passa `background` customizado, logo o ajuste não regride
// nenhum consumidor existente, só corrige a divergência visual real.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Combobox, Portal, Skeleton, useFilter, useListCollection } from '@chakra-ui/react';

import type { Option } from '@/@types/option';

import { Field } from './Field';

interface SelectComboboxProps<T extends string | number = string> {
  /** Label do campo */
  label?: string;
  /** Value controlado — SEMPRE `Option<T> | null`, nunca `undefined`
   *  (armadilha #16 do checklist de telas — Select controlado por RHF). */
  value: Option<T> | null;
  /** Callback quando uma opção é selecionada (ou `null` ao limpar). */
  onChange: (option: Option<T> | null) => void;
  /** Coleção JÁ CARREGADA (1 fetch fora deste componente, ex.: `useQuery`
   *  direto sem paginação) — o filtro é 100% CLIENT-SIDE sobre este array. */
  options: Option<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  width?: string | number;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  tooltip?: string;
  noClearable?: boolean;
  loading?: boolean;
  /** Texto exibido quando o filtro não encontra nenhuma opção. */
  emptyLabel?: string;
}

export function SelectCombobox<T extends string | number = string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  name,
  id,
  disabled = false,
  size = 'sm',
  width = '100%',
  isRequired,
  error,
  helperText,
  tooltip,
  noClearable,
  loading = false,
  emptyLabel = 'Nenhum registro encontrado',
}: SelectComboboxProps<T>) {
  const { contains } = useFilter({ sensitivity: 'base' });

  // Estado local do input de busca (client-side, sobre `options` carregado).
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { collection, filter, set } = useListCollection<Option<T>>({
    initialItems: options,
    filter: contains,
    itemToString: (item: Option<T>) => item.label,
    itemToValue: (item: Option<T>) => String(item.value),
  });

  // `options` pode chegar DEPOIS do mount (1º fetch assíncrono do consumidor,
  // ex.: `useEligibleIssuersForSync`) — sem isso a coleção interna do
  // Combobox ficaria congelada vazia no `initialItems` do primeiro render.
  useEffect(() => {
    set(options);
  }, [options]);

  // Quando o valor externo muda (ex.: `fillForm` na edição), reflete o label
  // no input assim que o combobox está fechado.
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value?.label ?? '');
    }
  }, [value, isOpen]);

  function handleInputValueChange(details: { inputValue: string }) {
    setInputValue(details.inputValue);
    filter(details.inputValue);
  }

  function handleValueChange(details: { value: string[] }) {
    const selectedValue = details.value[0];
    if (selectedValue === undefined) {
      onChange(null);
      setInputValue('');
      return;
    }
    const selected = options.find((option) => String(option.value) === selectedValue) ?? null;
    onChange(selected);
    setInputValue(selected?.label ?? '');
  }

  function handleOpenChange(details: { open: boolean }) {
    setIsOpen(details.open);
    if (details.open) {
      // Ao abrir, reseta o filtro para mostrar todas as opções — o valor
      // selecionado continua visível no input até o usuário digitar.
      filter('');
    } else {
      setInputValue(value?.label ?? '');
    }
  }

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
      invalid={!!error}
    >
      <Skeleton loading={loading} borderRadius="md" width="full">
        {/* @ts-ignore - Chakra UI v3 types issue */}
        <Combobox.Root
          id={id}
          name={name}
          collection={collection}
          value={value ? [String(value.value)] : []}
          onValueChange={handleValueChange}
          onInputValueChange={handleInputValueChange}
          onOpenChange={handleOpenChange}
          open={isOpen}
          disabled={disabled}
          size={size}
          width={width}
          openOnClick
          inputValue={inputValue}
        >
          {/* @ts-ignore - Chakra UI v3 types issue */}
          <Combobox.Control
            position="relative"
            display="flex"
            alignItems="center"
            borderRadius="md"
            _hover={{
              '& [data-part="indicator"]': {
                color: 'semantic.neutral.900',
              },
            }}
          >
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.Input
              {...({ autoComplete: 'off', placeholder } as any)}
              display="flex"
              alignItems="center"
              width="full"
              minHeight="38px"
              height="38px"
              paddingX="3"
              paddingY="0"
              fontSize="sm"
              color="semantic.neutral.900"
              background="inputBG"
              border="1px solid"
              borderColor={error ? 'danger.default' : 'border2'}
              borderRadius="md"
              cursor="text"
              transition="all 0.2s"
              _placeholder={{ color: 'semantic.neutral.500' }}
              _hover={{
                borderColor: error ? 'danger.default' : 'border.muted',
              }}
              _focus={{
                borderColor: error ? 'danger.default' : 'primary.500',
                boxShadow: error
                  ? '0 0 0 1px var(--chakra-colors-danger-default)'
                  : '0 0 0 1px var(--chakra-colors-primary-500)',
                outline: 'none',
              }}
              _disabled={{
                opacity: 0.4,
                cursor: 'not-allowed',
                backgroundColor: 'semantic.neutral.200',
              }}
            />
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.IndicatorGroup
              position="absolute"
              right="0"
              top="0"
              bottom="0"
              display="flex"
              alignItems="center"
              gap="0"
              paddingRight="3"
              pointerEvents="none"
            >
              {!noClearable && !disabled && (
                <>
                  {/* @ts-ignore - Chakra UI v3 types issue */}
                  <Combobox.ClearTrigger
                    {...({ pointerEvents: 'auto' } as any)}
                    color="semantic.neutral.700"
                    cursor="pointer"
                    padding="1"
                    borderRadius="sm"
                    _hover={{
                      color: 'semantic.neutral.900',
                      backgroundColor: 'semantic.neutral.100',
                    }}
                  />
                  <span
                    style={{
                      height: '16px',
                      width: '1px',
                      backgroundColor: 'var(--chakra-colors-border-default)',
                      margin: '0 4px',
                    }}
                  />
                </>
              )}
              {/* @ts-ignore - Chakra UI v3 types issue */}
              <Combobox.Trigger
                {...({ pointerEvents: 'auto' } as any)}
                color="semantic.neutral.700"
                cursor="pointer"
                fontSize="sm"
              />
            </Combobox.IndicatorGroup>
          </Combobox.Control>

          <Portal>
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.Positioner zIndex={9999}>
              {/* @ts-ignore - Chakra UI v3 types issue */}
              <Combobox.Content
                background="semantic.neutral.200"
                borderRadius="md"
                boxShadow="lg"
                border="1px solid"
                borderColor="border2"
                padding="1"
                maxHeight="300px"
                overflowY="auto"
                marginTop="1"
              >
                <Combobox.Empty
                  display="flex"
                  alignItems="center"
                  paddingX="2"
                  paddingY="1.5"
                  fontSize="sm"
                  color="semantic.neutral.700"
                >
                  {emptyLabel}
                </Combobox.Empty>
                {collection.items.map((item: Option<T>) => {
                  const isSelected = value ? String(item.value) === String(value.value) : false;
                  return (
                    // @ts-ignore - Chakra UI v3 types issue
                    <Combobox.Item
                      key={String(item.value)}
                      item={item}
                      display="flex"
                      alignItems="center"
                      paddingX="2"
                      paddingY="1.5"
                      fontSize="sm"
                      color={isSelected ? 'white' : 'semantic.neutral.700'}
                      background={isSelected ? 'blue.900' : 'input.bG'}
                      fontWeight={isSelected ? 'medium' : 'normal'}
                      borderRadius="sm"
                      cursor="pointer"
                      marginBottom="0.5"
                      transition="all 0.2s"
                      _last={{
                        marginBottom: 0,
                      }}
                      _hover={{
                        backgroundColor: isSelected ? 'blue.900' : 'blue.700',
                        color: 'white',
                      }}
                      _highlighted={{
                        backgroundColor: isSelected ? 'blue.900' : 'blue.700',
                        color: 'white',
                      }}
                    >
                      {/* @ts-ignore - Chakra UI v3 types issue */}
                      <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    </Combobox.Item>
                  );
                })}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </Skeleton>
    </Field>
  );
}
