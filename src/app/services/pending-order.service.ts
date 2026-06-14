import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

const urlPendingOrders = `${environment.apiUrl}/pending-orders`;

@Injectable({
  providedIn: 'root',
})
export class PendingOrderService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createPendingOrder(orderData: any) {
    return this.http.post<any>(urlPendingOrders, orderData, this.authService.headers);
  }

  getActivePendingOrders(branchId: string, companyId: string) {
    return this.http.get<any>(
      `${urlPendingOrders}?branchId=${branchId}&companyId=${companyId}`,
      this.authService.headers,
    );
  }

  updatePendingOrderStatus(id: string, status: string) {
    return this.http.put<any>(`${urlPendingOrders}/${id}/status`, { status }, this.authService.headers);
  }

  payAndClosePendingOrder(id: string, paymentData: any) {
    return this.http.post<any>(`${urlPendingOrders}/${id}/pay`, paymentData, this.authService.headers);
  }

  cancelPendingOrder(id: string) {
    return this.http.delete<any>(`${urlPendingOrders}/${id}`, this.authService.headers);
  }

  markOrderAsReady(id: string, preparedByUserId: string) {
    return this.http.put<any>(
      `${urlPendingOrders}/${id}/status`,
      { status: 'ready', preparedBy: preparedByUserId },
      this.authService.headers,
    );
  }

  deliverPendingOrder(id: string) {
    return this.http.put<any>(`${urlPendingOrders}/${id}/status`, { status: 'delivered' }, this.authService.headers);
  }

  addItemsToPendingOrder(id: string, newItemsData: any) {
    return this.http.put<any>(`${urlPendingOrders}/${id}/add-items`, newItemsData, this.authService.headers);
  }
}
