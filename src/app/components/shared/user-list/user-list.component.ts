import { Component, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { User, Company } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  @Input() padre: Boolean = false;
  adminId!: string;
  companyId!: string;
  users!: User[];
  company!: Company;
  userRole!: 'admin' | 'sysadmin' | 'user';
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  visiblePages: number[] = [];

  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private modalService: ModalService,
    private router: Router
  ) { 
    this.adminId = this.authService.idUsuario;
    this.getRole();
    if (this.userRole == 'admin') {
      this.getCompanyUsers();
    } else if (this.userRole == 'sysadmin') {
      this.getAllAdminUsers();
    }
  }

  ngOnInit() {}

  getRole() {
    this.userRole = this.authService.role;
  }

  getCompanyUsers(page: number = 1): void {
    this.company = this.authService.getCompany;
    this.companyId = this.authService.companyId;

    this.userService.getAllNonAdminUsersOfCompany(this.adminId, page, this.itemsPerPage, this.searchTerm)
      .pipe(map(response => {
        console.log(response);
        this.totalPages = response.totalPages!;
        return response.users
      }))
      .subscribe(users => {
        this.users = users!;
        this.currentPage = page;
        this.generateVisiblePages();
      });
  }

  getAllAdminUsers(page: number = 1): void {
    this.userService.getAllAdmins()
      .pipe(map(response => {
        console.log(response);
        this.totalPages = response.totalPages!;
        return response.users
      }))
      .subscribe(users => {
        this.users = users!;
        
        this.currentPage = page;
        this.generateVisiblePages();
      });
  }

  onSearch(): void {
    this.currentPage = 1; // Resetear la página cuando se hace una nueva búsqueda
    if (this.userRole == 'admin') {
      this.getCompanyUsers(this.currentPage);
    } else if (this.userRole == 'sysadmin') {
      this.getAllAdminUsers(this.currentPage);
    }
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      if (this.userRole == 'admin') {
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
    let end = Math.min(this.totalPages, start + maxVisible - 1);

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
      title: '¿Está Seguro?',
      text: 'Este proceso no se podrá deshacer',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#F56A52',
      iconColor: '#F56A52',
      allowEnterKey: false
    })
    .then(resp => {
      if (resp.isConfirmed) {
        this.userService.deleteuserByCompanyAdmin(id, this.companyId)
          .subscribe(resp => {
            if (resp.ok) {
              Swal.fire({ title: 'Registro eliminado', icon: 'success' });
              this.getCompanyUsers(this.currentPage); // Recargar lista de usuarios
            } else {
              Swal.fire({ title: 'El registro no pudo ser eliminado', icon: 'error' });
            }
          }, err => {
            Swal.fire({
              title: 'Registro no eliminado',
              icon: 'error',
              text: err.error.msg
            });
          });
      }
    });
  }

  abrirModal(element: Company | User, tipo: "empresas" | "usuarios" | "productos") {
    const { _id } = element;
    this.modalService.abrirModal(element.img, tipo, _id!);
  }

  navigateToCajasUsuario(userId: string): void {
    this.router.navigate([`/dashboard/admin/users/${userId}/cajas`]);
  }
}
