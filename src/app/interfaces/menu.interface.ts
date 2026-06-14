export interface MenuItem {
  title: string;
  icon: string;
  url: string;
  submenu?: SubMenuItem[];
}

export interface SubMenuItem {
  title: string;
  url: string;
}

export interface MenuResponse {
  menu: MenuItem[];
}
