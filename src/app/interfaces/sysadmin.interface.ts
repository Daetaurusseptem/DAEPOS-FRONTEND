export interface ISysadminMetrics {
  gmv: number;
  activeCompanies: number;
  totalErrors: number;
  openRegisters: number;
}

export interface IActivityFeedItem {
  _id?: string;
  date: string;
  total: number;
  paymentMethod?: string;
  company?: {
    _id: string;
    name: string;
  };
  user?: {
    _id: string;
    name: string;
  };
  vendedor?: string;
}

export interface ISystemError {
  _id: string;
  timestamp: string;
  method: string;
  route: string;
  errorMessage: string;
  stackTrace?: string;
  status?: number;
  companyId?: {
    _id: string;
    name: string;
  };
}

export interface ISystemErrorsResponse {
  ok: boolean;
  errors: ISystemError[];
  total: number;
  page: number;
  pages: number;
}

export interface IGlobalMetricsResponse {
  ok: boolean;
  metrics: ISysadminMetrics;
  liveFeed: IActivityFeedItem[];
}

export interface IForensicSaleDetail {
  _id: string;
  total: number;
  discount: number;
  paymentMethod: string;
  payments: any[];
  date: string;
  receivedAmount?: number;
  change?: number;
  company: any;
  branch: any;
  user: any;
  cashRegister: any;
  customer?: any;
  appliedPromotion?: any;
  productsSold: {
    product: any;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    multiplier?: number;
    modifications?: any[];
  }[];
  deliveryDetails?: any;
}

export interface IForensicSaleResponse {
  ok: boolean;
  sale: IForensicSaleDetail;
}

export interface IGlobalTransactionsResponse {
  ok: boolean;
  transactions: any[];
  total: number;
  page: number;
  totalPages: number;
}
