export interface RouteConfig {
  id?: string;
  idModule?: string;
  element: React.FC<any>;
  name?: string;
  isPrivate?: boolean;
  isIndex?: boolean;
  useSuspenseLoader?: boolean;
  path?: string;
  childrens?: Omit<RouteConfig, "isPrivate">[];
}

export interface RouteConfigPrivate {
  id: string;
  idModule: string;
  name: string;
  element: React.FC<any>;
  path: string;
  idMenu?: string;
}
