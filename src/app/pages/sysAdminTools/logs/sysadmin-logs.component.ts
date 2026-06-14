import { Component, OnInit } from '@angular/core';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { CompanyService } from 'src/app/services/company.service';
import { ISystemErrorsResponse } from 'src/app/interfaces/sysadmin.interface';

@Component({
  selector: 'app-sysadmin-logs',
  templateUrl: './sysadmin-logs.component.html',
  styleUrls: ['./sysadmin-logs.component.css'],
})
export class SysadminLogsComponent implements OnInit {
  logs: any[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 20;
  totalPages: number = 1;

  loading: boolean = false;

  // Filters
  filters = {
    companyId: '',
    status: '',
    method: '',
    startDate: '',
    endDate: '',
  };

  companies: any[] = [];

  // Inspect Modal
  selectedLog: any | null = null;

  constructor(
    private sysadminService: SysadminService,
    private companyService: CompanyService,
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.searchLogs();
  }

  loadCompanies() {
    this.companyService.getCompanies().subscribe({
      next: (resp: any) => {
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

  searchLogs() {
    this.loading = true;
    const params = {
      page: this.page,
      limit: this.limit,
      ...this.filters,
    };

    this.sysadminService.getSystemErrors(params).subscribe({
      next: (resp: ISystemErrorsResponse) => {
        if (resp.ok) {
          this.logs = resp.errors || [];
          this.total = resp.total || 0;
          this.page = resp.page || 1;
          this.totalPages = resp.pages || 1;
        } else {
          this.logs = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.logs = [];
        this.loading = false;
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.searchLogs();
  }

  clearFilters() {
    this.filters = {
      companyId: '',
      status: '',
      method: '',
      startDate: '',
      endDate: '',
    };
    this.onFilterChange();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.searchLogs();
    }
  }

  openLogModal(log: any) {
    this.selectedLog = log;
  }
}
