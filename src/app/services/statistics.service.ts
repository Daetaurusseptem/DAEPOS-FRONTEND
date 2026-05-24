import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private baseUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) { }

  getSalesStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sales`);
  }

  getInventoryStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/items`);
  }

  getIngredientsStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ingredients`);
  }

  getTopSellingProductsByWeek(year: number, week: number, companyId: string, branchId?: string): Observable<any> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('week', week.toString())
      .set('companyId', companyId);

    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this.http.get<any>(`${this.baseUrl}/top-selling-products`, { params });
  }

  getIngredientsStatisticsByWeek(year: number, week: number, companyId: string, branchId?: string): Observable<any> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('week', week.toString())
      .set('companyId', companyId);

    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this.http.get<any>(`${this.baseUrl}/ingredients-statistics`, { params });
  }

  getDashboardSummary(companyId: string, branchId?: string): Observable<any> {
    let params = new HttpParams().set('companyId', companyId);
    if (branchId) {
      params = params.set('branchId', branchId);
    }
    return this.http.get<any>(`${this.baseUrl}/summary`, { params });
  }
}
