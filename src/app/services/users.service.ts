import { Injectable } from '@angular/core';
import { User } from '../interfaces/models.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { LoggerService } from './logger.service';

const urlApi = `${environment.apiUrl}`;
const urlApiUsers = `${environment.apiUrl}/users`;

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private logger: LoggerService,
  ) {}

  // Método para obtener empresas de prueba
  getUsers() {
    return this.http.get<User[]>(`${urlApiUsers}`, this.authService.headers);
  }
  getNumberUsers() {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/number`, this.authService.headers);
  }
  getUserById(id: string) {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/${id}`, this.authService.headers);
  }
  getUserByIdAdminCompany(id: string) {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/solo/${id}`, this.authService.headers);
  }
  getCompanyAdmin(id: string) {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/admin/${id}`, this.authService.headers);
  }

  getAllNonAdminUsersOfCompany(
    adminId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    branchId: string = '',
    role: string = '',
    status: string = '',
  ): Observable<any> {
    let url = `${urlApiUsers}/company/${adminId}?page=${page}&limit=${limit}&search=${search}`;
    if (branchId) {
      url += `&branchId=${branchId}`;
    }
    if (role) {
      url += `&role=${role}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<any>(url, this.authService.headers);
  }
  getAllUsersOfCompany(userId: string) {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/sysadmin/${userId}`, this.authService.headers);
  }
  getAllAdmins() {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/admins/all`, this.authService.headers);
  }
  getAllSysadmins() {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/sysadmins/all`, this.authService.headers);
  }
  getUnassignedAdmins() {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/admins/unassigned`, this.authService.headers);
  }
  toggleUserBlock(id: string, active: boolean) {
    if (this.authService.role === 'sysadmin') {
      return this.http.put<InventoryResponse>(
        `${urlApiUsers}/${id}/toggle-block`,
        { active },
        this.authService.headers,
      );
    } else {
      return this.http.put<InventoryResponse>(
        `${urlApiUsers}/admin/${this.authService.companyId}/${id}/toggle-block`,
        { active },
        this.authService.headers,
      );
    }
  }
  isAdmin(empresaId: string, adminId: string) {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/admins/${empresaId}/${adminId}`, this.authService.headers);
  }
  deleteuser(id: string, reason: string = 'Desactivado por el administrador') {
    return this.http.delete<InventoryResponse>(`${urlApiUsers}/${id}`, {
      body: { reason },
      ...this.authService.headers,
    });
  }

  deleteuserByCompanyAdmin(id: string, companyId: string, reason: string = 'Desactivado por el administrador') {
    return this.http.delete<InventoryResponse>(`${urlApiUsers}/admin/${companyId}/${id}`, {
      body: { reason },
      ...this.authService.headers,
    });
  }

  updateUser(id: string, formData: FormData) {
    this.logger.log(formData);
    return this.http.put<InventoryResponse>(`${urlApiUsers}/${id}`, formData, this.authService.headers);
  }
  availableAdmins() {
    return this.http.get<InventoryResponse>(`${urlApiUsers}/company/admins/unassigned`, this.authService.headers);
  }
  createUser(user: User) {
    return this.http.post<InventoryResponse>(`${urlApiUsers}`, user, this.authService.headers);
  }
}
