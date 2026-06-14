import { Component, Input, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { User, Company, UserRole, Branch } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { UsersService } from 'src/app/services/users.service';
import { BranchService } from 'src/app/services/branch.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { LoggerService } from '../../../services/logger.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent {
  @Input() padre: boolean = false;
  adminId!: string;
  companyId!: string;
  users!: User[];
  company!: Company;
  userRole!: UserRole;
  branches: Branch[] = [];
  selectedBranchId: string = '';
  selectedRole: string = '';
  selectedStatus: string = 'active';
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  visiblePages: number[] = [];

  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private modalService: ModalService,
    private branchService: BranchService,
    private cashRegisterService: CashRegisterService,
    private router: Router,
    private logger: LoggerService,
  ) {
    this.adminId = this.authService.idUsuario;
    this.getRole();
    if (this.userRole == 'admin' || this.userRole == 'companyAdmin') {
      this.getCompanyUsers();
      this.getBranches();
    } else if (this.userRole == 'sysadmin') {
      this.getAllAdminUsers();
    }
  }

  ngOnInit() {}

  actualUserRole: string = '';

  getRole() {
    const role = this.authService.role;
    this.actualUserRole = role;
    this.userRole = role === 'companyAdmin' ? 'admin' : role;
  }

  getBranches() {
    this.companyId = this.authService.companyId;
    if (!this.companyId) return;

    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.branches = resp.branches;
        }
      },
    });
  }

  getCompanyUsers(page: number = 1): void {
    this.company = this.authService.getCompany;
    this.companyId = this.authService.companyId;

    this.userService
      .getAllNonAdminUsersOfCompany(
        this.adminId,
        page,
        this.itemsPerPage,
        this.searchTerm,
        this.selectedBranchId,
        this.selectedRole,
        this.selectedStatus,
      )
      .pipe(
        map((response) => {
          this.logger.log(response);
          this.totalPages = response.totalPages!;
          return response.users;
        }),
      )
      .subscribe((users) => {
        this.users = users!;
        this.currentPage = page;
        this.generateVisiblePages();
      });
  }

  getAllAdminUsers(page: number = 1): void {
    this.userService
      .getAllAdmins()
      .pipe(
        map((response) => {
          this.logger.log(response);
          this.totalPages = response.totalPages!;
          return response.users;
        }),
      )
      .subscribe((users) => {
        this.users = users!;

        this.currentPage = page;
        this.generateVisiblePages();
      });
  }

  onSearch(): void {
    this.currentPage = 1; // Resetear la página cuando se hace una nueva búsqueda
    if (this.userRole == 'admin' || this.userRole == 'companyAdmin') {
      this.getCompanyUsers(this.currentPage);
    } else if (this.userRole == 'sysadmin') {
      this.getAllAdminUsers(this.currentPage);
    }
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      if (this.userRole == 'admin' || this.userRole == 'companyAdmin') {
        this.getCompanyUsers(page);
      } else if (this.userRole == 'sysadmin') {
        this.getAllAdminUsers(page);
      }
    }
  }

  generateVisiblePages(): void {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    this.visiblePages = pages;
  }

  eliminarUsuario(id: string) {
    Swal.fire({
      title: '¿Desactivar Usuario?',
      text: 'Por favor, escribe el motivo de la desactivación de esta cuenta:',
      input: 'text',
      inputPlaceholder: 'Ej: Renuncia, despido, inasistencia...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
      confirmButtonColor: '#0f172a',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      preConfirm: (reason) => {
        if (!reason || reason.trim() === '') {
          Swal.showValidationMessage('Debes ingresar un motivo para la desactivación');
          return false;
        }
        return reason;
      },
    }).then((resp) => {
      if (resp.isConfirmed && resp.value) {
        const reason = resp.value;
        this.userService.deleteuserByCompanyAdmin(id, this.companyId, reason).subscribe(
          (resp) => {
            if (resp.ok) {
              Swal.fire({
                title: 'Usuario desactivado',
                text: 'La cuenta ha sido deshabilitada con éxito.',
                icon: 'success',
              });
              this.getCompanyUsers(this.currentPage); // Recargar lista de usuarios
            } else {
              Swal.fire({ title: 'Error', text: 'El usuario no pudo ser desactivado.', icon: 'error' });
            }
          },
          (err) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: err.error.msg || 'No se pudo desactivar el usuario.',
            });
          },
        );
      }
    });
  }

  reactivarUsuario(id: string) {
    Swal.fire({
      title: '¿Reactivar Usuario?',
      text: '¿Estás seguro de que deseas reactivar el acceso a este usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reactivar',
      confirmButtonColor: '#198754',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.toggleUserBlock(id, true).subscribe({
          next: () => {
            Swal.fire('Reactivado', 'El usuario vuelve a tener acceso al sistema.', 'success');
            this.onSearch();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.error || 'No se pudo reactivar el usuario', 'error');
          },
        });
      }
    });
  }
  abrirModal(element: Company | User, tipo: 'empresas' | 'usuarios' | 'productos') {
    const { _id } = element;
    this.modalService.abrirModal(element.img, tipo, _id!);
  }

  navigateToUserCajas(userId: string): void {
    this.router.navigate([`/dashboard/admin/users/${userId}/cajas`]);
  }

  selectRoleTab(role: string): void {
    this.selectedRole = role;
    this.getCompanyUsers(1);
  }
}
