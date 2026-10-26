// src/pages/CadastrosBase/Clientes/ClientFormModal.tsx
// -----------------------------------------------------------------------------
// TASK-MV-FE-11 — modal reutilizável de criação/edição de Cliente, sobre o
// shell genérico JÁ existente (`CustomDialog`, mirror de uso real em
// `CreateOrUpdateSolicitacao.tsx:928-1047`). Reusa 100% de TASK-MV-FE-10
// (`useClientFormController`/`ClientFormFields`) e o schema/service da
// página cheia (`CreateOrUpdateCliente.tsx`) — zero endpoint/schema novo.
//
// GATED-MOUNT (mirror EXATO do wrapper/body de `CreateOrUpdateCliente.tsx`,
// ver cabeçalho de `useClientFormController.ts`) — `useClientFormController`
// NUNCA pode montar antes do detalhe (`getClientByUuid`) estar resolvido em
// modo edição: seus `defaultValues` são computados SINCRONAMENTE só no
// PRIMEIRO mount do `useForm`/`useFieldArray` internos, sem `reset()`
// posterior. Por isso este arquivo é dividido em 2 componentes:
//   - `ClientFormModal` (exportado): sempre montado pelo caller (Movement),
//     só decide isLoading/Skeleton — NÃO chama `useClientFormController`.
//   - `ClientFormModalBody` (interno, `key={clientUuid ?? 'new'}`): só monta
//     QUANDO os dados já estão prontos (edição) ou imediatamente (criação) —
//     é aqui, e só aqui, que o controller é chamado.
// Sem essa divisão, o controller ficaria fixado no PRIMEIRO render do modal
// (quando o Movement monta, dado ainda não existe) e nunca refletiria o
// detalhe real ao reabrir para editar outro cliente — mesmo footgun que o
// projeto já documentou e evita em toda parte.
//
// Footer PRÓPRIO (`showFooter={false}` no `CustomDialog`, botões dentro de
// `ClientFormModalBody`) — não porque o padrão de footer mudou, mas porque o
// botão "Salvar" depende de `controller.handleSubmit`/`isSubmitting`, que só
// existe DENTRO do componente gateado. A barra final (borda superior +
// padding) reproduz EXATAMENTE a barra que `CustomDialog` desenharia por
// padrão (mesmos tokens), preservando fidelidade visual sem duplicar o
// componente genérico.
// -----------------------------------------------------------------------------

import { Box, Skeleton } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { ClientDetail } from '@/@types/v2/CadastrosBase/client';

import { ClientFormFields } from './ClientFormFields';
import { useClientForm } from './useClientes';
import { useClientFormController } from './useClientFormController';

export interface ClientFormModalSavedPayload {
  uuid: string;
  label: string;
}

export interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Cliente para EDITAR; `undefined`/vazio = modo CRIAR. */
  clientUuid?: string;
  /** Disparado após criar/editar com sucesso — o caller decide o que fazer
   *  (selecionar no Select, atualizar grid, etc.). O modal NUNCA
   *  navega/redireciona por conta própria — só fecha e devolve o dado. */
  onSaved: (client: ClientFormModalSavedPayload) => void;
  /** PED-FE-07 (`InlineClientModal`, ver comentário completo em
   *  `ClientFormFields.tsx`) — omite o Switch "Ativo*" (a fachada de
   *  criação inline força `is_enabled=true` server-side). Default
   *  omitido/`false` preserva 100% o comportamento atual dos demais
   *  callers deste modal genérico. */
  hideIsEnabled?: boolean;
}

// Densidade de colunas ADAPTADA ao modal (mais estreito que a página cheia,
// TASK-CL-FE-03) — `SimpleGrid columns` do Chakra é responsivo por
// BREAKPOINT DE VIEWPORT, não por largura de container; 4 colunas aqui
// ficariam espremidas mesmo em viewport `lg`. Mesma decisão registrada na
// ficha desta Tarefa.
// Densidade igual à página cheia: o modal de formulário passou a ser ~80vw
// (`size="form"`), então 2 colunas esticavam os campos — usa `columnsForm.default`
// (3-4 colunas responsivas). `roleFarmName`/`roleSwitches` mantêm sua densidade
// própria (campo full-width / 3 switches).
const MODAL_CLIENT_FORM_COLUMNS = {
  root: columnsForm.default,
  roleContact: columnsForm.default,
  roleFarmName: columnsForm.oneColumns,
  roleSwitches: columnsForm.threeColumns,
  roleCountry: columnsForm.twoColumns,
};

