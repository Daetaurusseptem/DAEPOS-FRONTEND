import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Category, Supplier } from '../interfaces/models.interface';
import { LoggerService } from './logger.service';
const urlSuppliers = `${environment.apiUrl}/suppliers`;
@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private logger: LoggerService,
  ) {}
  getSuppliers() {
    return this.http.get<InventoryResponse>(`${urlSuppliers}`, this.authService.headers);
  }
  getSupplier(idSupplier: string) {
    return this.http.get<InventoryResponse>(`${urlSuppliers}/${idSupplier}`, this.authService.headers);
  }

  getCompanySuppliers(id: string) {
    return this.http.get<InventoryResponse>(`${urlSuppliers}/company/${id}`, this.authService.headers);
  }

  deleteSupplier(id: string) {
    return this.http.delete<InventoryResponse>(`${urlSuppliers}/${id}`, this.authService.headers);
  }

  updateSupplier(id: string, formData: any) {
    this.logger.log(formData);
    return this.http.put<InventoryResponse>(`${urlSuppliers}/${id}`, formData, this.authService.headers);
  }

  createSupplier(supplier: any, companyId: string) {
    return this.http.post<InventoryResponse>(`${urlSuppliers}/${companyId}`, supplier, this.authService.headers);
  }

  // Endpoints para reabastecimientos programados
  createRestockSchedule(restockData: any) {
    return this.http.post<InventoryResponse>(`${urlSuppliers}/restock/schedule`, restockData, this.authService.headers);
  }

  getCompanyRestocks(companyId: string) {
    return this.http.get<InventoryResponse>(`${urlSuppliers}/restock/company/${companyId}`, this.authService.headers);
  }

  updateRestockStatus(
    id: string,
    statusData: { status: string; expectedDate?: string; itemsSummary?: string; notes?: string },
  ) {
    return this.http.put<InventoryResponse>(`${urlSuppliers}/restock/${id}`, statusData, this.authService.headers);
  }

  deleteRestock(id: string) {
    return this.http.delete<InventoryResponse>(`${urlSuppliers}/restock/${id}`, this.authService.headers);
  }

  // --- ACUERDOS DE PRECIOS ---
  createSupplierAgreement(companyId: string, agreementData: any) {
    return this.http.post<InventoryResponse>(
      `${urlSuppliers}/agreement/${companyId}`,
      agreementData,
      this.authService.headers,
    );
  }

  getSupplierAgreements(companyId: string, supplierId: string) {
    return this.http.get<InventoryResponse>(
      `${urlSuppliers}/agreement/company/${companyId}?supplier=${supplierId}`,
      this.authService.headers,
    );
  }

  // --- AUDITORÍAS DE INVENTARIO ---
  getPendingAudits(companyId: string) {
    return this.http.get<any>(`${urlSuppliers}/audit/pending/${companyId}`, this.authService.headers);
  }

  resolveInventoryAudit(auditId: string, resolutionData: any) {
    return this.http.post<any>(`${urlSuppliers}/audit/resolve/${auditId}`, resolutionData, this.authService.headers);
  }
}
