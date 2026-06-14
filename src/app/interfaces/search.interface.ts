import { InventoryItem, Product, Supplier, User, Company } from './models.interface';

export interface Busqueda {
  ok: boolean;
  busqueda: string;
  users?: User[];
  companies?: Company[];
  products?: Product[];
  suppliers?: Supplier[];
  items?: InventoryItem[];
}
