import { Component, OnInit } from '@angular/core';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { CompanyService } from 'src/app/services/company.service';
import { BranchService } from 'src/app/services/branch.service';
import { IGlobalTransactionsResponse, IForensicSaleDetail } from 'src/app/interfaces/sysadmin.interface';

@Component({
  selector: 'app-sysadmin-transactions',
  templateUrl: './sysadmin-transactions.component.html',
  styleUrls: ['./sysadmin-transactions.component.css'],
})
export class SysadminTransactionsComponent implements OnInit {
  transactions: any[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 20;
  totalPages: number = 1;

  loading: boolean = false;

  // Filters
  filters = {
    companyId: '',
    branchId: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
  };

  companies: any[] = [];
  branches: any[] = [];

  // Forensic Modal
  selectedForensicSale: IForensicSaleDetail | null = null;
  loadingForensic: boolean = false;

  constructor(
    private sysadminService: SysadminService,
    private companyService: CompanyService,
    private branchService: BranchService,
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.searchTransactions();
  }

  loadCompanies() {
    this.companyService.getCompanies().subscribe({
      next: (resp: any) => {
        // La API a veces no devuelve 'ok: true', así que buscamos directamente el arreglo
        if (resp.companies) {
          this.companies = resp.companies;
        } else if (resp.empresas) {
          this.companies = resp.empresas;
        } else if (Array.isArray(resp)) {
          this.companies = resp;
        } else if (resp.data && Array.isArray(resp.data)) {
          this.companies = resp.data;
        }
      },
      error: (err) => console.error('Error al cargar empresas', err),
    });
  }

  onCompanyChange() {
    this.filters.branchId = '';
    this.branches = [];
    if (this.filters.companyId) {
      this.branchService.getBranchesByCompany(this.filters.companyId).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this.branches = resp.branches || [];
          }
        },
      });
    }
    this.onFilterChange();
  }

  searchTransactions() {
    this.loading = true;
    const params = {
      page: this.page,
      limit: this.limit,
      ...this.filters,
    };

    this.sysadminService.searchGlobalTransactions(params).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.transactions = resp.transactions || [];
          this.total = resp.total || 0;
          this.page = resp.page || 1;
          this.totalPages = resp.totalPages || 1;
        } else {
          this.transactions = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching transactions', err);
        this.transactions = [];
        this.loading = false;
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.searchTransactions();
  }

  clearFilters() {
    this.filters = {
      companyId: '',
      branchId: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
    };
    this.onFilterChange();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.searchTransactions();
    }
  }

  openForensicModal(saleId: string | undefined) {
    if (!saleId) return;
    this.loadingForensic = true;
    this.selectedForensicSale = null;

    this.sysadminService.getSaleForensics(saleId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.selectedForensicSale = resp.sale;
        }
        this.loadingForensic = false;
      },
      error: () => {
        this.loadingForensic = false;
      },
    });
  }
}
