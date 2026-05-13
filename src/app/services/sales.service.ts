import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private baseUrl = `${environment.apiUrl}/sales`;
  constructor(
              private http: HttpClient,
              private authService: AuthService,

            ) { }

  createSale(saleData: any) {
    console.log(saleData);
    return this.http.post<InventoryResponse>(this.baseUrl, saleData, this.authService.headers);
  }

  getSaleById(saleId: string) {
    return this.http.get<InventoryResponse>(`${this.baseUrl}/${saleId}`, this.authService.headers);
  }
}
