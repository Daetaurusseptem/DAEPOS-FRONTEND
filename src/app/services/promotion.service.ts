import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

const urlPromotions = `${environment.apiUrl}/promotions`;

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  createPromotion(promotion: any, companyId: string) {
    return this.http.post<any>(`${urlPromotions}/company/${companyId}`, promotion, this.authService.headers);
  }

  getPromotions(companyId: string, search: string = '', branchId: string = '') {
    let url = `${urlPromotions}/company/${companyId}?search=${search}`;
    if (branchId) {
      url += `&branchId=${branchId}`;
    }
    return this.http.get<any>(url, this.authService.headers);
  }

  validateDiscountCode(companyId: string, code: string, ticketTotal: number, branchId?: string) {
    let url = `${urlPromotions}/company/${companyId}/validate/${code}?ticketTotal=${ticketTotal}`;
    if (branchId) {
      url += `&branchId=${branchId}`;
    }
    return this.http.get<any>(url, this.authService.headers);
  }

  updatePromotion(id: string, promotionData: any) {
    return this.http.put<any>(`${urlPromotions}/${id}`, promotionData, this.authService.headers);
  }

  deletePromotion(id: string) {
    return this.http.delete<any>(`${urlPromotions}/${id}`, this.authService.headers);
  }
}
