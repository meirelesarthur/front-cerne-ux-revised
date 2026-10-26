// src/pages/CadastrosBase/Fornecedores/ProviderFormModal.tsx
// -----------------------------------------------------------------------------
// TASK-MV-FE-13 — modal reutilizável de criação/edição de Fornecedor, sobre o
// shell genérico JÁ existente (`CustomDialog`), mirror EXATO de
// `ClientFormModal.tsx` (TASK-MV-FE-11). Reusa 100% de TASK-MV-FE-12
// (`useProviderFormController`/`ProviderFormFields`) e o schema/service da
// página cheia (`CreateOrUpdateFornecedor.tsx`) — zero endpoint/schema novo.
//
// GATED-MOUNT (mirror EXATO do wrapper/body de `ClientFormModal.tsx`, ver
// cabeçalho de `useProviderFormController.ts`) — `useProviderFormController`
// NUNCA pode montar antes do detalhe (`getProviderByUuid`) estar resolvido em
// modo edição: seus `defaultValues` são computados SINCRONAMENTE só no
// PRIMEIRO mount do `useForm`/`useFieldArray` internos, sem `reset()`
// posterior. Por isso este arquivo é dividido em 2 componentes:
//   - `ProviderFormModal` (exportado): sempre montado pelo caller (Movement),
//     só decide isLoading/Skeleton — NÃO chama `useProviderFormController`.
//   - `ProviderFormModalBody` (interno, `key={providerUuid ?? 'new'}`): só
//     monta QUANDO os dados já estão prontos (edição) ou imediatamente
//     (criação) — é aqui, e só aqui, que o controller é chamado.
//
// Diferença real vs. `ClientFormModal` (única que importa nesta Tarefa):
// `ProviderFormFields` tem 4 abas (Dados/Conta/Filiais/Vendedores) — estado
// LOCAL de aba ativa (`useState(0)`), resetado a cada abertura via
// `key={providerUuid ?? 'new'}`, NÃO sincronizado com a URL do Movimento
// (Decisão técnica 3 de TASK-MV-FE-12).
//
// Footer no SLOT real do `CustomDialog` (mirror `ClientFormModal` pós-fix da
// faixa morta) — o botão "Salvar" depende de `controller.handleSubmit`/
// `isSubmitting`, que só existe DENTRO do componente gateado; por isso quem
// tem o controller (`ProviderFormModalBody`) é quem renderiza o próprio
// `CustomDialog` com `footer={...}` — header/footer fixos, só o body rola,
// SEM sticky/margem-negativa.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Skeleton } from '@chakra-ui/react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { ProviderDetail } from '@/@types/v2/CadastrosBase/provider';

import { ProviderFormFields } from './ProviderFormFields';
import { useProviderFormController } from './useProviderFormController';
import { useProviderForm } from './useProviders';

export interface ProviderFormModalSavedPayload {
  uuid: string;
  label: string;
  /** D5 (UT-000773): `false` = salvo inativo → caller NÃO deve auto-selecionar. */
  isEnabled?: boolean;
}

export interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Fornecedor para EDITAR; `undefined`/vazio = modo CRIAR. */
  providerUuid?: string;
  /** Disparado após criar/editar com sucesso — o caller decide o que fazer
   *  (selecionar no Select, atualizar grid, etc.). O modal NUNCA
   *  navega/redireciona por conta própria — só fecha e devolve o dado. */
  onSaved: (provider: ProviderFormModalSavedPayload) => void;
}

// Densidade de colunas ADAPTADA ao modal (mais estreito que a página cheia)
// — mesma técnica de `MODAL_CLIENT_FORM_COLUMNS` em `ClientFormModal.tsx`.
// Densidade igual à página cheia: o modal passou a ser ~80vw (`size="form"`),
// então 2 colunas esticavam os campos — usa `columnsForm.default` na aba Dados
// e `threeColumns` nas linhas de Filial/Vendedor (mesma densidade da página).
const MODAL_PROVIDER_FORM_COLUMNS = {
  root: columnsForm.default,
  branchRow: columnsForm.threeColumns,
  branchAddress: columnsForm.oneColumns,
  sellerRow: columnsForm.threeColumns,
};

