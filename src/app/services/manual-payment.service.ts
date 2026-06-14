import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ManualPaymentService {
  private url = environment.apiUrl + '/manual-payments';
  private sysAdminUrl = environment.apiUrl + '/sysadmin';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Rutas CEO
  createPayment(amount: number, planRequested?: string) {
    return this.http.post<any>(this.url, { amount, planRequested }, this.authService.headers);
  }

  getMyPayments() {
    return this.http.get<any>(`${this.url}/my-payments`, this.authService.headers);
  }

  // Rutas Sysadmin & Global
  getGlobalSettings() {
    return this.http.get<any>(`${this.sysAdminUrl}/settings`, this.authService.headers);
  }

  updateGlobalSettings(data: any) {
    return this.http.put<any>(`${this.sysAdminUrl}/settings`, data, this.authService.headers);
  }

  getAllPayments(status?: string, companyId?: string) {
    let url = `${this.url}/sysadmin/all?`;
    if (status) url += `status=${status}&`;
    if (companyId) url += `companyId=${companyId}`;
    return this.http.get<any>(url, this.authService.headers);
  }

  approvePayment(id: string, data: any) {
    return this.http.put<any>(`${this.url}/sysadmin/${id}/approve`, data, this.authService.headers);
  }

  rejectPayment(id: string, adminNotes: string) {
    return this.http.put<any>(`${this.url}/sysadmin/${id}/reject`, { adminNotes }, this.authService.headers);
  }
}
