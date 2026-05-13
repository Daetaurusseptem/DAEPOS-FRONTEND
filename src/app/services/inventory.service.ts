import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { InventoryItem } from '../interfaces/models.interface';
import { InventoryResponse } from '../interfaces/InventoryResponse.interface';
import { Observable } from 'rxjs';

const urlBase = `${environment.apiUrl}/inventory`;

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  getInventory(companyId: string, search: string = '', type: 'all' | 'product' | 'raw_material' = 'all'): Observable<InventoryResponse> {
    const params = { search, type };
    return this.http.get<InventoryResponse>(`${urlBase}/company/${companyId}`, { 
      params,
      ...this.authService.headers
    });
  }

  getInventoryByCategory(category: string, search: string = '', page: number = 1, limit: number = 10, companyId?: string): Observable<InventoryResponse> {
    const params = { category, search, page: page.toString(), limit: limit.toString() };
    const cid = companyId || this.authService.companyId;
    return this.http.get<InventoryResponse>(`${urlBase}/by-category/${cid}`, { 
      params,
      ...this.authService.headers
    });
  }

  getInventoryItemById(id: string): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${urlBase}/${id}`, this.authService.headers);
  }

  createInventoryItem(item: Partial<InventoryItem>): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(`${urlBase}`, item, this.authService.headers);
  }

  updateInventoryItem(id: string, item: Partial<InventoryItem>): Observable<InventoryResponse> {
    return this.http.put<InventoryResponse>(`${urlBase}/${id}`, item, this.authService.headers);
  }

  deleteInventoryItem(id: string): Observable<InventoryResponse> {
    return this.http.delete<InventoryResponse>(`${urlBase}/${id}`, this.authService.headers);
  }

  processSale(saleData: any): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(`${urlBase}/process-sale`, saleData, this.authService.headers);
  }
}
