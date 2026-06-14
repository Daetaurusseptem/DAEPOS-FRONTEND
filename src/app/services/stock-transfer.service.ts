import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

const urlBase = `${environment.apiUrl}/stock-transfers`;

@Injectable({
  providedIn: 'root',
})
export class StockTransferService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createTransfer(transferData: any): Observable<any> {
    return this.http.post<any>(`${urlBase}`, transferData, this.authService.headers);
  }

  getTransfersByCompany(companyId: string): Observable<any> {
    return this.http.get<any>(`${urlBase}/company/${companyId}`, this.authService.headers);
  }
}
