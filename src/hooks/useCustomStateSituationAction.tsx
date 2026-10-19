import { useState } from 'react';

import { TypesSituationAction } from '@/constants/options/types-situation-action';

import { ChangeStatusSituation } from '@/@types/change-status-situation';
import { ResponseSituation } from '@/@types/response-api';

interface UseCustomStateSituationActionProps {
  registrationId: string;
  secondId: string;
  queryKey: string;
  entityName: string;
  typesSituationAction: TypesSituationAction;
  closeWindow?: boolean;
  asyncFunction: ({
    registrationId,
    situation,
  }: ChangeStatusSituation) => Promise<ResponseSituation>;
}

export function useCustomStateSituationAction({
  entityName,
  queryKey,
  registrationId,
  asyncFunction,
}: Pick<
  UseCustomStateSituationActionProps,
  'entityName' | 'queryKey' | 'registrationId' | 'asyncFunction'
>) {
  const [stateSituationAction, setStateSituationAction] =
    useState<UseCustomStateSituationActionProps>({
      registrationId: registrationId,
      secondId: '',
      queryKey: queryKey,
      entityName: entityName,
      asyncFunction: asyncFunction,
      typesSituationAction: null!,
      closeWindow: false,
    });

  function situationAction({
    registrationId,
    secondId,
    queryKey,
    entityName,
    typesSituationAction,
    closeWindow: closeWindow,
  }: UseCustomStateSituationActionProps) {
    setStateSituationAction({
      registrationId: registrationId,
      secondId,
      queryKey,
      entityName,
      typesSituationAction,
      asyncFunction,
      closeWindow: closeWindow,
    });
  }

  return {
    stateSituationAction,
    situationAction,
  };
}