export function ClientFormModal({
  isOpen,
  onClose,
  clientUuid,
  onSaved,
  hideIsEnabled,
}: ClientFormModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.clients.client;

  const isEditing = isOpen && isValidGuid(clientUuid);

  // Query do detalhe só habilitada quando o modal está de fato ABERTO em
  // modo edição — evita disparar `GET /clients/{uuid}` a cada troca de
  // seleção no Select de Cliente do Movimento (o modal fica montado o tempo
  // todo pelo caller, só o Dialog interno abre/fecha).
  const clientQuery = useClientForm({ registrationId: isEditing ? clientUuid : undefined });
  const isLoading = isEditing && checkLoadingStatus([clientQuery as any]);

  const title = isValidGuid(clientUuid) ? text.form.title.edit : text.form.title.create;

  // Loading de EDIÇÃO: shell com Skeleton, SEM controller ainda (os
  // defaultValues do `useClientFormController` são síncronos no 1º mount —
  // gated). Footer só "Cancelar" (o "Salvar" depende do controller, que só
  // nasce com o dado pronto).
  if (isOpen && isLoading) {
    return (
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="form"
        footer={
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
          />
        }
      >
        <Box py={2}>
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="120px" borderRadius="md" />
        </Box>
      </CustomDialog>
    );
  }

  return (
    <ClientFormModalDialog
      key={clientUuid ?? 'new'}
      isOpen={isOpen}
      title={title}
      initialData={clientQuery.data as ClientDetail | undefined}
      isEditing={isValidGuid(clientUuid)}
      clientUuid={clientUuid}
      onClose={onClose}
      onSaved={onSaved}
      hideIsEnabled={hideIsEnabled}
    />
  );
}

interface ClientFormModalDialogProps {
  isOpen: boolean;
  title: string;
  initialData?: ClientDetail;
  isEditing: boolean;
  clientUuid?: string;
  onClose: () => void;
  onSaved: (client: ClientFormModalSavedPayload) => void;
  hideIsEnabled?: boolean;
}

// Componente com o controller (gated por `key`): renderiza o próprio
// CustomDialog para que o footer (Cancelar/Salvar, que dependem do controller)
// vá para o SLOT `footer` real do dialog — header/footer fixos, só o body rola,
// SEM footer-in-body sticky (que deixava faixa morta abaixo do footer).
function ClientFormModalDialog({
  isOpen,
  title,
  initialData,
  isEditing,
  clientUuid,
  onClose,
  onSaved,
  hideIsEnabled,
}: ClientFormModalDialogProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // MESMA regra de permissão da página cheia (`CreateOrUpdateCliente.tsx`) —
  // o modal NUNCA relaxa a autorização de Cliente por estar sendo aberto de
  // dentro do Movimento.
  const canSave = isEditing ? can('clients_edit') : can('clients_create');

  const controller = useClientFormController({
    initialData,
    isEditing,
    clientUuid,
    canSave,
    onPersisted: (data) => {
      onSaved({ uuid: data.uuid, label: data.name });
      onClose();
    },
  });

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="form"
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={controller.isSubmitting}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={controller.dirtyFields}
              type="button"
              onClick={controller.handleSubmit(controller.onSubmit)}
              languageGB={languageGB}
              loading={controller.isSubmitting}
              disabled={controller.isSubmitting}
            />
          )}
        </>
      }
    >
      {/* `disablePortal` — este componente SEMPRE monta dentro de
          `CustomDialog`/`Dialog.Root`; sem isso os selects de Cidade/País
          abririam com o menu portalizado em `document.body`, fora da árvore de
          Portal do Dialog (visíveis porém não-clicáveis). */}
      <Form noPadding onSubmit={controller.handleSubmit(controller.onSubmit)}>
        <ClientFormFields
          {...controller}
          canSave={canSave}
          columns={MODAL_CLIENT_FORM_COLUMNS}
          disablePortal
          hideIsEnabled={hideIsEnabled}
        />
      </Form>
    </CustomDialog>
  );
}
