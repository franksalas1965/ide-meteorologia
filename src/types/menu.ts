interface BaseAction {
  action: string; 
  payload?: any;
}



export interface MenuAction extends BaseAction {
  name: string;
  layerId?: string;
  imageId?: string;
  layerConfig?: {
    layerId: string;
    url: string;
    layers: string;
    version?: string;
    format?: string;
    transparent?: boolean;
    opacity?: number;
    uppercase?: boolean;
    zIndex?: number;
    zoommin?: number;
    zoommax?: number;
    extent?: [number, number, number, number];
    bounds?: L.LatLngBoundsExpression;
  };
  chartType?: string;
  format?: string;
}

export interface SubSubMenuItem {
  name: string;
  actions: MenuAction[];
}

export interface SubMenuItem {
  name: string;
  subSubMenu?: SubSubMenuItem[];
  actions?: MenuAction[];
}

export interface MenuItem {
  name: string;
  route?: string;
  subMenus?: SubMenuItem[];
}

export interface MenuGroup {
  title: string;
  menus: MenuItem[];
}
