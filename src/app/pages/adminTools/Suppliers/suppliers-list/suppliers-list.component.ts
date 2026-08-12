import { Component, OnInit } from '@angular/core';
import { Supplier } from 'src/app/interfaces/models.interface';
import { SupplierService } from 'src/app/services/provider.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoggerService } from '../../../../services/logger.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'suppliers-list',
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.css'],
})
export class SuppliersListComponent implements OnInit {
  suppliers!: Supplier[];
  companyId!: string;

  constructor(
    private suppliersService: SupplierService,
    private router: Router,
    private authService: AuthService,
    private logger: LoggerService,
  ) {
    this.companyId = this.authService.companyId || this.authService.company?._id || '';
  }

  ngOnInit(): void {
    this.getSuppliers();
  }

  crearSupplier() {
    const cid = this.authService.companyId || this.authService.company?._id || this.companyId;
    this.router.navigateByUrl(`/dashboard/admin/suppliers/new/${cid}`);
  }

  getSuppliers() {
    const cid = this.authService.companyId || this.authService.company?._id || this.companyId;
    if (!cid) {
      console.error('No companyId found');
      return;
    }
    this.companyId = cid;
    this.suppliersService
      .getCompanySuppliers(cid)
      .pipe(
        map((i) => {
          this.logger.log('sups', i);
          return i.suppliers;
        }),
      )
      .subscribe(
        (suppliers) => {
          this.suppliers = suppliers!;
        },
        (error) => {
          console.error('Error al obtener los proveedores', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al obtener los proveedores',
          });
        },
      );
  }

  deleteSupplier(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.suppliersService.deleteSupplier(id).subscribe(
          () => {
            this.suppliers = this.suppliers.filter((supplier) => supplier._id !== id);
            Swal.fire('¡Eliminado!', 'El proveedor ha sido eliminado.', 'success');
          },
          (error) => {
            Swal.fire('Error', 'Hubo un problema al eliminar el proveedor.', 'error');
          },
        );
      }
    });
  }
}
