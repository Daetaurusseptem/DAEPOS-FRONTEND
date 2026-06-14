import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

const urlSubs = `${environment.apiUrl}/subs`;

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createCheckoutSession(priceId: string) {
    return this.http.post<any>(`${urlSubs}/create-checkout-session`, { priceId }, this.authService.headers);
  }

  createPortalSession() {
    return this.http.post<any>(`${environment.apiUrl}/subs/portal`, {}, this.authService.headers);
  }

  getProducts() {
    return this.http.get<any>(urlSubs);
  }

  getDbPlans() {
    return this.http.get<any>(`${environment.apiUrl}/sysadmin/plans`, this.authService.headers);
  }
}
