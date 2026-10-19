// src/pages/CadastrosBase/Usuarios/UserViewDialog.tsx
// -----------------------------------------------------------------------------
// Modal READ-ONLY "Visualizar" — F-206 (PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR,
// 97-Esteiras/047-usuarios-admin). Ação nova, sem tela de "show" dedicada até
// agora nesta feature (o comentário de cabeçalho de `index.tsx` documentava
// essa lacuna).
//
// Reusa `GET /api/v1/users/{uuid}` (`getUser`, JÁ existente, JÁ testado) via
// o MESMO hook `useUserForm` (`useUsuario.tsx`) que `CreateOrUpdateUsuario.tsx`
// usa para o formulário de edição — mesma queryKey (`queryKey.users.user`),
// mesmo cache, ZERO endpoint/hook novo. `fillForm` recebe um no-op: esta tela
// NÃO tem `useForm`/RHF nenhum, só lê `userQuery.data` direto (mirror EXATO
// de `DetalheCentroCusto.tsx::noop`/`InfoField`) — sem inputs editáveis, sem
// submit, mesmo padrão "Modal ou tela read-only" do §3.1 do plano.
//
// Composição V3 (get_pwa_ui_components_pattern §44.4 — `DisplayField`/
// `DisplayFieldGroup` são V2-only; V3 substitui por `Text`/`Badge` inline
// compostos manualmente, sem wrapper dedicado): `Dialog.Root` headless
// (mirror `DeleteConfirmDialog.tsx`) + sub-componente local `InfoField`
// (label + valor, mirror `DetalheCentroCusto.tsx`).
//
// SEM MOCK (dado ausente = lacuna declarada, não inventado): o plano cita
// campos do `show.blade.php` legado — "datas de aceite/verificação" — que o
// contrato REAL desta feature (`UserDetail`, `@types/v2/Users`) NÃO expõe
// (`UserDetailResource` não devolve `email_verified_at`/aceite de termos para
// este Resource administrativo). Omitidos aqui por ausência real de dado na
// API consumida por esta tela — não é um esquecimento, é o limite honesto do
// contrato hoje (divergência já registrada no cabeçalho do plano, "Nota de
// LACUNA"). Todos os DEMAIS campos do `show` legado que o contrato realmente
// devolve (pessoa, cidade, farms, roles, bosses, conta) estão presentes.
// -----------------------------------------------------------------------------

import {
  Avatar,
  Badge,
  Box,
  Dialog,
  Flex,
  Icon,
  Portal,
  Skeleton,
  Text,
  Wrap,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type { UserDetail } from '@/@types/v2/Users';

import { useUserForm } from './useUsuario';

// `fillForm` do hook compartilhado (`(data, resetForce?) => void`) nunca é
// lido aqui — mirror EXATO de `DetalheCentroCusto.tsx::noop` (uma função com
// menos parâmetros que o tipo declarado é estruturalmente válida em TS).
function noop() {}

// Campo de leitura (label + valor) — mirror `InfoField` de
// `DetalheCentroCusto.tsx`, reaproveitado aqui em vez de criar um componente
// novo (V3 não tem `DisplayField`, ver nota de cabeçalho).
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default" wordBreak="break-word">
        {value}
      </Text>
    </Box>
  );
}

export interface UserViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `null` enquanto nenhuma linha foi escolhida — a query fica `disabled`
   *  (mirror `isEditing ? userId : undefined` de `CreateOrUpdateUsuario.tsx`). */
  uuid: string | null;
  languageGB: LanguageDate;
}

