// Interfaces for Angular based on Mongoose models

import { Provider } from "@angular/core";

// User Interface
export interface User {
  uid?: string;
  _id?: string;
  companyId?: string;
  email: string;
  username: string;
  password: string;
  name?: string;
  role: 'admin' | 'user' | 'sysadmin';
  lastLogin?: Date;
  img?: string;
}

export interface PaymentBreakdown {
  cash: number;
  credit: number;
  debit: number;
}

export interface CashRegister {
  _id: string;
  user: string | User;
  startDate: Date;
  endDate: Date;
  initialAmount: number;
  finalAmount: number;
  payments: PaymentBreakdown;
  sales: string[];
  notes: string;
  closed: boolean;
}

export interface Company {
  _id?: string;
  name: string;
  adminId: string;
  img: string;
  description: string;
  address: string;
  tel: string;
  email: string;
  createdAt: Date;
  SuscriptionsHistory: Suscription[];
}

export interface Suscription {
  month: string;
  cutOffDate: Date;
  state: 'Activo' | 'Inactivo' | 'Pendiente';
  amountPaid: number;
  Paymethod: string;
  payReference: string;
}

export interface Category {
  _id?: string;
  companyId?: string;
  name?: string;
  description?: string;
  createdAt?: Date;
}

export interface Lote {
  receivedDate: Date;
  expirationDate: Date;
  proveedor: string;
  supplier: string;
}

export interface Supplier {
  _id: string;
  name: string;
  description: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  company: string;
}

export interface Product {
  _id?: string;
  company?: string;
  categories?: Category[];
  supplier: Supplier;
  img?: string;
  name?: string;
  description?: string;
  brand?: string;
  isComposite: boolean;
  recipe?: string;
}

export interface InventoryItem {
  _id?: string;
  name: string;
  company: string;
  supplier: string | Supplier;
  stock: number;
  costPrice: number;
  sellingPrice?: number;
  measurement: 'unit' | 'g' | 'ml' | 'kg' | 'l';
  product?: string | Product;
  barCode?: string;
  receivedDate: Date | string;
  expirationDate?: Date | string;
  modifications?: {
    name: string;
    extraPrice: number;
    isExclusive?: boolean;
  }[];
}

export interface ProductSold {
  product: string | InventoryItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  companyId: string;
  _id?: string;
  product?: Product;
  user: string | User;
  date: Date;
  total: number;
  discount: number;
  iva?: number;
  productsSold: ProductSold[];
  paymentReference?: string;
  paymentMethod: 'cash' | 'credit';
  receivedAmount?: number;
  change?: number;
}

// Recetas
export interface RecipeRawMaterial {
  rawMaterial: string;
  quantity: number;
}

export interface Recipe {
  _id: string;
  name: string;
  description: string;
  company: string;
  rawMaterials: RecipeRawMaterial[];
}
