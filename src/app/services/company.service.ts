import { Injectable } from '@angular/core';
import { Company } from '../interfaces/models.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';

const urlApi = `${environment.apiUrl}/companies`;
const urlApiCompanies = `${environment.apiUrl}/companies`;

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private logger: LoggerService,
  ) {}
  // Método para obtener empresas de prueba
  getCompanies() {
    return this.http.get<InventoryResponse>(`${urlApiCompanies}`, this.authService.headers);
  }
  getNumberOfCompanies() {
    return this.http.get<InventoryResponse>(`${urlApiCompanies}/number`, this.authService.headers);
  }
  getCompany(id: string) {
    return this.http.get<InventoryResponse>(`${urlApiCompanies}/${id}`, this.authService.headers);
  }
  deleteCompany(id: string) {
    return this.http.delete<InventoryResponse>(`${urlApiCompanies}/${id}`, this.authService.headers);
  }

  updateCompany(id: string, formData: FormData) {
    this.logger.log(formData);
    return this.http.put<InventoryResponse>(`${urlApiCompanies}/${id}`, formData, this.authService.headers);
  }

  updateCompanySettings(id: string, settings: any) {
    return this.http.put<any>(`${urlApiCompanies}/${id}`, settings, this.authService.headers);
  }

  createCompany(company: Company) {
    return this.http.post<InventoryResponse>(`${urlApiCompanies}`, company, this.authService.headers);
  }
}
