// src/pages/CadastrosBase/Pessoas/steps/StepUsuario.tsx
// -----------------------------------------------------------------------------
// Etapa de papel "Usuário" do wizard de Pessoa (TASK-FE-305) — última etapa,
// fecha o formulário. Sem achado bloqueante de Resource
// (`UserRoleResource` já bate com o contrato).
//
// Senha — Achado D (dev, execução 023): na EDIÇÃO a Pessoa/Usuário pode ser
// editado normalmente, mas a TROCA de senha não é feita por aqui — os campos
// "Senha"/"Confirmação de Senha" são OMITIDOS inteiros quando `isEditing`
// (não apenas desabilitados/opcionais), com um aviso no lugar. Na CRIAÇÃO
// eles permanecem — é onde a senha inicial é definida
// (`required_if:user.is_active,true` no backend, `PersonRequest::rules()`).
// Validação condicional (obrigatoriedade) aplicada em
// `CreateOrUpdatePessoa.tsx` (`handleNext`, depende de `isEditing`, fora do
// schema Yup estático); o schema Yup (`pessoa-schema.ts`) também recebe
// `isEditing` para desligar a validação de confirmação-bate-com-senha nesse
// modo. Confirmação é client-side, NUNCA enviada ao backend
// (`UserRolePayload` não tem esse campo) — `buildPayload()` também nunca
// envia `password` no PUT de edição.
//
// Multi-seleção (farm_uuids/role_uuids/boss_uuids): `CheckboxListField`
// (catálogo já usado para "Fazendas Vinculadas" em Emissores NFe) — decisão
// de composição por 2 motivos: (1) `services/v2/Farms/farm-service.ts` só
// expõe `listFarms()` SEM paginação/busca real (não compatível com
// `SelectAsyncPaginate`, que exige um `service` paginado); (2) mesmo Roles/
// Users tendo serviço paginado, o valor do form é `string[]` de uuids CRUS
// (sem rótulo) — `SelectAsyncPaginate isMulti` exigiria manter um registro
// paralelo uuid→label só para re-exibir a seleção, complexidade
// desproporcional ao ganho; `CheckboxListField` já resolve isso operando
// direto sobre `items`/`selectedValues: string[]`, com busca SERVER-SIDE
// (debounce local) para Perfis/Encarregados.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';

import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listFarms } from '@/services/v2/Farms/farm-service';
import { listRoles } from '@/services/v2/Roles/role-service';
import { listUserBossOptions } from '@/services/v2/Users/user-service';

import { StepHeading, type StepProps } from './parts';

import { StepBody } from '@/components/ui/StepBody';
interface Props extends StepProps {
  isEditing: boolean;
}

export function StepUsuario({ control, register, errors, disabled, isEditing }: Props) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;
  const u = text.form.user;

  const [farmSearch, setFarmSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [bossSearch, setBossSearch] = useState('');

  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ['people-farms-options'],
    queryFn: listFarms,
  });
  const farmItems = (farms ?? [])
    .filter((f) => f.description.toLowerCase().includes(farmSearch.toLowerCase()))
    .map((f) => ({ value: f.uuid, label: f.description }));

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['people-role-options', roleSearch],
    queryFn: () => listRoles({ page: 1, per_page: 50, search: roleSearch || undefined }),
  });
  const roleItems = (rolesData?.data.items ?? []).map((r) => ({ value: r.uuid, label: r.name }));

  // TASK-FE-918 (fechamento do laço, defeito nº1 do 2º E2E do dev) — mesmo
  // defeito de `CreateOrUpdateUsuario.tsx`: `listUserOptions` (`GET /users`
  // administrativo) oferecia 17 candidatos sem aplicar a regra de
  // elegibilidade de encarregado (farm do tenant E autorizador de
  // requisição), que só existia na VALIDAÇÃO de escrita — a API rejeitava 14
  // deles com 422. Fonte trocada para `listUserBossOptions` (`GET
  // /users/boss-options`, TASK-BE-910), que já filtra no backend. O endpoint
  // não pagina nem aceita `search` — busca client-side (mesmo padrão de
  // `farmItems` acima). Rótulo SÓ o nome (mirror do legado; o endpoint novo
  // nem devolve e-mail). Sem `exclude_uuid`: este wizard não tem acesso
  // direto ao uuid do próprio `User` sendo editado sem plumbing adicional
  // (fora do escopo cirúrgico desta correção — ver resumo da entrega).
  const { data: bossOptions, isLoading: usersLoading } = useQuery({
    queryKey: ['people-user-options'],
    queryFn: () => listUserBossOptions(),
    retry: false,
  });
  const bossItems = (bossOptions ?? [])
    .filter((us) => us.name.toLowerCase().includes(bossSearch.toLowerCase()))
    .map((us) => ({
      value: us.uuid,
      label: us.name,
    }));

  return (
    <StepBody>
      <StepHeading title={text.roles.user} subtitle={u.subtitle} />

      {isEditing ? (
        <Box fontSize="sm" color="fg.muted" bg="bg.subtle" borderRadius="md" px={4} py={3} mb={4}>
          {u.editPasswordNotice}
        </Box>
      ) : (
        <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
          <Input
            label={u.password}
            type="password"
            autoComplete="new-password"
            {...register('user.password')}
            error={errors.user?.password?.message}
            helperText={u.passwordHint}
            disabled={disabled}
          />
          <Input
            label={u.passwordConfirmation}
            type="password"
            autoComplete="new-password"
            {...register('user.password_confirmation')}
            error={errors.user?.password_confirmation?.message}
            disabled={disabled}
          />
        </SimpleGrid>
      )}

      <Controller
        name="user.is_purchasing_assistant"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Box
            display="flex"
            alignItems="center"
            gap={3}
            px={4}
            py={3}
            borderRadius="md"
            border="1px solid"
            borderColor="border.subtle"
            bg="bg.subtle"
            mb={4}
          >
            <Switch
              checked={!!value}
              onCheckedChange={(d: { checked: boolean }) => onChange(d.checked)}
              disabled={disabled}
            >
              {u.purchasingAssistant}
            </Switch>
          </Box>
        )}
      />

      <Box mb={4}>
        <Controller
          name="user.role_uuids"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CheckboxListField
              label={u.roles}
              items={roleItems}
              selectedValues={value}
              onChange={onChange}
              searchValue={roleSearch}
              onSearchChange={setRoleSearch}
              searchPlaceholder={u.rolesSearchPlaceholder}
              selectedCountLabel={u.selectedCount}
              isLoading={rolesLoading}
              isDisabled={disabled}
            />
          )}
        />
      </Box>

      <Box mb={4}>
        <Controller
          name="user.farm_uuids"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CheckboxListField
              label={u.farms}
              items={farmItems}
              selectedValues={value}
              onChange={onChange}
              searchValue={farmSearch}
              onSearchChange={setFarmSearch}
              searchPlaceholder={u.farmsSearchPlaceholder}
              selectedCountLabel={u.selectedCount}
              isLoading={farmsLoading}
              isDisabled={disabled}
            />
          )}
        />
      </Box>

      <Box>
        <Controller
          name="user.boss_uuids"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CheckboxListField
              label={u.bosses}
              items={bossItems}
              selectedValues={value}
              onChange={onChange}
              searchValue={bossSearch}
              onSearchChange={setBossSearch}
              searchPlaceholder={u.bossesSearchPlaceholder}
              selectedCountLabel={u.selectedCount}
              isLoading={usersLoading}
              isDisabled={disabled}
            />
          )}
        />
      </Box>
    </StepBody>
  );
}
