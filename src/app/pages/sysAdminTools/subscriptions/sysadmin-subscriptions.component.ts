import { Component, OnInit } from '@angular/core';
import { SysadminService } from 'src/app/services/sysadmin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sysadmin-subscriptions',
  templateUrl: './sysadmin-subscriptions.component.html',
  styleUrls: ['./sysadmin-subscriptions.component.css']
})
export class SysadminSubscriptionsComponent implements OnInit {

  companies: any[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 20;
  totalPages: number = 1;

  kpis: any = {
    active: 0,
    trialing: 0,
    pastDue: 0,
    canceled: 0,
    mrr: 0
  };

  loading: boolean = false;
  
  // Filters
  filters = {
    query: '',
    status: '',
    planId: ''
  };

  plans: any[] = [];

  // SaaS Override Modal
  selectedCompany: any | null = null;
  overrideData = {
    status: '',
    currentPeriodEnd: '',
    manualOverride: false
  };

  constructor(
    private sysadminService: SysadminService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.searchSubscriptions();
  }

  loadPlans() {
    this.sysadminService.getPlans().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.plans = resp.plans;
        }
      }
    });
  }

  searchSubscriptions() {
    this.loading = true;
    const params = {
      page: this.page,
      limit: this.limit,
      ...this.filters
    };

    this.sysadminService.searchSubscriptions(params).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.companies = resp.companies || [];
          this.total = resp.total || 0;
          this.page = resp.page || 1;
          this.totalPages = resp.pages || 1;
          if (resp.kpis) {
            this.kpis = resp.kpis;
          }
        } else {
          this.companies = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching subscriptions', err);
        this.companies = [];
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.page = 1;
    this.searchSubscriptions();
  }

  clearFilters() {
    this.filters = {
      query: '',
      status: '',
      planId: ''
    };
    this.onFilterChange();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.searchSubscriptions();
    }
  }
}
