import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Category } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { CompanyService } from 'src/app/services/company.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-company-category',
  templateUrl: './create-company-category.component.html',
  styleUrls: ['./create-company-catregory.component.css']
})
export class CreateCompanyCategoryComponent {

  userRole!: 'admin' | 'sysadmin' | 'user';
  companies!: Category[];
  companyId!: string;

  category: Category = {
    name: '',
    description: '',
    companyId: ''
  }

  constructor(
    private categoryService: CategoryService,
    private companiesService: CompanyService,
    private authService: AuthService,
    private router: Router
  ) {
    this.getRole();
    this.getCompanyId();
  }

  getRole() {
    this.userRole = this.authService.role;
  }

  createCategory(form: NgForm) {
    if (this.userRole === 'user') {
      return;
    }

    if (form.valid) {
      console.log(form.value);
      this.categoryService.createCategory(this.category, this.authService.companyId!).subscribe({
        next: (createdCompany) => {
          Swal.fire({
            text: 'Categoría creada correctamente',
            icon: 'success'
          }).then(() => {
            if (this.userRole === 'admin') {
              this.router.navigateByUrl('/dashboard/admin/categories');
            } else if (this.userRole === 'sysadmin') {
              this.router.navigateByUrl('/dashboard/sysadmin/categories');
            }
          });
        },
        error: (error) => {
          Swal.fire({
            title: 'Error',
            text: 'La categoría no pudo ser creada',
            icon: 'error'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Formulario no válido',
        text: 'Por favor, completa todos los campos requeridos.',
        icon: 'warning'
      });
    }
  }

  getCompanyId() {
    if (this.authService.company && this.authService.companyId) {
      this.companyId = this.authService.companyId!;
      this.category.companyId = this.companyId;
    } else {
      console.log('No se encontró el ID de la compañía');
    }
  }

}
