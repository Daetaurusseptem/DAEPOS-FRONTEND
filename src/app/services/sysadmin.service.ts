import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const urlApi = `${environment.apiUrl}/sysadmin`;

@Injectable({
  providedIn: 'root'
})
export class SysadminService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

  getGlobalMetrics(): Observable<any> {
    return this.http.get<any>(`${urlApi}/metrics`, this.authService.headers);
  }

  onboardCompanyExpress(data: any): Observable<any> {
    return this.http.post<any>(`${urlApi}/onboard`, data, this.authService.headers);
  }

  impersonateCompany(companyId: string): Observable<any> {
    return this.http.post<any>(`${urlApi}/impersonate/${companyId}`, {}, this.authService.headers).pipe(
      tap((resp: any) => {
        if (resp.ok && resp.token) {
          // 1. Guardar copia de respaldo del SysAdmin original
          sessionStorage.setItem('admin-token', localStorage.getItem('token') || '');
          sessionStorage.setItem('admin-menu', localStorage.getItem('menu') || '');
          sessionStorage.setItem('admin-is-impersonating', 'true');
          sessionStorage.setItem('admin-company-name', resp.user.companyId?.name || 'Cliente');

          // 2. Establecer credenciales del cliente
          localStorage.setItem('token', resp.token);
          // Borrar el menú anterior para obligar a reconstruir con validarToken o dejar que se regenere
          localStorage.removeItem('menu');

          // 3. Recargar estado de sesión del cliente en memoria
          this.authService.validarToken().subscribe({
            next: () => {
              // Redireccionar al panel principal del administrador de la empresa
              this.router.navigateByUrl('/dashboard');
            }
          });
        }
      })
    );
  }

  isImpersonating(): boolean {
    return sessionStorage.getItem('admin-is-impersonating') === 'true';
  }

  getImpersonatedCompanyName(): string {
    return sessionStorage.getItem('admin-company-name') || 'Cliente';
  }

  exitImpersonation() {
    if (this.isImpersonating()) {
      const adminToken = sessionStorage.getItem('admin-token');
      const adminMenu = sessionStorage.getItem('admin-menu');

      // Wipen actual del cliente
      localStorage.clear();
      sessionStorage.clear();

      // Restaurar credenciales originales del SysAdmin
      if (adminToken) localStorage.setItem('token', adminToken);
      if (adminMenu) localStorage.setItem('menu', adminMenu);

      // Revalidar token original en memoria
      this.authService.validarToken().subscribe({
        next: () => {
          this.router.navigateByUrl('/dashboard/sysadmin/users');
        }
      });
    }
  }

  getSystemErrors(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${urlApi}/errors?page=${page}&limit=${limit}`, this.authService.headers);
  }
}
