import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { User, Company, UserRole, Branch } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import { BranchService } from 'src/app/services/branch.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserReComponent {
  userRole!: UserRole;
  companies: Company[] = [];
  companyId: string = '';
  branches: Branch[] = [];
  
  user: User = {
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
    companyId: '',
    branch: '',
    permissions: []
  };

  availablePermissions = [
    { id: 'inventory_management', name: 'Gestión de Inventario' },
    { id: 'sales_reports', name: 'Ver Reportes de Ventas' },
    { id: 'customer_management', name: 'Gestión de Clientes' }
  ];
  
  constructor(
    private userService: UsersService,
    private companiesService: CompanyService,
    private authService: AuthService,
    private router: Router,
    private branchService: BranchService,
  ) {
    this.getRole();
  }

  togglePermission(permId: string) {
    const idx = this.user.permissions?.indexOf(permId);
    if (idx === -1 || idx === undefined) {
      this.user.permissions?.push(permId);
    } else {
      this.user.permissions?.splice(idx, 1);
    }
  }
  
  getRole() {
    this.userRole = this.authService.role;
    if (this.userRole === 'admin') {
      this.user.role = 'user';
      this.companyId = this.authService.companyId!;
      this.user.companyId = this.companyId;
      this.user.branch = this.authService.branch?._id;
    } else if (this.userRole === 'companyAdmin') {
      this.user.role = 'admin';
      this.companyId = this.authService.companyId!;
      this.user.companyId = this.companyId;
      this.getBranches();
    } else if (this.userRole === 'sysadmin') {
      this.user.role = 'admin';
      this.companyId = ''; 
      this.loadCompanies();
    } else {
      this.user.role = 'user';
      this.companyId = this.authService.companyId!;
    }
  }

  loadCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (resp: any) => {
        this.companies = resp.companies || [];
      }
    });
  }

  onCompanyChange() {
    this.user.companyId = this.companyId;
    this.user.branch = '';
    this.branches = [];
    if (this.companyId) {
      this.branchService.getBranchesByCompany(this.companyId).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this.branches = resp.branches || [];
          }
        }
      });
    }
  }

  onRoleChange() {
    // Limpiar campos según el rol seleccionado si somos sysadmin
    if (this.userRole === 'sysadmin') {
      if (this.user.role === 'sysadmin') {
        this.companyId = '';
        this.user.companyId = '';
        this.user.branch = '';
        this.branches = [];
      } else {
        this.onCompanyChange();
      }
    }
  }

  getBranches() {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.branches = resp.branches;
        }
      }
    });
  }
  
  createUser(form: NgForm) {
    if (this.userRole === 'user') {
      return; // Un usuario con rol 'user' no puede crear otros usuarios
    }
  
    if (form.valid) {
      if (this.userRole !== 'sysadmin') {
        this.user.companyId = this.authService.companyId!;
      } else {
        if (this.user.role === 'sysadmin') {
          delete this.user.companyId;
          delete this.user.branch;
        } else {
          this.user.companyId = this.companyId;
          if (this.user.role === 'companyAdmin') {
            delete this.user.branch;
          }
        }
      }
  
      this.userService.createUser(this.user).subscribe({
        next: (createdUser: any) => {
          Swal.fire({
            text: 'Usuario creado correctamente',
            icon: 'success'
          }).then(() => {
            if (this.userRole === 'admin' || this.userRole === 'companyAdmin') {
              this.router.navigateByUrl('/dashboard/admin/users');
            } else if (this.userRole === 'sysadmin') {
              this.router.navigateByUrl('/dashboard/sysadmin/users');
            }
          });
        },
        error: (error: any) => {
          console.log(error);
          Swal.fire({
            text: error.error?.msg || error.msg || 'Error al crear usuario',
            icon: 'error'
          });
        }
      });
    }
  }
}
