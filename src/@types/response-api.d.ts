const entity = {
  companies: 'companies',
  grains: 'grains',
  totals: 'totals',
}

export type EntityTypes = keyof typeof entity;


export interface ResponsePagination<I = any> {
  success: boolean;
  data: {
    items: I;
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
  statusCode?: number;
  message?: string;
}

export interface Response<I = any> {
  data: I;
  notifications: [];
  success: boolean;
  statusCode: number;
  message?: string;
}

export interface ResponsePhone {
  data: BlobPart;
  notifications: [];
  success: boolean;
}

export type EntityDataMap<T = any> = {
  [K in EntityTypes]: T[];
};

export type ResponseEntity<E extends EntityTypes, T = any> = {
  success: boolean;
} & {
  [K in E]: EntityDataMap<T>[K];
};

export interface ResponseSituation {
  data: ChangeStatusSituationData;
  notifications: [];
  success: boolean;
}
