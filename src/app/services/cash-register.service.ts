import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

const baseUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class CashRegisterService {
  private url = `${baseUrl}/cash-registers`;
  private physicalUrl = `${baseUrl}/physical-registers`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  // --- Physical Registers ---
  getPhysicalRegisters(companyId: string, branchId?: string) {
    let url = `${this.physicalUrl}/company/${companyId}`;
    if (branchId) {
      url += `?branchId=${branchId}`;
    }
    return this.http.get<any>(url, this.authService.headers);
  }

  // --- Cash Register Sessions (Shifts) ---
  hasOpenCashRegister(userId: string) {
    return this.http.get<boolean>(`${this.url}/has-open/${userId}`);
  }

  openCashRegister(user: string, physicalRegister: string, initialAmount: number) {
    const data = { user, physicalRegister, initialAmount };
    return this.http.post<any>(`${this.url}/open`, data, this.authService.headers);
  }

  addExpense(id: string, amount: number, reason: string, type: 'withdrawal' | 'expense' = 'expense') {
    return this.http.post<any>(`${this.url}/expense/${id}`, { amount, reason, type }, this.authService.headers);
  }

  closeCashRegister(id: string, actualAmount: number, notes: string = '') {
    return this.http.post<any>(`${this.url}/close/${id}`, { actualAmount, notes }, this.authService.headers);
  }

  getOpenCashRegister(userId: string) {
    return this.http.get<any>(`${this.url}/open/${userId}`);
  }

  getOpenCashRegisterWithSales(userId: string) {
    return this.http.get<any>(`${this.url}/open-with-sales/${userId}`, this.authService.headers);
  }

  getCajaDetailsById(cajaId: string) {
    return this.http.get<any>(`${this.url}/cajas/${cajaId}`, this.authService.headers);
  }

  getUserCajasByDate(userId: string) {
    return this.http.get<any>(`${this.url}/user/${userId}/cajas`, this.authService.headers);
  }

  getUserCashRegistersByDate(userId: string, startDate: string) {
    return this.http.get<any>(`${this.url}/user/${userId}/cajas/${startDate}`, this.authService.headers);
  }

  // --- Monitoreo y Auditoría por Sucursal ---
  getActiveRegistersByBranch(branchId: string) {
    return this.http.get<any>(`${this.url}/active/branch/${branchId}`, this.authService.headers);
  }

  getCashRegistersHistory(branchId: string, filters: any = {}) {
    let queryParams = '';
    const keys = Object.keys(filters);
    if (keys.length > 0) {
      queryParams = '?' + keys.map(key => `${key}=${encodeURIComponent(filters[key])}`).join('&');
    }
    return this.http.get<any>(`${this.url}/history/branch/${branchId}${queryParams}`, this.authService.headers);
  }
}