export function UserViewDialog({ isOpen, onClose, uuid, languageGB }: UserViewDialogProps) {
  const text = languageGB.users.user.viewDialog;

  // Mesmo hook/queryKey do formulário de edição — cache compartilhado, zero
  // endpoint novo. Só busca quando o diálogo está de fato aberto E há um
  // uuid válido (evita refetch/estado residual com o diálogo fechado).
  const userQuery = useUserForm({
    registrationId: isOpen && uuid ? uuid : undefined,
    fillForm: noop,
  });

  const isLoading = checkLoadingStatus([userQuery as any]);
  const data = userQuery.data as UserDetail | undefined;
  const hasError = !!(userQuery as any)?.isError;

  const person = data?.person;
  const cityLabel = person?.city
    ? `${person.city.name}${person.city.state ? ` — ${person.city.state.uf}` : ''}`
    : text.noValue;

  const lastActivityLabel = data?.last_activity
    ? formatDate(data.last_activity, 'dd/MM/yyyy HH:mm')
    : text.noValue;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              <Flex align="center" gap={3}>
                <Avatar.Root size="md">
                  <Avatar.Fallback name={data?.name} />
                  {data?.photo_url && <Avatar.Image src={data.photo_url} />}
                </Avatar.Root>
                <Box>
                  {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
                  <Dialog.Title>{data?.name ?? text.title}</Dialog.Title>
                  {data && (
                    <Badge colorPalette={data.is_active ? 'green' : 'gray'} variant="subtle" mt={1}>
                      {data.is_active
                        ? languageGB.users.user.list.table.statusActive
                        : languageGB.users.user.list.table.statusInactive}
                    </Badge>
                  )}
                </Box>
              </Flex>
            </Dialog.Header>

            <Dialog.Body>
              {isLoading ? (
                <Box>
                  <Skeleton height="20px" mb={3} />
                  <Skeleton height="20px" mb={3} />
                  <Skeleton height="20px" mb={3} />
                  <Skeleton height="20px" />
                </Box>
              ) : hasError || !data ? (
                <Flex direction="column" align="center" gap={2} py={6}>
                  <Icon as={FiAlertTriangle} boxSize={6} color="red.400" />
                  <Text color="fg.muted">{text.loadError}</Text>
                </Flex>
              ) : (
                <Flex direction="column" gap={6}>
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={3}>
                      {text.sectionPerson}
                    </Text>
                    <Flex direction="column" gap={3}>
                      <Flex gap={4} wrap="wrap">
                        <Box flex="1" minW="140px">
                          <InfoField label={text.fields.nif} value={person?.nif ?? text.noValue} />
                        </Box>
                        <Box flex="1" minW="140px">
                          <InfoField
                            label={text.fields.name}
                            value={person?.name ?? data.name ?? text.noValue}
                          />
                        </Box>
                        {person?.nickname && (
                          <Box flex="1" minW="140px">
                            <InfoField label={text.fields.nickname} value={person.nickname} />
                          </Box>
                        )}
                      </Flex>
                      <Flex gap={4} wrap="wrap">
                        <Box flex="1" minW="140px">
                          <InfoField
                            label={text.fields.contactEmail}
                            value={person?.email ?? text.noValue}
                          />
                        </Box>
                        <Box flex="1" minW="140px">
                          <InfoField
                            label={text.fields.phone}
                            value={person?.phone ?? text.noValue}
                          />
                        </Box>
                      </Flex>
                      <Flex gap={4} wrap="wrap">
                        <Box flex="1" minW="140px">
                          <InfoField
                            label={text.fields.address}
                            value={person?.address ?? text.noValue}
                          />
                        </Box>
                        <Box flex="1" minW="140px">
                          <InfoField label={text.fields.city} value={cityLabel} />
                        </Box>
                      </Flex>
                    </Flex>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={3}>
                      {text.sectionAccount}
                    </Text>
                    <Flex direction="column" gap={3}>
                      <Flex gap={4} wrap="wrap">
                        <Box flex="1" minW="140px">
                          <InfoField label={text.fields.loginEmail} value={data.email} />
                        </Box>
                        <Box flex="1" minW="140px">
                          <InfoField label={text.fields.lastActivity} value={lastActivityLabel} />
                        </Box>
                      </Flex>
                      <InfoField
                        label={text.fields.isPurchasingAssistant}
                        value={
                          data.is_purchasing_assistant
                            ? languageGB.defaltStrings.yes
                            : languageGB.defaltStrings.no
                        }
                      />
                    </Flex>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={3}>
                      {text.sectionLinks}
                    </Text>
                    <Flex direction="column" gap={4}>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" mb={2}>
                          {text.fields.roles}
                        </Text>
                        {data.roles.length === 0 ? (
                          <Text fontSize="sm" color="fg.muted">
                            {text.noRoles}
                          </Text>
                        ) : (
                          <Wrap gap={2}>
                            {data.roles.map((role) => (
                              <Badge key={role.uuid} colorPalette="blue" variant="subtle">
                                {role.name}
                              </Badge>
                            ))}
                          </Wrap>
                        )}
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" mb={2}>
                          {text.fields.farms}
                        </Text>
                        {data.farms.length === 0 ? (
                          <Text fontSize="sm" color="fg.muted">
                            {text.noFarms}
                          </Text>
                        ) : (
                          <Wrap gap={2}>
                            {data.farms.map((farm) => (
                              <Badge key={farm.uuid} colorPalette="gray" variant="subtle">
                                {farm.description}
                              </Badge>
                            ))}
                          </Wrap>
                        )}
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" mb={2}>
                          {text.fields.bosses}
                        </Text>
                        {data.bosses.length === 0 ? (
                          <Text fontSize="sm" color="fg.muted">
                            {text.noBosses}
                          </Text>
                        ) : (
                          <Wrap gap={2}>
                            {data.bosses.map((boss) => (
                              <Badge key={boss.uuid} colorPalette="gray" variant="subtle">
                                {boss.name}
                              </Badge>
                            ))}
                          </Wrap>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                </Flex>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button title={text.close} variant="outline" onClick={onClose} />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
