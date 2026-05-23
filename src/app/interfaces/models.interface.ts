// Interfaces for Angular based on Mongoose models

import { Provider } from "@angular/core";

export type UserRole = 'admin' | 'user' | 'sysadmin' | 'companyAdmin';

// User Interface
export interface User {
  uid?: string;
  _id?: string;
  companyId?: string;
  email: string;
  username: string;
  password: string;
  name?: string;
  role: UserRole;
  branch?: string | any;
  lastLogin?: Date;
  img?: string;
  permissions?: string[];
}

export interface PaymentBreakdown {
  cash: number;
  credit: number;
  debit: number;
}

export interface CashExpense {
  amount: number;
  reason: string;
  type: 'withdrawal' | 'expense';
  timestamp: Date | string;
}

export interface CashRegister {
  _id: string;
  user: any;
  physicalRegister: any;
  company: string;
  branch: string | Branch;
  startDate: Date | string;
  endDate?: Date | string;
  initialAmount: number;
  expectedAmount: number;
  actualAmount?: number;
  difference?: number;
  payments: PaymentBreakdown;
  expenses: CashExpense[];
  sales: string[] | any[];
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
  saleType: 'retail' | 'hospitality';
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
  status?: 'active' | 'pending_verification';
}

export interface InventoryItem {
  _id?: string;
  name: string;
  company: string;
  branch?: string | any;
  supplier: string | Supplier;
  stock: number;
  costPrice: number;
  sellingPrice?: number;
  measurement: 'unit' | 'g' | 'ml' | 'kg' | 'l';
  product?: string | Product;
  rawMaterial?: string | any;
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
export interface RecipeIngredient {
  ingredient: any; // ID o documento de RawMaterial
  quantity: number;
}

export interface Recipe {
  _id: string;
  name: string;
  description: string;
  company: string;
  ingredients: RecipeIngredient[];
}

export interface DashboardSummary {
  totalSalesToday: number;
  transactionsToday: number;
  lowStockCount: number;
  activeRegisters: number;
  recentSales: Sale[];
}

export interface Branch {
    _id?: string;
    company: string | Company;
    name: string;
    address: string;
    tel?: string;
    email?: string;
    manager?: string | User;
    saleType?: 'retail' | 'hospitality';
    loyaltySettings?: {
        enabled: boolean;
        identifierType: 'phone' | 'physical_card' | 'both';
        pointsEarnRate: number;
        pointsRedeemRate: number;
        maxRedemptionPercentage: number;
    };
    createdAt?: Date;
    isActive?: boolean;
}

export interface Customer {
    _id?: string;
    company: string;
    name: string;
    email?: string;
    phone?: string;
    cardNumber?: string;
    loyaltyPoints: number;
    tier: 'bronze' | 'silver' | 'gold';
    totalSpent: number;
    salesCount: number;
    isActive: boolean;
    createdAt?: Date;
}

export interface Promotion {
    _id?: string;
    company: string;
    code: string;
    description: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    minPurchaseAmount: number;
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
    usageLimit?: number;
    usageCount?: number;
    targetBranches?: string[] | any[];
    targetCategories?: string[] | any[];
}
