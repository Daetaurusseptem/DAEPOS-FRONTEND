import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { SupplierService } from 'src/app/services/provider.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-supplier',
  templateUrl: './create-supplier.component.html',
  styleUrls: ['./create-supplier.component.css']
})
export class CreateSupplierComponent implements OnInit {
  companyId = '';
  supplierForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private supplierService: SupplierService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    if (this.authService.usuario.role == 'sysadmin') {
      this.activatedRoute.params.subscribe(params => {
        console.log(params);
        this.companyId = params['id'];
        console.log(this.companyId);
      });
    } else {
      this.companyId = this.authService.companyId;
    }

    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      const obj = {
        name: this.supplierForm.get('name')?.value,
        description: this.supplierForm.get('description')?.value,
        contactInfo: {
          email: this.supplierForm.get('email')?.value,
          phone: this.supplierForm.get('phone')?.value,
          address: this.supplierForm.get('address')?.value,
        }
      };

      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Quieres guardar este proveedor?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardarlo'
      }).then((r) => {
        if (r.isConfirmed) {
          this.supplierService.createSupplier(obj, this.companyId).subscribe(
            resp => {
              console.log(resp);
              Swal.fire({
                text: 'Proveedor guardado',
                icon: 'success'
              }).then(res => {
                if (res.isConfirmed) {
                  this.router.navigateByUrl('/dashboard/admin');
                }
              });
            },
            error => {
              console.error('Error al guardar el proveedor', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el proveedor'
              });
            }
          );
        }
      });
    }
  }
}
