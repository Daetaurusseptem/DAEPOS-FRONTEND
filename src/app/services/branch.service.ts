import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Branch } from '../interfaces/models.interface';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private baseUrl = `${environment.apiUrl}/branches`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getBranchesByCompany(companyId: string): Observable<{ ok: boolean, branches: Branch[] }> {
    return this.http.get<{ ok: boolean, branches: Branch[] }>(`${this.baseUrl}/company/${companyId}`, this.authService.headers);
  }

  createBranch(branch: Branch): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.post<{ ok: boolean, branch: Branch }>(this.baseUrl, branch, this.authService.headers);
  }

  updateBranch(id: string, branch: Branch): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.put<{ ok: boolean, branch: Branch }>(`${this.baseUrl}/${id}`, branch, this.authService.headers);
  }

  deleteBranch(companyId: string, id: string): Observable<{ ok: boolean, message: string }> {
    return this.http.delete<{ ok: boolean, message: string }>(`${this.baseUrl}/${companyId}/${id}`, this.authService.headers);
  }

  getBranchById(id: string): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.get<{ ok: boolean, branch: Branch }>(`${this.baseUrl}/${id}`, this.authService.headers);
  }
}
