import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { User, Company } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserReComponent {
  userRole!: 'admin' | 'sysadmin' | 'user';
  companies!: Company[];
  companyId!: string;
  
  user: User = {
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
    companyId: ''
  };
  
  constructor(
    private userService: UsersService,
    private companiesService: CompanyService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.getRole();
  }
  
  getRole() {
    this.userRole = this.authService.role;
    if (this.userRole === 'admin') {
      this.user.role = 'user';
      this.companyId = this.authService.companyId!;
    } else if (this.userRole === 'sysadmin') {
      this.user.role = 'admin';
      this.companyId = ''; // Sysadmin no asigna companyId por defecto
    } else {
      this.user.role = 'user';
      this.companyId = this.authService.companyId!;
    }
  }
  
  createUser(form: NgForm) {
    if (this.userRole === 'user') {
      return; // Un usuario con rol 'user' no puede crear otros usuarios
    }
  
    if (form.valid) {
      if (this.userRole === 'admin') {
        this.user.companyId = this.authService.companyId!;
      } else if (this.userRole === 'sysadmin') {
        delete this.user.companyId; // Eliminar companyId para sysadmin
      }
  
      this.userService.createUser(this.user).subscribe({
        next: (createdUser) => {
          Swal.fire({
            text: 'Usuario creado correctamente',
            icon: 'success'
          }).then(() => {
            if (this.userRole === 'admin') {
              this.router.navigateByUrl('/dashboard/admin/users');
            } else if (this.userRole === 'sysadmin') {
              this.router.navigateByUrl('/dashboard/sysadmin/users');
            }
          });
        },
        error: (error) => {
          console.log(error);
          Swal.fire({
            text: error.msg,
            icon: 'error'
          });
        }
      });
    }
  }
}
