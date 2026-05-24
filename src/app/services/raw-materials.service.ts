import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface RawMaterial {
  _id?: string;
  name: string;
  description?: string;
  company?: string;
  measurementUnit: 'g' | 'ml' | 'unit';
  costPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RawMaterialsService {
  private url = `${environment.apiUrl}/raw-materials`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  createRawMaterial(data: RawMaterial, companyId: string): Observable<any> {
    return this.http.post<any>(`${this.url}/${companyId}`, data, this.authService.headers);
  }

  getCompanyRawMaterials(companyId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/company/${companyId}`, this.authService.headers);
  }

  getRawMaterial(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`, this.authService.headers);
  }

  updateRawMaterial(id: string, data: Partial<RawMaterial>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data, this.authService.headers);
  }

  deleteRawMaterial(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`, this.authService.headers);
  }
}
