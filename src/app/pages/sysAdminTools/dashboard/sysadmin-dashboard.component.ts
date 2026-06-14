import { Component, OnInit, OnDestroy } from '@angular/core';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ISysadminMetrics,
  IActivityFeedItem,
  ISystemError,
  ISystemErrorsResponse,
  IGlobalMetricsResponse,
} from 'src/app/interfaces/sysadmin.interface';

@Component({
  selector: 'app-sysadmin-dashboard',
  templateUrl: './sysadmin-dashboard.component.html',
  styleUrls: ['./sysadmin-dashboard.component.css'],
})
export class SysadminDashboardComponent implements OnInit, OnDestroy {
  // Metrics & Live Feed
  metrics: ISysadminMetrics = {
    gmv: 0,
    activeCompanies: 0,
    totalErrors: 0,
    openRegisters: 0,
  };
  liveFeed: IActivityFeedItem[] = [];
  autoRefreshSub?: Subscription;

  // Error Logs
  errors: ISystemError[] = [];
  errorsTotal: number = 0;
  errorsPage: number = 1;
  errorsPages: number = 1;
  loadingErrors: boolean = false;
  expandedErrorId?: string;

  constructor(private sysadminService: SysadminService) {}

  ngOnInit(): void {
    this.loadSystemErrors();

    // Auto-refresh control tower metrics every 20 seconds, avoiding race conditions
    this.autoRefreshSub = timer(0, 20000)
      .pipe(switchMap(() => this.sysadminService.getGlobalMetrics()))
      .subscribe({
        next: (resp: IGlobalMetricsResponse) => {
          if (resp.ok) {
            this.metrics = resp.metrics;
            this.liveFeed = resp.liveFeed || [];
          }
        },
        error: (err) => console.error('Error fetching global metrics:', err),
      });
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
  }

  // Cargar métricas manualmente
  loadControlTowerData() {
    this.sysadminService.getGlobalMetrics().subscribe({
      next: (resp: IGlobalMetricsResponse) => {
        if (resp.ok) {
          this.metrics = resp.metrics;
          this.liveFeed = resp.liveFeed || [];
        }
      },
    });
  }

  // Cargar log de errores del sistema
  loadSystemErrors() {
    this.loadingErrors = true;
    this.sysadminService.getSystemErrors({ page: this.errorsPage, limit: 10 }).subscribe({
      next: (resp: ISystemErrorsResponse) => {
        if (resp.ok) {
          this.errors = resp.errors || [];
          this.errorsTotal = resp.total;
          this.errorsPages = resp.pages;
        }
        this.loadingErrors = false;
      },
      error: () => {
        this.loadingErrors = false;
      },
    });
  }

  changeErrorsPage(page: number) {
    if (page >= 1 && page <= this.errorsPages) {
      this.errorsPage = page;
      this.loadSystemErrors();
    }
  }

  toggleExpandError(id: string) {
    this.expandedErrorId = this.expandedErrorId === id ? undefined : id;
  }

  // Análisis Forense
  selectedForensicSale: any = null;
  loadingForensic: boolean = false;

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
        // Handle error visually if needed
      },
    });
  }
}
