import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  IGlobalMetricsResponse,
  ISystemErrorsResponse,
  IForensicSaleResponse,
  IGlobalTransactionsResponse,
} from '../interfaces/sysadmin.interface';

const urlApi = `${environment.apiUrl}/sysadmin`;

@Injectable({
  providedIn: 'root',
})
export class SysadminService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
  ) {}

  getGlobalMetrics(): Observable<IGlobalMetricsResponse> {
    return this.http.get<IGlobalMetricsResponse>(`${urlApi}/metrics`, this.authService.headers);
  }

  getSaleForensics(saleId: string): Observable<IForensicSaleResponse> {
    return this.http.get<IForensicSaleResponse>(`${urlApi}/telemetry/sale/${saleId}`, this.authService.headers);
  }

  searchGlobalTransactions(params: any): Observable<IGlobalTransactionsResponse> {
    const options = {
      ...this.authService.headers,
      params,
    };
    return this.http.get<IGlobalTransactionsResponse>(`${urlApi}/telemetry/transactions`, options);
  }

  onboardCompanyExpress(data: any): Observable<any> {
    return this.http.post<any>(`${urlApi}/onboard`, data, this.authService.headers);
  }

  impersonateCompany(companyId: string): Observable<any> {
    return this.http.post<any>(`${urlApi}/impersonate/${companyId}`, {}, this.authService.headers).pipe(
      tap((resp: any) => {
        if (resp.ok && resp.token) {
          // 1. Guardar copia de respaldo del SysAdmin original
          sessionStorage.setItem('admin-token', localStorage.getItem('token') || '');
          sessionStorage.setItem('admin-menu', localStorage.getItem('menu') || '');
          sessionStorage.setItem('admin-is-impersonating', 'true');
          sessionStorage.setItem('admin-company-name', resp.user.companyId?.name || 'Cliente');

          // 2. Establecer credenciales del cliente
          localStorage.setItem('token', resp.token);
          // Borrar el menú anterior para obligar a reconstruir con validarToken o dejar que se regenere
          localStorage.removeItem('menu');

          // 3. Recargar estado de sesión del cliente en memoria
          this.authService.validarToken().subscribe({
            next: () => {
              // Redireccionar al panel principal del administrador de la empresa
              this.router.navigateByUrl('/dashboard');
            },
          });
        }
      }),
    );
  }

  isImpersonating(): boolean {
    return sessionStorage.getItem('admin-is-impersonating') === 'true';
  }

  getImpersonatedCompanyName(): string {
    return sessionStorage.getItem('admin-company-name') || 'Cliente';
  }

  exitImpersonation() {
    if (this.isImpersonating()) {
      const adminToken = sessionStorage.getItem('admin-token');
      const adminMenu = sessionStorage.getItem('admin-menu');

      // Wipen actual del cliente
      localStorage.clear();
      sessionStorage.clear();

      // Restaurar credenciales originales del SysAdmin
      if (adminToken) localStorage.setItem('token', adminToken);
      if (adminMenu) localStorage.setItem('menu', adminMenu);

      // Revalidar token original en memoria
      this.authService.validarToken().subscribe({
        next: () => {
          this.router.navigateByUrl('/dashboard/sysadmin/users');
        },
      });
    }
  }

  getSystemErrors(params: any): Observable<ISystemErrorsResponse> {
    const options = {
      ...this.authService.headers,
      params,
    };
    return this.http.get<ISystemErrorsResponse>(`${urlApi}/errors`, options);
  }

  getCompanyTelemetry(companyId: string): Observable<any> {
    return this.http.get<any>(`${urlApi}/telemetry/${companyId}`, this.authService.headers);
  }

  updateCompanySubscriptionManual(companyId: string, data: any): Observable<any> {
    return this.http.put<any>(`${urlApi}/subscription/${companyId}`, data, this.authService.headers);
  }

  getCompanyInvoices(companyId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/subs/admin/invoices/${companyId}`, this.authService.headers);
  }

  // Tiers & Subscription Plans
  getPlans(): Observable<any> {
    return this.http.get<any>(`${urlApi}/plans`, this.authService.headers);
  }

  getStripeProducts(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/subs`, this.authService.headers);
  }

  createPlan(data: any): Observable<any> {
    return this.http.post<any>(`${urlApi}/plans`, data, this.authService.headers);
  }

  updatePlan(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${urlApi}/plans/${id}`, data, this.authService.headers);
  }

  deletePlan(planId: string): Observable<any> {
    return this.http.delete(`${urlApi}/plans/${planId}`, this.authService.headers);
  }

  // -------------------------
  // Subscriptions & SaaS Override
  // -------------------------
  searchSubscriptions(params: any): Observable<any> {
    const options = {
      ...this.authService.headers,
      params,
    };
    return this.http.get(`${urlApi}/subscriptions`, options);
  }

  getSubscriptionDetails(companyId: string): Observable<any> {
    return this.http.get(`${urlApi}/subscriptions/${companyId}/details`, this.authService.headers);
  }

  overrideSubscription(companyId: string, data: any): Observable<any> {
    return this.http.put(`${urlApi}/subscriptions/${companyId}/override`, data, this.authService.headers);
  }
}
