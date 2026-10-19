import { TypesSituationAction } from '@/constants/options/types-situation-action';
import { situation } from '@/constants/situation';



export function useCustomSituationActionModal(entityName?: string) {
  const mensegeSituationAction: { [key: string]: any } = {
    activeForm: {
      toast: `<strong>${entityName}</strong> ativado(a) com sucesso!`,
      header: `Tem certeza que deseja ativar esse(a) ${
        entityName && entityName.toLowerCase()
      }?`,
      body: `Ao mudar a situação para ativo esse registro poderá ser utilizado
      em outras telas. Caso não queira mudar a situação do registro basta
      apenas cancelar.`,
    },
    activeFormCreate: {
      toast: `<strong>${entityName}</strong> ativado(a) com sucesso!`,
      header: `Tem certeza que deseja ativar esse(a) ${
        entityName && entityName.toLowerCase()
      }?`,
      body: `Ao mudar a situação para ativo esse registro poderá ser utilizado
      em outras telas. Caso não queira mudar a situação do registro basta
      apenas cancelar.`,
    },
    activeGrid: {
      toast: `<strong>${entityName}</strong> ativado(a) com sucesso!`,
      header: `Tem certeza que deseja ativar esse(a) ${
        entityName && entityName.toLowerCase()
      }?`,
      body: `Ao mudar a situação para ativo esse registro poderá ser utilizado
      em outras telas. Caso não queira mudar a situação do registro basta
      apenas cancelar.`,
    },
    inactivateGrid: {
      toast: `<strong>${entityName}</strong> inativado(a) com sucesso!`,
      header: `Tem certeza que deseja inativar esse(a) ${
        entityName && entityName.toLowerCase()
      }?`,
      body: 'Ao mudar a situação para inativo esse registro não poderá ser utilizado em telas dependente dele. Caso não queira inativar o registro basta apenas cancelar.',
    },
    inactivateForm: {
      toast: `<strong>${entityName}</strong> inativado(a) com sucesso!`,
      header: `Tem certeza que deseja inativar esse(a) ${
        entityName && entityName.toLowerCase()
      }?`,
      body: 'Ao mudar a situação para inativo esse registro não poderá ser utilizado em telas dependente dele. Caso não queira inativar o registro basta apenas cancelar.',
    },
    editingForm: {
      toast: `<strong>${entityName}</strong> em modo edição!`,
      header: `Tem certeza que deseja alterar a situação desse(a) ${
        entityName && entityName.toLowerCase()
      }
      para editando?`,
      body: 'Ao mudar a situação para editando esse registro não poderá ser utilizado em telas dependente dele. Caso não queira mudar a situação do registro basta apenas cancelar.',
    },
  };

  function getSituationAction(situations: TypesSituationAction) {
    switch (situations) {
      case 'activeForm':
        return situation.Active;
      case 'activeFormCreate':
        return situation.Active;
      case 'activeGrid':
        return situation.Active;
      case 'inactivateForm':
        return situation.Inactive;
      case 'inactivateGrid':
        return situation.Inactive;
      case 'editingForm':
        return situation.Editing;
    }
  }

  return { mensegeSituationAction, getSituationAction };
}
