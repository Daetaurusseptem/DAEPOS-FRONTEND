import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Branch } from '../interfaces/models.interface';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private baseUrl = `${environment.apiUrl}/branches`;

  constructor(private http: HttpClient) { }

  getBranchesByCompany(companyId: string): Observable<{ ok: boolean, branches: Branch[] }> {
    return this.http.get<{ ok: boolean, branches: Branch[] }>(`${this.baseUrl}/company/${companyId}`);
  }

  createBranch(branch: Branch): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.post<{ ok: boolean, branch: Branch }>(this.baseUrl, branch);
  }

  updateBranch(id: string, branch: Branch): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.put<{ ok: boolean, branch: Branch }>(`${this.baseUrl}/${id}`, branch);
  }

  deleteBranch(id: string): Observable<{ ok: boolean, message: string }> {
    return this.http.delete<{ ok: boolean, message: string }>(`${this.baseUrl}/${id}`);
  }

  getBranchById(id: string): Observable<{ ok: boolean, branch: Branch }> {
    return this.http.get<{ ok: boolean, branch: Branch }>(`${this.baseUrl}/${id}`);
  }
}
