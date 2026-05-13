import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Supplier } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { SupplierService } from 'src/app/services/provider.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-suppliers',
  templateUrl: './update-suppliers.component.html',
  styleUrls: ['./update-suppliers.component.css']
})
export class UpdateSuppliersComponent implements OnInit {

  supplier!: Supplier;
  id: string = '';

  supplierForm: FormGroup = this.fb.group({
    description: ['', Validators.required],
    email: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    name: ['', Validators.required],
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private supplierService: SupplierService,
    private authService: AuthService,
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.id = params['id'];
      this.getsupplier(this.id);
    });
  }

  ngOnInit() {}

  getsupplier(id: string) {
    return this.supplierService.getSupplier(id)
      .pipe(
        map(item => {
          console.log(item);
          return item.supplier;
        })
      )
      .subscribe(supplier => {
        this.supplier = supplier!;

        this.supplierForm.setValue({
          description: this.supplier.description,
          email: this.supplier.contactInfo.email,
          phone: this.supplier.contactInfo.phone,
          address: this.supplier.contactInfo.address,
          name: this.supplier.name,
        });
      }, error => {
        console.error('Error al obtener el proveedor', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al obtener el proveedor'
        });
      });
  }

  updateSupplier() {
    if (this.supplierForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas actualizar este proveedor?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      }).then(resp => {
        if (resp.isConfirmed) {
          const obj = {
            name: this.supplierForm.get('name')?.value,
            description: this.supplierForm.get('description')?.value,
            contactInfo: {
              email: this.supplierForm.get('email')?.value,
              phone: this.supplierForm.get('phone')?.value,
              address: this.supplierForm.get('address')?.value,
            }
          };
          this.supplierService.updateSupplier(this.supplier._id!, obj)
            .subscribe(() => {
              Swal.fire({
                icon: 'success',
                title: 'Proveedor actualizado',
                text: 'El proveedor ha sido actualizado exitosamente',
              }).then(() => {
                this.router.navigateByUrl('/dashboard/sysadmin/companies');
              });
            }, error => {
              console.error('Error al actualizar el proveedor', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar el proveedor'
              });
            });
        }
      }).catch(r => {
        console.error('Error en la actualización', r);
      });
    }
  }

  campoNoValidoDatosUsuario(campo: string): boolean {
    return this.supplierForm.get(campo)?.invalid || false;
  }
}
