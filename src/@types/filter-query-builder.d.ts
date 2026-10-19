type Filters =
  | 'eq'
  | 'eqId'
  | 'neq'
  | 'lt'
  | 'gt'
  | 'lte'
  | 'gte'
  | 'contains'
  | 'ncontains'
  | 'startsWith'
  | 'nstartsWith'
  | 'endsWith'
  | 'nendsWith';

export type FilterQuery = {
  name: string;
  op: Filters;
  value: any;
};

export type MultiFilterQuery = Array<FilterQuery | MultiFilterQuery>;
