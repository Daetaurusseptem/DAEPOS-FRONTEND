import { Injectable } from '@angular/core';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { environment } from 'src/environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Category, Product } from '../interfaces/models.interface';
import { of } from 'rxjs';

const urlProducts = `${environment.apiUrl}/products`


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }
  getProducts() {
    return this.http.get<InventoryResponse>(`${urlProducts}`,
      this.authService.headers
    );
  };
  getProduct(id: string) {
    return this.http.get<InventoryResponse>(`${urlProducts}/${id}`,
      this.authService.headers
    );
  };

  searchProductCompany(search: string = '', page: number = 1, limit: number = 5, companyId: string) {
    if (!companyId || companyId === 'undefined') {
      return of({ ok: true, items: [], products: [], totalItems: 0, totalPages: 0 } as any);
    }
    const params = {
      search,
      page: page.toString(),
      limit: limit.toString(),
      companyId
    };
    return this.http.get<InventoryResponse>(`${urlProducts}/search/${companyId}`, {
      params,
      ...this.authService.headers
    });
  }

  getCompanyProducts(id: string) {
    
    return this.http.get<InventoryResponse>(`${urlProducts}/company/${id}`, this.authService.headers);
  };
  getCompanyProductsSysadmin(id: string) {
    if (!id) {
        throw new Error("Company ID is required");
    }
    return this.http.get<InventoryResponse>(`${urlProducts}/company/sysadmin/${id}`, this.authService.headers);
}

  deleteProduct(id: string) {
    return this.http.delete<InventoryResponse>(`${urlProducts}/${id}`, this.authService.headers);
  }
  updateProduct(id: string, formData: FormData) {
    return this.http.put<InventoryResponse>(`${urlProducts}/${id}`, formData, this.authService.headers);
  };

  createProduct(empresaId: string, product: FormData) {
    return this.http.post<InventoryResponse>(`${urlProducts}/${empresaId}`, product, this.authService.headers);
  };

  bulkUploadProducts(companyId: string, payload: any) {
    return this.http.post<any>(`${urlProducts}/bulk/${companyId}`, payload, this.authService.headers);
  }
}
