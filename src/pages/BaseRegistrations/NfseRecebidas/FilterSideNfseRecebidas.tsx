// src/pages/BaseRegistrations/NfseRecebidas/FilterSideNfseRecebidas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da Listagem de NFSe Recebidas (Nfse, domínio Fiscal,
// execução 033, TASK-FE-2731). Depende de `TASK-FE-2730` (tipos/service/
// i18n). Único filtro do projeto que combina combobox de FK OBRIGATÓRIO
// (Emissor) + busca + intervalo de datas + select booleano — 3 precedentes
// internos combinados, nenhum sozinho cobre o conjunto:
//   - Combobox Emissor: mirror EXATO do bloco `cidade_uuid` de
//     `CadastrosBase/Emissores/CreateOrUpdateEmissor.tsx` (~590-613) —
//     `SelectAsyncPaginate` sobre `listIssuers` (endpoint PAGINADO real, NÃO
//     o `eligible-issuers` não-paginado de `IssueDfeSyncTimes` — esse
//     endpoint dedicado não existe para este módulo, DA-DFE-06 não se
//     aplica aqui).
//   - Par `date_from`/`date_to`: mirror `FilterSideParameterWeights.tsx`
//     (par `DateInput`+`Field`, aviso não-bloqueante de intervalo invertido).
//   - Casca/`Lançada`: mirror `FilterSideEmissores.tsx` (Select estático
//     Todos/Sim/Não via `placeholder`).
//
// Campo Emissor é OBRIGATÓRIO por UX (spec visual §4: "Selecione o
// Emissor* (obrigatório p/ listar)"; contrato RN-1 confirma: `issuer_uuid`
// ausente ⇒ o índice devolve lista vazia, não erro). O componente NÃO
// impede submeter sem Emissor (RN-1 não é validação client-side bloqueante)
// — só sinaliza obrigatoriedade visualmente (label com `*`/helperText); a
// Listagem (`TASK-FE-2732`) trata a ausência com `enabled: false` na query +
// empty-state dedicado.
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B, `FilterModalProps<T>`) +
// `useEffect` com deps `[isOpen]` (nunca `[filter]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { getIssuerByUuid, listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { NfseFilterForm } from '@/@types/v2/BaseRegistrations/nfse';
import type { IssuerListItem } from '@/@types/v2/Issuers';

// Forma INTERNA do form (só deste componente) — `issuer_uuid`/`launched`
// guardam o `Option` inteiro (label + value), mesmo padrão de `cidade_uuid`
// em Emissores; datas nullable para o `DateInput` controlado. O submit
// extrai `.value` e converte `null`/'' para `undefined` no shape externo
// `NfseFilterForm`.
interface FilterFormValues {
  issuer_uuid: Option<string> | null;
  search?: string;
  date_from: string | null;
  date_to: string | null;
  launched: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  issuer_uuid: null,
  search: '',
  date_from: null,
  date_to: null,
  launched: null,
};

export function FilterSideNfseRecebidas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<NfseFilterForm>) {
  const text = languageGB.baseRegistrations.nfse.filter;

  const launchedOptions: Option<string>[] = [
    { value: 'true', label: text.launchedOptions.yes },
    { value: 'false', label: text.launchedOptions.no },
  ];

  // Combobox de Emissor guarda só `value` no filtro externo (`issuer_uuid:
  // string`). Ao reabrir, o rótulo é resolvido por `getIssuerByUuid` (efeito
  // abaixo, UT-000754/FE-02) — até lá (ou se a chamada falhar) o fallback é o
  // uuid truncado, nunca o uuid cru nem um nome inventado.
  function toInternalValues(rawFilter?: NfseFilterForm | null): FilterFormValues {
    return {
      issuer_uuid: rawFilter?.issuer_uuid
        ? { label: rawFilter.issuer_uuid.slice(0, 8), value: rawFilter.issuer_uuid }
        : null,
      search: rawFilter?.search ?? '',
      date_from: rawFilter?.date_from ?? null,
      date_to: rawFilter?.date_to ?? null,
      launched: launchedOptions.find((option) => option.value === rawFilter?.launched) ?? null,
    };
  }

  const { control, register, handleSubmit, reset, setValue, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const dateFrom = watch('date_from');
  const dateTo = watch('date_to');
  // Validação client-side NÃO bloqueante (mirror ParameterWeights) —
  // comparação lexicográfica válida para strings ISO `yyyy-MM-dd`.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      issuer_uuid: data.issuer_uuid?.value || undefined,
      search: data.search?.trim() || undefined,
      launched: (data.launched?.value as NfseFilterForm['launched']) || undefined,
      date_from: data.date_from || undefined,
      date_to: data.date_to || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (checklist já documentado nos
  // siblings, nunca `[filter]`).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });

    // Resolve o rótulo (razão social) do Emissor já filtrado — sem alterar o
    // contrato B (`[isOpen]`) nem marcar o campo como sujo.
    const issuerUuid = filter?.issuer_uuid;
    if (!isOpen || !issuerUuid) return;
    let cancelled = false;
    getIssuerByUuid(issuerUuid)
      .then((response) => {
        if (cancelled) return;
        setValue('issuer_uuid', { label: response.data.razao_social, value: issuerUuid });
      })
      .catch(() => {
        // Mantém o fallback truncado (SEM MOCK).
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="issuer_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={`${text.issuer} *`}
                helperText={text.issuerRequired}
                placeholder={text.issuerPlaceholder}
                service={listIssuers}
                mapOptions={(item: IssuerListItem) => ({
                  label: item.razao_social,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateTo}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {text.dateRangeInvalid}
            </Text>
          )}

          <Controller
            name="launched"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.launched}
                placeholder={text.launchedAll}
                name={name}
                value={value}
                onChange={onChange}
                options={launchedOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
