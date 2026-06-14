import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

const urlCustomers = `${environment.apiUrl}/customers`;

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createCustomer(customer: any, companyId: string) {
    return this.http.post<any>(`${urlCustomers}/company/${companyId}`, customer, this.authService.headers);
  }

  getCustomers(companyId: string, search: string = '', page: number = 1, limit: number = 10) {
    return this.http.get<any>(
      `${urlCustomers}/company/${companyId}?search=${search}&page=${page}&limit=${limit}`,
      this.authService.headers,
    );
  }

  searchCustomers(companyId: string, term: string) {
    return this.http.get<any>(`${urlCustomers}/company/${companyId}/search?term=${term}`, this.authService.headers);
  }

  getCustomerDetails(id: string) {
    return this.http.get<any>(`${urlCustomers}/${id}`, this.authService.headers);
  }

  updateCustomer(id: string, customerData: any) {
    return this.http.put<any>(`${urlCustomers}/${id}`, customerData, this.authService.headers);
  }

  deleteCustomer(id: string) {
    return this.http.delete<any>(`${urlCustomers}/${id}`, this.authService.headers);
  }
}