export function ProviderFormModal({
  isOpen,
  onClose,
  providerUuid,
  onSaved,
}: ProviderFormModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.providers.provider;

  const isEditing = isOpen && isValidGuid(providerUuid);

  // Query do detalhe só habilitada quando o modal está de fato ABERTO em
  // modo edição — evita disparar `GET /providers/{uuid}` a cada troca de
  // seleção no Select de Fornecedor do Movimento (o modal fica montado o
  // tempo todo pelo caller, só o Dialog interno abre/fecha).
  const providerQuery = useProviderForm({ registrationId: isEditing ? providerUuid : undefined });
  // UT-000773 — gateia também por `isFetching`: o hook do detalhe usa
  // `networkMode: 'offlineFirst'` e o form só lê `initialData` no 1º mount
  // (gated-mount); com cache velho, `isLoading=false` durante o refetch pós-
  // invalidação e o form montaria stale (Ativo/centro de custo antigos).
  const isLoading =
    isEditing &&
    (checkLoadingStatus([providerQuery as any]) || !!(providerQuery as any).isFetching);

  const title = isValidGuid(providerUuid) ? text.form.title.edit : text.form.title.create;

  // UT-000765 (GAP-765-E-01) — UM único `CustomDialog` estável do abrir ao
  // fechar: skeleton e formulário trocam só o CONTEÚDO dentro dele. Trocar a
  // raiz (`Dialog.Root`) ao fim do loading desmontava o dialog A e montava o B,
  // e o `onOpenChange({open:false})` do desmonte fechava o modal.
  // O footer real (Salvar) depende do controller, que só existe no corpo
  // gateado; ele é portalizado para o slot `footer` deste mesmo dialog.
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="form"
      footer={
        <Box ref={setFooterEl} display="contents">
          {isLoading && (
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={onClose}
            />
          )}
        </Box>
      }
    >
      {isLoading ? (
        <Box py={2}>
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="40px" borderRadius="md" mb={4} />
          <Skeleton height="120px" borderRadius="md" />
        </Box>
      ) : (
        <ProviderFormModalBody
          key={providerUuid ?? 'new'}
          footerEl={footerEl}
          initialData={providerQuery.data as ProviderDetail | undefined}
          isEditing={isValidGuid(providerUuid)}
          providerUuid={providerUuid}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </CustomDialog>
  );
}

interface ProviderFormModalBodyProps {
  footerEl: HTMLElement | null;
  initialData?: ProviderDetail;
  isEditing: boolean;
  providerUuid?: string;
  onClose: () => void;
  onSaved: (provider: ProviderFormModalSavedPayload) => void;
}

// Corpo gateado por `key` (controller só nasce com o dado pronto). Não renderiza
// dialog: o footer (Cancelar/Salvar) vai por portal ao slot `footer` do dialog
// único do pai — header/footer fixos, só o body rola.
function ProviderFormModalBody({
  footerEl,
  initialData,
  isEditing,
  providerUuid,
  onClose,
  onSaved,
}: ProviderFormModalBodyProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // Aba ativa — estado LOCAL (Decisão técnica 3 de TASK-MV-FE-12), resetada
  // a cada abertura via `key={providerUuid ?? 'new'}`.
  const [tabIndex, setTabIndex] = useState(0);

  // MESMA regra de permissão da página cheia.
  const canSave = isEditing ? can('providers_edit') : can('providers_create');

  const controller = useProviderFormController({
    initialData,
    isEditing,
    providerUuid,
    canSave,
    onPersisted: (data) => {
      onSaved({ uuid: data.uuid, label: data.name, isEnabled: data.is_enabled });
      onClose();
    },
  });

  const footer = (
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
  );

  return (
    <>
      {footerEl ? createPortal(footer, footerEl) : null}
      <Form noPadding onSubmit={controller.handleSubmit(controller.onSubmit)}>
        <ProviderFormFields
          {...controller}
          canSave={canSave}
          tabIndex={tabIndex}
          onTabsChange={setTabIndex}
          columns={MODAL_PROVIDER_FORM_COLUMNS}
          // TASK-FE-036fix4 (item 1, BLOQUEADOR) — dentro do Dialog, o menu
          // portalizado em `document.body` fica `aria-hidden`/`inert`; ver
          // `disablePortal` em `ProviderFormFieldsProps`.
          disablePortal
        />
      </Form>
    </>
  );
}
